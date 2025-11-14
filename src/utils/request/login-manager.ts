import type { Request } from './request-client'
import { CacheManager } from '@/utils/cache-manager'
import { CACHE_KEYS } from '@/stores/cache'
import { idGenerator } from '@/utils/id-generator'

export class LoginManager {
  private requestInstance: Request
  private isLoggingIn: boolean = false

  constructor(requestInstance: Request) {
    this.requestInstance = requestInstance
  }

  private notify(title: string): void {
    if (window.utools && typeof window.utools.showNotification === 'function') {
      window.utools.showNotification(title)
      return
    }
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(title)
      return
    }
  }

  private openExternal(url: string): void {
    if (window.utools && typeof window.utools.shellOpenExternal === 'function') {
      window.utools.shellOpenExternal(url)
      return
    }
    if (typeof window !== 'undefined' && typeof window.open === 'function') {
      window.open(url, '_blank')
      return
    }
  }

  private saveToken(token: string): void {
    CacheManager.set(CACHE_KEYS.TOKEN, token)
  }

  private showToast(title: string): void {
    this.notify(title)
  }

  /**
   * QR 登录方法
   * 用于登录页面手动调用
   */
  async qrLogin(): Promise<{ errCode: number; data?: { token: string }; msg?: string }> {
    if (this.isLoggingIn) {
      throw new Error('登录进行中，请稍后重试')
    }

    try {
      this.isLoggingIn = true
      const uniqueId = String(idGenerator.generateId())
      const codeResp = await this.requestInstance.rawRequest(
        `/api/so/user/code?uniqueId=${encodeURIComponent(uniqueId)}`,
        'GET'
      )
      if (codeResp.statusCode !== 200 || !codeResp.data || (codeResp.data as any).errCode !== 0) {
        throw new Error('获取登录二维码失败')
      }
      const payload = (codeResp.data as any).data || {}
      const code = payload.code
      const qr = payload.qrCode
      if (qr) {
        this.openExternal(qr)
        this.showToast('请扫描二维码完成登录')
      }
      const start = Date.now()
      const timeout = 60 * 1000
      while (Date.now() - start < timeout) {
        await new Promise(r => setTimeout(r, 1500))
        const jwtResp = await this.requestInstance.rawRequest(
          `/api/so/user/get_jwt?code=${encodeURIComponent(code)}`,
          'GET'
        )
        if (jwtResp.statusCode === 200 && jwtResp.data && (jwtResp.data as any).errCode === 0) {
          const jwtPayload = (jwtResp.data as any).data || {}
          if (jwtPayload.jwtToken) {
            this.saveToken(jwtPayload.jwtToken)
            this.isLoggingIn = false
            return { errCode: 0, data: { token: jwtPayload.jwtToken } }
          }
        }
      }
      throw new Error('登录超时')
    } catch (error) {
      this.isLoggingIn = false
      const errorMessage = error instanceof Error ? error.message : '登录失败'
      this.showToast(errorMessage)
      return { errCode: -1, msg: errorMessage }
    }
  }
}

export default LoginManager
