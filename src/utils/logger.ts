/**
 * 统一日志管理工具
 * 支持微信小程序实时日志和所有环境的控制台日志
 */

// 微信小程序全局配置类型声明
declare const __wxConfig: {
  envVersion?: 'develop' | 'trial' | 'release'
} | undefined

// Node.js process 类型声明
declare const process: {
  env?: {
    NODE_ENV?: string
  }
} | undefined

interface LogManager {
  info(...args: any[]): void
  warn(...args: any[]): void
  error(...args: any[]): void
  setFilterMsg?(msg: string): void
  addFilterMsg?(msg: string): void
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

interface LogConfig {
  enableDebugLog: boolean
  enableRealtimeLog: boolean
  maxLogLength: number
}

class Logger {
  private logManager: LogManager | null = null
  private config: LogConfig
  private requestId: number = 0

  constructor() {
    // 判断当前环境
    const isDevelopment = this.isDevelopmentEnvironment()
    
    this.config = {
      enableDebugLog: true, // 所有环境都启用控制台日志
      enableRealtimeLog: true, // 实时日志在所有环境都启用
      maxLogLength: 5000 // 5KB 限制
    }

    // 初始化实时日志管理器
    this.initRealtimeLogManager()
  }

  /**
   * 获取环境信息
   */
  private getEnvironmentDetails(): { isDevelopment: boolean; envVersion?: string; platform?: string } {
    let isDevelopment = false
    let envVersion: string | undefined
    let platform: string | undefined

    try {
      // 方法1: 使用 __wxConfig.envVersion 判断 (推荐)
      if (typeof __wxConfig !== 'undefined' && __wxConfig?.envVersion) {
        envVersion = __wxConfig.envVersion
        // develop: 开发版, trial: 体验版, release: 正式版
        isDevelopment = envVersion === 'develop' || envVersion === 'trial'
      }
      
      // 方法2: 使用 process.env (如果可用)
      if (!isDevelopment && typeof process !== 'undefined' && process?.env?.NODE_ENV) {
        isDevelopment = process.env.NODE_ENV === 'development'
      }
      
      // 方法3: 检查是否有调试工具 (微信开发者工具)
      if (!isDevelopment && typeof wx !== 'undefined' && (wx as any).getSystemInfoSync) {
        try {
          const systemInfo = (wx as any).getSystemInfoSync()
          platform = systemInfo.platform
          // 如果在微信开发者工具中运行
          isDevelopment = platform === 'devtools'
        } catch {
          // 忽略错误
        }
      }
    } catch (error) {
      // 出错时默认生产环境，避免泄露调试信息
      isDevelopment = false
    }

    return { isDevelopment, envVersion, platform }
  }

  /**
   * 判断是否为开发环境
   */
  private isDevelopmentEnvironment(): boolean {
    return this.getEnvironmentDetails().isDevelopment
  }

  /**
   * 初始化实时日志管理器
   */
  private initRealtimeLogManager(): void {
    try {
      if (typeof wx !== 'undefined' && (wx as any).getRealtimeLogManager) {
        this.logManager = (wx as any).getRealtimeLogManager()
        const envInfo = this.getEnvironmentInfo()
        if (this.config.enableDebugLog) {
          console.log('[Logger] Logger initialized successfully', envInfo)
        }
      } else {
        if (this.config.enableDebugLog) {
          console.log('[Logger] RealtimeLogManager not available, using console only')
        }
      }
    } catch (error) {
      console.warn('Failed to initialize RealtimeLogManager:', error)
    }
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `req_${++this.requestId}_${Date.now()}`
  }

  /**
   * 格式化日志消息
   */
  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    
    if (args.length > 0) {
      try {
        const dataStr = JSON.stringify(args, null, 2)
        return `${prefix} ${message}\n${dataStr}`
      } catch {
        // 安全处理：避免循环引用导致的递归
        const safeArgs = args.map(arg => {
          if (typeof arg === 'object' && arg !== null) {
            return '[Object]'
          }
          return String(arg)
        })
        return `${prefix} ${message} ${safeArgs.join(' ')}`
      }
    }
    
    return `${prefix} ${message}`
  }

  /**
   * 截断过长的日志
   */
  private truncateLog(message: string): string {
    if (message.length > this.config.maxLogLength) {
      return message.substring(0, this.config.maxLogLength) + '...[truncated]'
    }
    return message
  }

