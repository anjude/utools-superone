import { CacheManager } from '@/utils/cache-manager'
import { CACHE_KEYS } from '@/stores/cache'
import { logger } from '@/utils/logger'
import { getCurrentTimestamp } from '@/utils/time'
import type { ITopicLog, ITopicLogFormData, TopicLogListItem, TopicType } from '@/types/topic'
import { validateTopicLog } from '@/types/topic'
import { TopicEnums } from '@/constants/enums'

/**
 * 本地主题日志仓储层 - 基于 utools 本地存储实现
 * 用于未登录状态下的本地数据管理
 */
export class LocalTopicLogRepo {
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
   * 将 ITopicLog 转换为 TopicLogListItem
   */
  private static convertToListItem(log: ITopicLog): TopicLogListItem {
    // 生成预览文本（取前100个字符）
    const preview = log.content.length > 100 ? log.content.substring(0, 100) + '...' : log.content
    return {
      id: log.id,
      topicType: log.topicType,
      topicId: log.topicId,
      content: log.content,
      createTime: log.createTime,
      updateTime: log.updateTime,
      preview,
      extraData: log.extraData,
      openid: log.openid,
      mark: log.mark,
    }
  }

  /**
   * 获取所有日志
   */
  static async getAll(): Promise<ITopicLog[]> {
    try {
      const logs = CacheManager.get<ITopicLog[]>(CACHE_KEYS.LOCAL_TOPIC_LOGS, [], false) || []
      logger.info('获取本地主题日志列表成功', { count: logs.length })
      return logs
    } catch (error) {
      logger.error('获取本地主题日志列表失败', { error })
      return []
    }
  }

  /**
   * 根据主题ID列表和类型获取日志（批量查询）
   */
  static async getByTopicIdsAndTypes(
    topicIds: number[],
    topicTypes: TopicType[]
  ): Promise<ITopicLog[]> {
    try {
      const allLogs = await this.getAll()
      const filteredLogs = allLogs.filter(
        log => topicIds.includes(log.topicId) && topicTypes.includes(log.topicType)
      )
      logger.info('根据主题ID和类型获取本地日志成功', {
        count: filteredLogs.length,
        topicIds: topicIds.length,
      })
      return filteredLogs
    } catch (error) {
      logger.error('根据主题ID和类型获取本地日志失败', { error })
      return []
    }
  }

  /**
   * 根据主题ID列表和类型获取日志列表项（批量查询，返回包含 preview 的列表项）
   */
  static async getListItemsByTopicIdsAndTypes(
    topicIds: number[],
    topicTypes: TopicType[],
    options?: { offset?: number; size?: number }
  ): Promise<TopicLogListItem[]> {
    try {
      const logs = await this.getByTopicIdsAndTypes(topicIds, topicTypes)
      const listItems = logs.map(this.convertToListItem)

      // 应用分页
      const offset = options?.offset ?? 0
      const size = options?.size ?? 1000
      const paginatedItems = listItems.slice(offset, offset + size)

      logger.info('获取本地主题日志列表项成功', {
        count: paginatedItems.length,
        total: listItems.length,
        topicIds: topicIds.length,
      })
      return paginatedItems
    } catch (error) {
      logger.error('获取本地主题日志列表项失败', { error })
      return []
    }
  }

  /**
   * 根据ID获取日志
   */
  static async getById(id: number): Promise<ITopicLog | null> {
    try {
      const logs = await this.getAll()
      const log = logs.find(l => l.id === id) || null
      logger.info('获取本地主题日志详情', { id, found: !!log })
      return log
    } catch (error) {
      logger.error('获取本地主题日志详情失败', { error, id })
      return null
    }
  }

  /**
   * 创建日志
   */
  static async create(data: ITopicLogFormData): Promise<ITopicLog> {
    try {
      // 数据验证
      const validation = validateTopicLog(data)
      if (!validation.valid) {
        throw new Error(`数据验证失败: ${validation.errors.join(', ')}`)
      }

      const logs = await this.getAll()
      const now = getCurrentTimestamp()
      const newLog: ITopicLog = {
        id: this.generateTempId(),
        openid: '', // 本地数据没有 openid
        topicType: data.topicType,
        topicId: data.topicId,
        content: data.content,
        extraData: data.extraData,
        mark: data.mark ?? TopicEnums.TopicLogMark.Normal,
        createTime: now,
        updateTime: now,
      }

      logs.push(newLog)
      CacheManager.set(CACHE_KEYS.LOCAL_TOPIC_LOGS, logs, false)

      logger.info('创建本地主题日志成功', { id: newLog.id, topicId: newLog.topicId })
      return newLog
    } catch (error) {
      logger.error('创建本地主题日志失败', { error })
      throw error
    }
  }

  /**
   * 更新日志
   */
  static async update(id: number, data: Partial<ITopicLogFormData>): Promise<ITopicLog> {
    try {
      const logs = await this.getAll()
      const index = logs.findIndex(l => l.id === id)
      if (index === -1) {
        throw new Error('日志不存在')
      }

      const now = getCurrentTimestamp()
      const updatedLog: ITopicLog = {
        ...logs[index],
        ...data,
        updateTime: now,
      }

      logs[index] = updatedLog
      CacheManager.set(CACHE_KEYS.LOCAL_TOPIC_LOGS, logs, false)

      logger.info('更新本地主题日志成功', { id })
      return updatedLog
    } catch (error) {
      logger.error('更新本地主题日志失败', { error, id })
      throw error
    }
  }

  /**
   * 删除日志
   */
  static async delete(id: number): Promise<void> {
    try {
      const logs = await this.getAll()
      const index = logs.findIndex(l => l.id === id)
      if (index === -1) {
        throw new Error('日志不存在')
      }

      logs.splice(index, 1)
      CacheManager.set(CACHE_KEYS.LOCAL_TOPIC_LOGS, logs, false)

      logger.info('删除本地主题日志成功', { id })
    } catch (error) {
      logger.error('删除本地主题日志失败', { error, id })
      throw error
    }
  }

  /**
   * 清空所有本地日志
   */
  static async clearAll(): Promise<void> {
    try {
      CacheManager.remove(CACHE_KEYS.LOCAL_TOPIC_LOGS, false)
      logger.info('清空本地主题日志成功')
    } catch (error) {
      logger.error('清空本地主题日志失败', { error })
      throw error
    }
  }

  /**
   * 根据 topicId 删除所有相关日志
   */
  static async deleteByTopicId(topicId: number): Promise<void> {
    try {
      const logs = await this.getAll()
      const filteredLogs = logs.filter(l => l.topicId !== topicId)
      CacheManager.set(CACHE_KEYS.LOCAL_TOPIC_LOGS, filteredLogs, false)
      logger.info('根据主题ID删除本地日志成功', { topicId, deletedCount: logs.length - filteredLogs.length })
    } catch (error) {
      logger.error('根据主题ID删除本地日志失败', { error, topicId })
      throw error
    }
  }
}

