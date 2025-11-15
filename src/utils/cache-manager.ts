/**
 * 统一缓存管理工具
 */

import { logger } from '@/utils/logger'

/**
 * 缓存操作工具类
 */
export class CacheManager {
  /**
   * 从localStorage获取数据
   */
  private static getFromLocalStorage<T = any>(key: string, defaultValue: T | null = null): T | null {
    try {
      const data = localStorage.getItem(key)
      if (data === null) {
        return defaultValue
      }
      // 尝试解析JSON，如果失败则返回原始字符串
      try {
        return JSON.parse(data) as T
      } catch {
        return data as T
      }
    } catch (error) {
      logger.error('从localStorage获取数据失败', { key, error })
      return defaultValue
    }
  }

  /**
   * 保存数据到localStorage
   */
  private static setToLocalStorage(key: string, value: any): boolean {
    try {
      const data = typeof value === 'string' ? value : JSON.stringify(value)
      localStorage.setItem(key, data)
      logger.info('保存数据到localStorage成功', { key })
      return true
    } catch (error) {
      logger.error('保存数据到localStorage失败', { key, error })
      return false
    }
  }

  /**
   * 从localStorage删除数据
   */
  private static removeFromLocalStorage(key: string): boolean {
    try {
      localStorage.removeItem(key)
      logger.info('从localStorage删除数据成功', { key })
      return true
    } catch (error) {
      logger.error('从localStorage删除数据失败', { key, error })
      return false
    }
  }

  /**
   * 检查localStorage中是否存在数据
   */
  private static hasInLocalStorage(key: string): boolean {
    try {
      return localStorage.getItem(key) !== null
    } catch (error) {
      logger.error('检查localStorage数据失败', { key, error })
      return false
    }
  }

  /**
   * 获取缓存数据
   * @param key 缓存键
   * @param defaultValue 默认值
   * @param isLocal 是否使用浏览器localStorage，默认false（使用utools存储）
   * @returns 缓存数据或默认值
   */
  static get<T = any>(key: string, defaultValue: T | null = null, isLocal: boolean = false): T | null {
    if (isLocal) {
      return this.getFromLocalStorage<T>(key, defaultValue)
    }

    try {
      const data = window.utools.dbStorage.getItem(key)
      return data !== null && data !== undefined ? data : defaultValue
    } catch (error) {
      logger.error('获取缓存数据失败', { key, error })
      return defaultValue
    }
  }

  /**
   * 设置缓存数据
   * @param key 缓存键
   * @param value 缓存值
   * @param isLocal 是否使用浏览器localStorage，默认false（使用utools存储）
   * @returns 是否设置成功
   */
  static set(key: string, value: any, isLocal: boolean = false): boolean {
    if (isLocal) {
      return this.setToLocalStorage(key, value)
    }

    try {
      window.utools.dbStorage.setItem(key, value)
      logger.info('设置缓存数据成功', { key })
      return true
    } catch (error) {
      logger.error('设置缓存数据失败', { key, error })
      return false
    }
  }

  /**
   * 删除缓存数据
   * @param key 缓存键
   * @param isLocal 是否使用浏览器localStorage，默认false（使用utools存储）
   * @returns 是否删除成功
   */
  static remove(key: string, isLocal: boolean = false): boolean {
    if (isLocal) {
      return this.removeFromLocalStorage(key)
    }

    try {
      window.utools.dbStorage.removeItem(key)
      logger.info('删除缓存数据成功', { key })
      return true
    } catch (error) {
      logger.error('删除缓存数据失败', { key, error })
      return false
    }
  }

  /**
   * 检查缓存是否存在
   * @param key 缓存键
   * @param isLocal 是否使用浏览器localStorage，默认false（使用utools存储）
   * @returns 是否存在
   */
  static has(key: string, isLocal: boolean = false): boolean {
    if (isLocal) {
      return this.hasInLocalStorage(key)
    }

    try {
      const data = window.utools.dbStorage.getItem(key)
      return data !== null && data !== undefined
    } catch (error) {
      logger.error('检查缓存数据失败', { key, error })
      return false
    }
  }
}