  /**
   * 通用日志记录方法
   */
  private log(level: LogLevel, message: string, ...args: any[]): void {
    const formattedMessage = this.formatMessage(level, message, ...args)
    const truncatedMessage = this.truncateLog(formattedMessage)

    // 控制台日志
    if (this.config.enableDebugLog) {
      const consoleMethod = this.getConsoleMethod(level)
      consoleMethod(truncatedMessage)
    }

    // 实时日志
    if (this.config.enableRealtimeLog && this.logManager) {
      this.sendToRealtimeLog(level, truncatedMessage)
    }
  }

  /**
   * 获取对应的控制台方法
   */
  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug
      case LogLevel.INFO:
        return console.log
      case LogLevel.WARN:
        return console.warn
      case LogLevel.ERROR:
        return console.error
      default:
        return console.log
    }
  }

  /**
   * 发送日志到实时日志管理器
   */
  private sendToRealtimeLog(level: LogLevel, message: string): void {
    try {
      const logMethod = this.getRealtimeLogMethod(level)
      logMethod.call(this.logManager, message)
    } catch (error) {
      console.warn(`Failed to send ${level} log to RealtimeLogManager:`, error)
    }
  }

  /**
   * 获取对应的实时日志方法
   */
  private getRealtimeLogMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        return this.logManager!.info
      case LogLevel.WARN:
        return this.logManager!.warn
      case LogLevel.ERROR:
        return this.logManager!.error
      default:
        return this.logManager!.info
    }
  }

  /**
   * 记录调试日志
   */
  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args)
  }

  /**
   * 记录信息日志
   */
  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args)
  }

  /**
   * 记录警告日志
   */
  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args)
  }

  /**
   * 记录错误日志
   */
  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args)
  }

  /**
   * 安全执行日志管理器方法
   */
  private safeExecuteLogManagerMethod(methodName: string, ...args: any[]): void {
    if (this.logManager && (this.logManager as any)[methodName]) {
      try {
        (this.logManager as any)[methodName](...args)
      } catch (error) {
        console.warn(`Failed to execute ${methodName}:`, error)
      }
    }
  }

  /**
   * 设置过滤消息（便于在后台查找特定日志）
   */
  setFilterMsg(msg: string): void {
    this.safeExecuteLogManagerMethod('setFilterMsg', msg)
  }

  /**
   * 添加过滤消息
   */
  addFilterMsg(msg: string): void {
    this.safeExecuteLogManagerMethod('addFilterMsg', msg)
  }

  /**
   * 记录请求开始
   */
  logRequestStart(url: string, method: string = 'GET', data?: any): string {
    const requestId = this.generateRequestId()
    this.setFilterMsg(`request_${requestId}`)
    
    this.info(`[Request ${requestId}] 开始请求`, {
      url,
      method,
      data: data ? this.sanitizeData(data) : undefined,
      timestamp: Date.now()
    })
    
    return requestId
  }

  /**
   * 记录请求成功
   */
  logRequestSuccess(requestId: string, statusCode: number, data?: any): void {
    this.info(`[Request ${requestId}] 请求成功`, {
      statusCode,
      data: data ? this.sanitizeData(data) : undefined,
      timestamp: Date.now()
    })
  }

  /**
   * 记录请求失败
   */
  logRequestError(requestId: string, error: any, config?: any): void {
    this.error(`[Request ${requestId}] 请求失败`, {
      error: error.message || error,
      stack: error.stack,
      config: config ? this.sanitizeData(config) : undefined,
      timestamp: Date.now()
    })
  }

  /**
   * 记录业务操作
   */
  logBusinessOperation(operation: string, data?: any): void {
    this.info(`[Business] ${operation}`, {
      data: data ? this.sanitizeData(data) : undefined,
      timestamp: Date.now()
    })
  }

  /**
   * 记录用户行为
   */
  logUserAction(action: string, page?: string, data?: any): void {
    this.info(`[UserAction] ${action}`, {
      page,
      data: data ? this.sanitizeData(data) : undefined,
      timestamp: Date.now()
    })
  }

  /**
   * 清理敏感数据
   */
  private sanitizeData(data: any, visited = new WeakSet()): any {
    if (!data || typeof data !== 'object') {
      return data
    }

    // 防止循环引用
    if (visited.has(data)) {
      return '[Circular Reference]'
    }

    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth']
    const sanitized = { ...data }

    // 将当前对象添加到已访问集合
    visited.add(data)

    for (const key in sanitized) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeData(sanitized[key], visited)
      }
    }

    return sanitized
  }

  /**
   * 获取当前环境信息
   */
  getEnvironmentInfo(): { isDevelopment: boolean; envVersion?: string; platform?: string } {
    return this.getEnvironmentDetails()
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config }
    this.info('Logger config updated', this.config)
  }
}

// 创建单例实例
export const logger = new Logger()

// 导出类型
export type { LogConfig }
