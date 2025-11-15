import type { Request } from './request-client'
import { ElNotification } from 'element-plus'
import { CacheManager } from '@/utils/cache-manager'
import { CACHE_KEYS } from '@/stores/cache'
import { idGenerator } from '@/utils/id-generator'

export class LoginManager {
  private requestInstance: Request
  private isLoggingIn: boolean = false

  constructor(requestInstance: Request) {
    this.requestInstance = requestInstance
  }

  private notify(title: string, type: 'success' | 'warning' | 'info' | 'error' = 'info'): void {
    ElNotification({
      message: title,
      type,
      duration: 2000,
      position: 'bottom-right'
    })
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
}

export default LoginManager
