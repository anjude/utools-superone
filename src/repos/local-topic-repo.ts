import { CacheManager } from '@/utils/cache-manager'
import { CACHE_KEYS } from '@/stores/cache'
import { logger } from '@/utils/logger'
import { getCurrentTimestamp } from '@/utils/time'
import type { ITopic, ITopicFormData } from '@/types/topic'
import { validateTopic } from '@/types/topic'

/**
 * 本地主题仓储层 - 基于 utools 本地存储实现
 * 用于未登录状态下的本地数据管理
 */
export class LocalTopicRepo {
  /**
   * 生成临时 ID（使用时间戳和随机数确保唯一性）
   */
  private static generateTempId(): number {
    // 使用当前时间戳（秒级）乘以 1000，加上随机数确保唯一性
    const timestamp = getCurrentTimestamp()
    const random = Math.floor(Math.random() * 1000)
    return timestamp * 1000 + random
  }

  /**
   * 获取所有主题
   */
  static async getAll(): Promise<ITopic[]> {
    try {
      const topics = CacheManager.get<ITopic[]>(CACHE_KEYS.LOCAL_TOPICS, [], false) || []
      logger.info('获取本地主题列表成功', { count: topics.length })
      return topics
    } catch (error) {
      logger.error('获取本地主题列表失败', { error })
      return []
    }
  }

  /**
   * 根据ID获取主题
   */
  static async getById(id: number): Promise<ITopic | null> {
    try {
      const topics = await this.getAll()
      const topic = topics.find(t => t.id === id) || null
      logger.info('获取本地主题详情', { id, found: !!topic })
      return topic
    } catch (error) {
      logger.error('获取本地主题详情失败', { error, id })
      return null
    }
  }

  /**
   * 创建主题
   */
  static async create(data: ITopicFormData): Promise<ITopic> {
    try {
      // 数据验证
      const validation = validateTopic(data)
      if (!validation.valid) {
        throw new Error(`数据验证失败: ${validation.errors.join(', ')}`)
      }

      const topics = await this.getAll()
      const now = getCurrentTimestamp()
      const newTopic: ITopic = {
        id: this.generateTempId(),
        openid: '', // 本地数据没有 openid
        topicName: data.topicName!,
        description: data.description,
        top: data.top ?? 0,
        createTime: now,
        updateTime: now,
      }

      topics.push(newTopic)
      CacheManager.set(CACHE_KEYS.LOCAL_TOPICS, topics, false)

      logger.info('创建本地主题成功', { id: newTopic.id, topicName: newTopic.topicName })
      return newTopic
    } catch (error) {
      logger.error('创建本地主题失败', { error })
      throw error
    }
  }

  /**
   * 更新主题
   */
  static async update(id: number, data: Partial<ITopicFormData>): Promise<ITopic> {
    try {
      // 数据验证（仅验证提供的字段）
      if (Object.keys(data).length > 0) {
        const validation = validateTopic(data as ITopicFormData)
        if (!validation.valid) {
          throw new Error(`数据验证失败: ${validation.errors.join(', ')}`)
        }
      }

      const topics = await this.getAll()
      const index = topics.findIndex(t => t.id === id)
      if (index === -1) {
        throw new Error('主题不存在')
      }

      const now = getCurrentTimestamp()
      const updatedTopic: ITopic = {
        ...topics[index],
        ...data,
        updateTime: now,
      }

      topics[index] = updatedTopic
      CacheManager.set(CACHE_KEYS.LOCAL_TOPICS, topics, false)

      logger.info('更新本地主题成功', { id })
      return updatedTopic
    } catch (error) {
      logger.error('更新本地主题失败', { error, id })
      throw error
    }
  }

  /**
   * 删除主题
   */
  static async delete(id: number): Promise<void> {
    try {
      const topics = await this.getAll()
      const index = topics.findIndex(t => t.id === id)
      if (index === -1) {
        throw new Error('主题不存在')
      }

      topics.splice(index, 1)
      CacheManager.set(CACHE_KEYS.LOCAL_TOPICS, topics, false)

      logger.info('删除本地主题成功', { id })
    } catch (error) {
      logger.error('删除本地主题失败', { error, id })
      throw error
    }
  }

  /**
   * 清空所有本地主题
   */
  static async clearAll(): Promise<void> {
    try {
      CacheManager.remove(CACHE_KEYS.LOCAL_TOPICS, false)
      logger.info('清空本地主题成功')
    } catch (error) {
      logger.error('清空本地主题失败', { error })
      throw error
    }
  }
}

