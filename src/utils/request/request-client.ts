import CONFIG from '@/constant/config'
import type { BusinessResponse, RequestConfig, Response, Interceptors } from './types'
import { ParamConverter } from './param-converter'
import { LoginManager } from './login-manager'
import { CacheManager } from '@/utils/cache-manager'
import { CACHE_KEYS } from '@/stores/cache'
import { logger } from '@/utils/logger'

export class Request {
  public interceptors: Interceptors
  private requestHandlers: Array<(config: RequestConfig) => RequestConfig | Promise<RequestConfig>> = []
  private responseHandlers: Array<(response: Response) => Response | Promise<Response>> = []
  private loginManager: LoginManager
  private isHandlingLoginExpired: boolean = false
  private loginExpiredQueue: Array<{ config: RequestConfig; resolve: Function; reject: Function }> = []
  private retryHistory: Map<string, { count: number; lastRetryTime: number }> = new Map()
  private readonly MAX_RETRY_PER_REQUEST: number = 1
  private cleanupTimer: number | null = null

  constructor() {
    this.loginManager = new LoginManager(this)
    this.interceptors = {
      request: {
        use: (handler) => {
          this.requestHandlers.push(handler)
        }
      },
      response: {
        use: (handler) => {
          this.responseHandlers.push(handler)
        }
      }
    }

    // 启动定时清理，在请求时也会自动清理
    this.startCleanupTimer()
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer !== null) {
      return
    }
    this.cleanupTimer = setInterval(() => {
      this.cleanupRetryHistory()
    }, 60 * 60 * 1000) as unknown as number
  }

  /**
   * 停止清理定时器
   */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }

  /**
   * 销毁实例，清理资源
   */
  destroy(): void {
    this.stopCleanupTimer()
    this.retryHistory.clear()
    this.loginExpiredQueue = []
  }

  /**
   * 获取完整URL
   */
  private getFullUrl(url: string, params?: any): string {
    if (!params || Object.keys(params).length === 0) {
      return url.startsWith('http') ? url : `${CONFIG.baseURL}${url}`
    }
    const queryString = Object.keys(params)
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&')
    const separator = url.includes('?') ? '&' : '?'
    return url.startsWith('http') ? `${url}${separator}${queryString}` : `${CONFIG.baseURL}${url}${separator}${queryString}`
  }

  /**
   * 原始请求方法，绕过所有拦截器和业务逻辑
   * 专门用于登录请求，避免循环依赖和拦截器干扰
   */
  rawRequest<T = any>(url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any, headers?: Record<string, string>): Promise<Response<T>> {
    const fullUrl = url.startsWith('http') ? url : `${CONFIG.baseURL}${url}`
    
    return new Promise((resolve, reject) => {
      uni.request({
        url: fullUrl,
        method,
        data,
        header: {
          'Content-Type': 'application/json',
          ...headers
        },
        timeout: 10000,
        success: (res: any) => {
          // 只做基本的响应转换，不经过拦截器和业务逻辑
          const convertedResponse = { ...res, data: ParamConverter.toCamelCase(res.data) }
          resolve(convertedResponse)
        },
        fail: (error: any) => {
          reject(error)
        }
      })
    })
  }

  private async executeRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let result = config
    for (const handler of this.requestHandlers) {
      result = await handler(result)
    }
    return result
  }

  private async executeResponseInterceptors(response: Response): Promise<Response> {
    let result = response
    for (const handler of this.responseHandlers) {
      result = await handler(result)
    }
    return result
  }

  private showLoading(text: string = '加载中...') {
    uni.showLoading({ title: text, mask: true })
  }

  private hideLoading() {
    uni.hideLoading()
  }

  /**
   * 安全隐藏 loading，避免重复调用
   */
  private safeHideLoading(config: RequestConfig): void {
    if (config.showLoading) {
      this.hideLoading()
    }
  }

  private async request<T = any>(config: RequestConfig): Promise<Response<T>> {
    const requestId = logger.logRequestStart(config.url, config.method || 'GET', config.data || config.params)
    
    try {
      const interceptedConfig = await this.executeRequestInterceptors(config)

      if (interceptedConfig.showLoading) {
        this.showLoading(interceptedConfig.loadingText)
      }

      // 清理过期的重试历史
      this.cleanupRetryHistory()

      let finalUrl = interceptedConfig.url
      let finalData = interceptedConfig.data

      if (interceptedConfig.method === 'GET' && interceptedConfig.params) {
        finalUrl = this.getFullUrl(interceptedConfig.url, interceptedConfig.params)
        finalData = undefined
      } else if (interceptedConfig.method === 'GET' && interceptedConfig.data) {
        finalUrl = this.getFullUrl(interceptedConfig.url, interceptedConfig.data)
        finalData = undefined
      } else {
        finalUrl = this.getFullUrl(interceptedConfig.url)
        if (finalData) {
          finalData = ParamConverter.toSnakeCase(finalData)
        }
      }

      return new Promise((resolve, reject) => {
        uni.request({
          url: finalUrl,
          method: interceptedConfig.method || 'GET',
          data: finalData,
          header: {
            'Content-Type': 'application/json',
            ...interceptedConfig.headers
          },
          timeout: interceptedConfig.timeout || 10000,
          success: async (res: any) => {
            try {
              this.safeHideLoading(interceptedConfig)

              const convertedResponse = { ...res, data: ParamConverter.toCamelCase(res.data) }

              const interceptedResponse = await this.executeResponseInterceptors(convertedResponse)

              if (interceptedResponse.statusCode >= 200 && interceptedResponse.statusCode < 300) {
                const businessData = interceptedResponse.data as BusinessResponse
                if (businessData && businessData.errCode === 0) {
                  logger.logRequestSuccess(requestId, interceptedResponse.statusCode, businessData.data)
                  resolve(interceptedResponse)
                } else if (businessData && businessData.errCode === -100004) {
                  // 登录过期错误
                  if (!this.shouldRetryRequest(interceptedConfig)) {
                    logger.logRequestError(requestId, businessData, interceptedConfig)
                    reject(businessData)
                    return
                  }
                  await this.handleLoginExpiredWithQueue(interceptedConfig, resolve, reject, requestId)
                } else {
                  // 业务错误
                  logger.logRequestError(requestId, businessData, interceptedConfig)
                  reject(businessData)
                }
              } else {
                // HTTP错误
                logger.logRequestError(requestId, interceptedResponse, interceptedConfig)
                reject(interceptedResponse)
              }
            } catch (error) {
              this.safeHideLoading(interceptedConfig)
              logger.logRequestError(requestId, error, interceptedConfig)
              reject(error)
            }
          },
          fail: (error: any) => {
            this.safeHideLoading(interceptedConfig)
            logger.logRequestError(requestId, error, interceptedConfig)
            reject(error)
          }
        })
      })
    } catch (error) {
      this.safeHideLoading(config)
      logger.logRequestError(requestId, error, config)
      return Promise.reject(error)
    }
  }

  private async handleLoginExpiredWithQueue(config: RequestConfig, resolve: Function, reject: Function, requestId: string): Promise<void> {
    this.loginExpiredQueue.push({ config, resolve, reject })
    if (this.isHandlingLoginExpired) {
      return
    }
    try {
      this.isHandlingLoginExpired = true
      logger.info(`[Request ${requestId}] 登录过期，开始重新登录`)
      const loginResult = await this.loginManager.handleLoginExpired(config, this)
      if (loginResult) {
        logger.info(`[Request ${requestId}] 重新登录成功，重试请求`)
        await this.retryQueuedRequestsOnce()
      } else {
        logger.error(`[Request ${requestId}] 重新登录失败`)
        this.rejectQueuedRequests(new Error('登录失败'))
      }
    } catch (error) {
      logger.error(`[Request ${requestId}] 登录处理异常`, { error })
      this.rejectQueuedRequests(error as Error)
    } finally {
      this.isHandlingLoginExpired = false
      this.loginExpiredQueue = []
    }
  }

  private async retryQueuedRequestsOnce(): Promise<void> {
    const requestsToRetry = [...this.loginExpiredQueue]
    for (const { config, resolve, reject } of requestsToRetry) {
      try {
        if (!this.shouldRetryRequest(config)) {
          reject(new Error('请求已达到最大重试次数'))
          continue
        }
        this.recordRetryHistory(config)
        await new Promise((r) => setTimeout(r, 100))
        const retryResult = await this.retryRequestOnce(config)
        resolve(retryResult)
      } catch (error) {
        reject(error)
      }
    }
  }

  private async retryRequestOnce(config: RequestConfig): Promise<any> {
    switch (config.method) {
      case 'GET':
        return this.get(config.url, config.params, config)
      case 'POST':
        return this.post(config.url, config.data, config)
      case 'PUT':
        return this.put(config.url, config.data, config)
      case 'DELETE':
        return this.delete(config.url, config.params, config)
      default:
        return this.get(config.url, config.params, config)
    }
  }

  private rejectQueuedRequests(error: Error): void {
    for (const { reject } of this.loginExpiredQueue) {
      reject(error)
    }
  }

  async get<T = any>(url: string, params?: any, config?: Partial<RequestConfig>): Promise<Response<T>> {
    return this.request<T>({ url, method: 'GET', params, ...config })
  }

  async post<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<Response<T>> {
    return this.request<T>({ url, method: 'POST', data, ...config })
  }

  async put<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<Response<T>> {
    return this.request<T>({ url, method: 'PUT', data, ...config })
  }

  async delete<T = any>(url: string, params?: any, config?: Partial<RequestConfig>): Promise<Response<T>> {
    return this.request<T>({ url, method: 'DELETE', params, ...config })
  }

  /**
   * 重置登录过期状态
   */
  resetLoginExpiredState(): void {
    this.isHandlingLoginExpired = false
  }

  private shouldRetryRequest(config: RequestConfig): boolean {
    if (config.headers && config.headers['no-retry'] === 'true') {
      return false
    }
    if (config.url.includes('/api/so/user/login')) {
      return false
    }
    const requestKey = `${config.method}:${config.url}`
    const retryInfo = this.retryHistory.get(requestKey)
    if (retryInfo && retryInfo.count >= this.MAX_RETRY_PER_REQUEST) {
      return false
    }
    return true
  }

  private recordRetryHistory(config: RequestConfig): void {
    const requestKey = `${config.method}:${config.url}`
    const retryInfo = this.retryHistory.get(requestKey)
    if (retryInfo) {
      retryInfo.count++
      retryInfo.lastRetryTime = Date.now()
    } else {
      this.retryHistory.set(requestKey, { count: 1, lastRetryTime: Date.now() })
    }
  }

  /**
   * 清理过期的重试历史记录
   */
  private cleanupRetryHistory(): void {
    const now = Date.now()
    const oneHour = 60 * 60 * 1000
    const entries = Array.from(this.retryHistory.entries())
    let cleanedCount = 0
    
    for (const [key, value] of entries) {
      if (now - value.lastRetryTime > oneHour) {
        this.retryHistory.delete(key)
        cleanedCount++
      }
    }
    
    if (cleanedCount > 0) {
      logger.info(`清理了 ${cleanedCount} 条过期的重试历史记录`)
    }
  }
}

const request = new Request()

// 请求拦截器：自动添加token
request.interceptors.request.use((config) => {
  const token = CacheManager.get(CACHE_KEYS.TOKEN)
  if (token) {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` }
  }
  return config
})

export default request
