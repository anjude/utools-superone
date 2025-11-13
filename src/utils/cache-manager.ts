/**
 * 统一缓存管理工具
 */

import { logger } from '@/utils/logger'

/**
 * 缓存操作工具类
 */
export class CacheManager {
  /**
   * 获取缓存数据
   * @param key 缓存键
   * @param defaultValue 默认值
   * @returns 缓存数据或默认值
   */
  static get<T = any>(key: string, defaultValue: T | null = null): T | null {
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
   * @returns 是否设置成功
   */
  static set(key: string, value: any): boolean {
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
   * @returns 是否删除成功
   */
  static remove(key: string): boolean {
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
   * @returns 是否存在
   */
  static has(key: string): boolean {
    try {
      const data = window.utools.dbStorage.getItem(key)
      return data !== null && data !== undefined
    } catch (error) {
      logger.error('检查缓存数据失败', { key, error })
      return false
    }
  }
}
