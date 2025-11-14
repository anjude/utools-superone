import CONFIG from '@/constants/config'
import type { BusinessResponse, RequestConfig, Response, Interceptors } from './types'
import { ParamConverter } from './param-converter'
import { CacheManager } from '@/utils/cache-manager'
import { CACHE_KEYS } from '@/stores/cache'
import { logger } from '@/utils/logger'

export class Request {
  public interceptors: Interceptors
  private requestHandlers: Array<
    (config: RequestConfig) => RequestConfig | Promise<RequestConfig>
  > = []
  private responseHandlers: Array<(response: Response) => Response | Promise<Response>> = []

  constructor() {
    this.interceptors = {
      request: {
        use: handler => {
          this.requestHandlers.push(handler)
        },
      },
      response: {
        use: handler => {
          this.responseHandlers.push(handler)
        },
      },
    }
  }

  /**
   * 销毁实例，清理资源
   */
  destroy(): void {
    // 清理资源
  }

  /**
   * 获取完整URL
   */
  private getFullUrl(url: string, params?: any): string {
    if (!params || Object.keys(params).length === 0) {
      return url.startsWith('http') ? url : `${CONFIG.baseURL}${url}`
    }
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&')
    const separator = url.includes('?') ? '&' : '?'
    return url.startsWith('http')
      ? `${url}${separator}${queryString}`
      : `${CONFIG.baseURL}${url}${separator}${queryString}`
  }

  /**
   * 原始请求方法，绕过所有拦截器和业务逻辑
   * 专门用于登录请求，避免循环依赖和拦截器干扰
   */
  async rawRequest<T = any>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    customHeaders?: Record<string, string>
  ): Promise<Response<T>> {
    const fullUrl = url.startsWith('http') ? url : `${CONFIG.baseURL}${url}`

    try {
      const response = await fetch(fullUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...customHeaders,
        },
        body: data ? JSON.stringify(data) : null,
      })

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`)
      }

      const jsonData = await response.json()
      const convertedData = ParamConverter.toCamelCase(jsonData)

      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      return {
        data: convertedData,
        statusCode: response.status,
        header: responseHeaders,
        cookies: [],
      }
    } catch (error) {
      throw error
    }
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

  /**
   * 跳转到登录页
   */
  private navigateToLogin(): void {
    try {
      if (window.utools && typeof window.utools.redirect === 'function') {
        // utools redirect 需要传入 code 和 payload
        // 使用空字符串作为 payload，或者传入一个文本类型的 payload
        window.utools.redirect('login', { type: 'text', data: '' })
      } else {
        logger.warn('无法跳转到登录页：utools.redirect 方法不可用')
      }
    } catch (error) {
      logger.error('跳转登录页失败', { error })
    }
  }

  private async request<T = any>(config: RequestConfig): Promise<Response<T>> {
    const requestId = logger.logRequestStart(
      config.url,
      config.method || 'GET',
      config.data || config.params
    )

    try {
      const interceptedConfig = await this.executeRequestInterceptors(config)

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

      try {
        const response = await fetch(finalUrl, {
          method: interceptedConfig.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...interceptedConfig.headers,
          },
          body: finalData ? JSON.stringify(finalData) : null,
        })

        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status}`)
        }

        const jsonData = await response.json()
        const convertedData = ParamConverter.toCamelCase(jsonData)

        const headers: Record<string, string> = {}
        response.headers.forEach((value, key) => {
          headers[key] = value
        })

        const convertedResponse: Response = {
          data: convertedData,
          statusCode: response.status,
          header: headers,
          cookies: [],
        }

        const interceptedResponse = await this.executeResponseInterceptors(convertedResponse)

        if (interceptedResponse.statusCode >= 200 && interceptedResponse.statusCode < 300) {
          const businessData = interceptedResponse.data as BusinessResponse
          // 兼容处理：支持 errCode 和 err_code 两种格式
          const errCode = businessData?.errCode ?? (businessData as any)?.err_code

          if (businessData && errCode === 0) {
            logger.logRequestSuccess(requestId, interceptedResponse.statusCode, businessData.data)
            return interceptedResponse
          } else if (businessData && errCode === -100004) {
            // 登录过期错误，跳转登录页
            logger.logRequestError(requestId, businessData, interceptedConfig)
            this.navigateToLogin()
            return Promise.reject(businessData)
          } else {
            // 业务错误
            logger.logRequestError(requestId, businessData, interceptedConfig)
            return Promise.reject(businessData)
          }
        } else {
          // HTTP错误
          logger.logRequestError(requestId, interceptedResponse, interceptedConfig)
          return Promise.reject(interceptedResponse)
        }
      } catch (error) {
        logger.logRequestError(requestId, error, interceptedConfig)
        return Promise.reject(error)
      }
    } catch (error) {
      logger.logRequestError(requestId, error, config)
      return Promise.reject(error)
    }
  }

  async get<T = any>(
    url: string,
    params?: any,
    config?: Partial<RequestConfig>
  ): Promise<Response<T>> {
    return this.request<T>({ url, method: 'GET', params, ...config })
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: Partial<RequestConfig>
  ): Promise<Response<T>> {
    return this.request<T>({ url, method: 'POST', data, ...config })
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: Partial<RequestConfig>
  ): Promise<Response<T>> {
    return this.request<T>({ url, method: 'PUT', data, ...config })
  }

  async delete<T = any>(
    url: string,
    params?: any,
    config?: Partial<RequestConfig>
  ): Promise<Response<T>> {
    return this.request<T>({ url, method: 'DELETE', params, ...config })
  }
}

const request = new Request()

// 请求拦截器：自动添加token
request.interceptors.request.use(config => {
  const token = CacheManager.get(CACHE_KEYS.TOKEN)
  if (token) {
    // 确保 token 不包含 "Bearer " 前缀，避免重复添加
    const cleanToken =
      typeof token === 'string' && token.startsWith('Bearer ') ? token.substring(7) : token
    config.headers = { ...config.headers, Authorization: `Bearer ${cleanToken}` }
  }
  return config
})

export default request
