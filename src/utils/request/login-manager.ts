import CONFIG from '@/constant/config'
import type { RequestConfig } from './types'
import type { Request } from './request-client'
import { CacheManager } from '@/utils/cache-manager'
import { CACHE_KEYS } from '@/stores/cache'

export class LoginManager {
  private requestInstance: Request
  private isLoggingIn: boolean = false
  private retryCount: number = 0
  private readonly MAX_RETRY_COUNT: number = 3
  private lastLoginSuccessTime: number = 0
  private readonly LOGIN_SUCCESS_COOLDOWN: number = 5000

  constructor(requestInstance: Request) {
    this.requestInstance = requestInstance
  }

  private getPlatform(): string {
    // #ifdef MP-WEIXIN
    return 'mp-weixin'
    // #endif
    // #ifdef MP-ALIPAY
    return 'mp-alipay'
    // #endif
    // #ifdef MP-BAIDU
    return 'mp-baidu'
    // #endif
    // #ifdef MP-TOUTIAO
    return 'mp-toutiao'
    // #endif
    // #ifdef MP-QQ
    return 'mp-qq'
    // #endif
    // #ifdef MP-KUAISHOU
    return 'mp-kuaishou'
    // #endif
    // #ifdef H5
    return 'h5'
    // #endif
    // #ifdef APP-PLUS
    return 'app'
    // #endif
    return 'unknown'
  }

  private getEnvVersion(): string {
    // #ifdef MP-WEIXIN
    // @ts-ignore
    return __wxConfig?.envVersion || 'release'
    // #endif
    return 'release'
  }

  private saveToken(token: string): void {
    CacheManager.set(CACHE_KEYS.TOKEN, token)
  }

  private resetRetryCount(): void {
    this.retryCount = 0
  }

  private showToast(title: string, icon: 'success' | 'error' | 'loading' | 'none' = 'none'): void {
    uni.showToast({ title, icon, duration: 2000 })
  }

  private async wxLogin(): Promise<any> {
    return new Promise((resolve, reject) => {
      // #ifdef MP-WEIXIN
      wx.login({
        success: async (res) => {
          try {
            const result = await this.loginWithCode(res.code)
            resolve(result)
          } catch (error) {
            reject(error)
          }
        },
        fail: reject
      })
      // #endif
      // #ifndef MP-WEIXIN
      reject(new Error('当前平台不支持微信登录'))
      // #endif
    })
  }

  private async alipayLogin(): Promise<any> {
    return new Promise((resolve, reject) => {
      // #ifdef MP-ALIPAY
      my.getAuthCode({
        scopes: ['auth_base'],
        success: async (res) => {
          try {
            const result = await this.loginWithCode(res.authCode)
            resolve(result)
          } catch (error) {
            reject(error)
          }
        },
        fail: reject
      })
      // #endif
      // #ifndef MP-ALIPAY
      reject(new Error('当前平台不支持支付宝登录'))
      // #endif
    })
  }

  private async baiduLogin(): Promise<any> {
    return new Promise((resolve, reject) => {
      // #ifdef MP-BAIDU
      swan.login({
        success: async (res) => {
          try {
            const result = await this.loginWithCode(res.code)
            resolve(result)
          } catch (error) {
            reject(error)
          }
        },
        fail: reject
      })
      // #endif
      // #ifndef MP-BAIDU
      reject(new Error('当前平台不支持百度登录'))
      // #endif
    })
  }

  private async toutiaoLogin(): Promise<any> {
    return new Promise((resolve, reject) => {
      // #ifdef MP-TOUTIAO
      tt.login({
        success: async (res) => {
          try {
            const result = await this.loginWithCode(res.code)
            resolve(result)
          } catch (error) {
            reject(error)
          }
        },
        fail: reject
      })
      // #endif
      // #ifndef MP-TOUTIAO
      reject(new Error('当前平台不支持字节跳动登录'))
      // #endif
    })
  }

  /**
   * 使用code登录
   * 使用rawRequest方法，绕过拦截器和业务逻辑，避免循环依赖
   */
  private async loginWithCode(code: string): Promise<any> {
    const platform = this.getPlatform()
    const envVersion = this.getEnvVersion()

    let loginParams = ''
    if (platform === 'mp-weixin') {
      loginParams = `mp_code=${code}&app_id=${CONFIG.ifAppid}&login_type=1&env=${envVersion}`
    } else if (platform === 'mp-alipay') {
      loginParams = `alipay_code=${code}&app_id=${CONFIG.ifAppid}&login_type=2&env=${envVersion}`
    } else if (platform === 'mp-baidu') {
      loginParams = `baidu_code=${code}&app_id=${CONFIG.ifAppid}&login_type=3&env=${envVersion}`
    } else if (platform === 'mp-toutiao') {
      loginParams = `toutiao_code=${code}&app_id=${CONFIG.ifAppid}&login_type=4&env=${envVersion}`
    } else {
      throw new Error(`不支持的平台: ${platform}`)
    }

    const loginUrl = `/api/so/user/login?${loginParams}`

    // 使用rawRequest方法，绕过所有拦截器和业务逻辑
    // 这样可以避免：
    // 1. 拦截器添加token（登录接口不需要token）
    // 2. 登录过期处理逻辑（避免循环依赖）
    // 3. 资源浪费（不需要创建新的Request实例）
    const response = await this.requestInstance.rawRequest(loginUrl, 'GET')
    if (response.statusCode === 200 && response.data) {
      return response.data
    }
    throw new Error('登录请求失败')
  }

  async handleLoginExpired(failedConfig: RequestConfig, requestInstance?: any): Promise<boolean> {
    if (this.isLoggingIn) {
      throw new Error('登录进行中，请稍后重试')
    }

    const now = Date.now()
    if (now - this.lastLoginSuccessTime < this.LOGIN_SUCCESS_COOLDOWN) {
      throw new Error('登录成功冷却期内，请稍后重试')
    }

    if (this.retryCount >= this.MAX_RETRY_COUNT) {
      this.showToast('登录失败次数过多，请手动重新登录')
      throw new Error('重试次数已达上限')
    }

    try {
      this.isLoggingIn = true
      this.retryCount++

      const platform = this.getPlatform()
      let loginResult: any
      switch (platform) {
        case 'mp-weixin':
          loginResult = await this.wxLogin()
          break
        case 'mp-alipay':
          loginResult = await this.alipayLogin()
          break
        case 'mp-baidu':
          loginResult = await this.baiduLogin()
          break
        case 'mp-toutiao':
          loginResult = await this.toutiaoLogin()
          break
        default:
          throw new Error(`不支持的平台: ${platform}`)
      }

      if (loginResult && loginResult.errCode === 0 && loginResult.data?.token) {
        this.saveToken(loginResult.data.token)
        this.lastLoginSuccessTime = now
        this.resetRetryCount()
        if (requestInstance && typeof requestInstance.resetLoginExpiredState === 'function') {
          requestInstance.resetLoginExpiredState()
        }
        return true
      } else {
        const errorMsg = loginResult?.msg || '登录失败'
        this.showToast(errorMsg)
        return false
      }
    } catch (error) {
      this.showToast('登录失败，请重试')
      return false
    } finally {
      this.isLoggingIn = false
    }
  }
}

export default LoginManager
