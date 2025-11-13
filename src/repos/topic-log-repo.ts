import { topicApi } from '@/apis/topic'
import { logger } from '@/utils/logger'
import type { ITopicLog, ITopicLogFormData, TopicLogListItem, TopicType } from '@/types/topic'
import { TopicEnums } from '@/types/enums'

/**
 * 主题日志仓储层 - 基于API实现
 */
export class TopicLogRepo {
  // 工具函数：将TopicLogListItem转换为ITopicLog
  private static convertTopicLogListItem(item: TopicLogListItem): ITopicLog {
    return {
      id: item.id,
      topicType: item.topicType,
      topicId: item.topicId,
      content: item.content,
      openid: item.openid || '', // API返回的列表项可能不包含openid
      createTime: item.createTime,
      updateTime: item.updateTime,
      extraData: item.extraData,
      mark: item.mark ?? 0 // 标记位，默认值为 0
    }
  }


  /**
   * 根据主题ID列表和类型获取日志（批量查询）
   */
  static async getByTopicIdsAndTypes(topicIds: number[], topicTypes: TopicType[]): Promise<ITopicLog[]> {
    try {
      const reqId = logger.logRequestStart(`TopicLogRepo.getByTopicIdsAndTypes(${topicIds.join(',')})`, 'GET')
      const response = await topicApi.getTopicLogList({ topicIds, topicTypes, offset: 0, size: 1000 })
      
      if (response.errCode === 0) {
        // 将TopicLogListItem转换为ITopicLog
        const logs = (response.data.list || []).map(this.convertTopicLogListItem)
        logger.logRequestSuccess(reqId, 200, { count: logs.length, topicIds: topicIds.length })
        return logs
      } else {
        throw new Error(response.msg || '获取主题日志列表失败')
      }
    } catch (error) {
      logger.logRequestError(`TopicLogRepo.getByTopicIdsAndTypes(${topicIds.join(',')})`, error)
      throw error
    }
  }

  /**
   * 根据单个主题ID获取日志（便捷方法）
   */
  static async getByTopicId(topicId: number, topicTypes: TopicType[]): Promise<ITopicLog[]> {
    return this.getByTopicIdsAndTypes([topicId], topicTypes)
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
      const reqId = logger.logRequestStart(
        `TopicLogRepo.getListItemsByTopicIdsAndTypes(${topicIds.join(',')})`,
        'GET'
      )
      const response = await topicApi.getTopicLogList({
        topicIds,
        topicTypes,
        offset: options?.offset ?? 0,
        size: options?.size ?? 1000,
      })

      if (response.errCode === 0) {
        const logs = response.data.list || []
        logger.logRequestSuccess(reqId, 200, {
          count: logs.length,
          topicIds: topicIds.length,
        })
        return logs
      } else {
        throw new Error(response.msg || '获取主题日志列表失败')
      }
    } catch (error) {
      logger.logRequestError(
        `TopicLogRepo.getListItemsByTopicIdsAndTypes(${topicIds.join(',')})`,
        error
      )
      throw error
    }
  }

  /**
   * 根据ID获取主题日志
   */
  static async getById(id: number): Promise<ITopicLog | null> {
    try {
      const reqId = logger.logRequestStart(`TopicLogRepo.getById(${id})`, 'GET')
      const response = await topicApi.getTopicLogDetail({ id })
      
      if (response.errCode === 0) {
        logger.logRequestSuccess(reqId, 200, { found: true })
        return response.data
      } else {
        logger.logRequestSuccess(reqId, 404, { found: false })
        return null
      }
    } catch (error) {
      logger.logRequestError(`TopicLogRepo.getById(${id})`, error)
      throw error
    }
  }

  /**
   * 创建主题日志
   */
  static async create(data: ITopicLogFormData): Promise<ITopicLog> {
    try {
      const reqId = logger.logRequestStart('TopicLogRepo.create', 'POST')
      const response = await topicApi.createTopicLog(data)
      
      if (response.errCode === 0) {
        logger.logRequestSuccess(reqId, 201, { id: response.data.id })
        return response.data
      } else {
        throw new Error(response.msg || '创建主题日志失败')
      }
    } catch (error) {
      logger.logRequestError('TopicLogRepo.create', error)
      throw error
    }
  }

  /**
   * 更新主题日志
   */
  static async update(id: number, data: Partial<ITopicLogFormData>): Promise<ITopicLog> {
    try {
      const reqId = logger.logRequestStart(`TopicLogRepo.update(${id})`, 'PUT')
      // 过滤掉undefined值
      const updateData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
      ) as unknown as ITopicLogFormData
      
      const response = await topicApi.updateTopicLog({ id, ...updateData })
      
      if (response.errCode === 0) {
        logger.logRequestSuccess(reqId, 200, { id })
        return response.data
      } else {
        throw new Error(response.msg || '更新主题日志失败')
      }
    } catch (error) {
      logger.logRequestError(`TopicLogRepo.update(${id})`, error)
      throw error
    }
  }

  /**
   * 删除主题日志
   */
  static async delete(id: number): Promise<void> {
    try {
      const reqId = logger.logRequestStart(`TopicLogRepo.delete(${id})`, 'DELETE')
      const response = await topicApi.deleteTopicLog({ id })
      
      if (response.errCode === 0) {
        logger.logRequestSuccess(reqId, 200, { id })
      } else {
        throw new Error(response.msg || '删除主题日志失败')
      }
    } catch (error) {
      logger.logRequestError(`TopicLogRepo.delete(${id})`, error)
      throw error
    }
  }

}
