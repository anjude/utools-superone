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
}

export default LoginManager
