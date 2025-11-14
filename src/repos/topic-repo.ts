import { topicApi } from '@/api/topic'
import { logger } from '@/utils/logger'
import type { ITopic, ITopicFormData, TopicListItem } from '@/types/topic'
import { validateTopic } from '@/types/topic'

/**
 * 主题仓储层 - 基于API实现
 */
export class TopicRepo {
  // 工具函数：将TopicListItem转换为ITopic
  private static convertTopicListItem(item: TopicListItem): ITopic {
    return {
      id: item.id,
      topicName: item.topicName,
      description: item.description,
      openid: item.openid || '', // 使用API返回的openid，如果没有则使用空字符串
      createTime: item.createTime ?? 0,
      updateTime: item.updateTime ?? 0,
      top: item.top ?? 0
    }
  }

  /**
   * 获取所有主题
   */
  static async getAll(): Promise<ITopic[]> {
    try {
      const reqId = logger.logRequestStart('TopicRepo.getAll', 'GET')
      const response = await topicApi.getTopicList({ offset: 0, size: 1000 })
      
      if (response.errCode === 0) {
        // 将TopicListItem转换为ITopic
        const topics = (response.data.list || []).map(this.convertTopicListItem)
        logger.logRequestSuccess(reqId, 200, { count: topics.length })
        return topics
      } else {
        throw new Error(response.msg || '获取主题列表失败')
      }
    } catch (error) {
      logger.logRequestError('TopicRepo.getAll', error)
      throw error
    }
  }

  /**
   * 根据ID获取主题
   */
  static async getById(id: number): Promise<ITopic | null> {
    try {
      const reqId = logger.logRequestStart(`TopicRepo.getById(${id})`, 'GET')
      const response = await topicApi.getTopicDetail({ id })
      
      if (response.errCode === 0) {
        logger.logRequestSuccess(reqId, 200, { found: true })
        return response.data
      } else {
        logger.logRequestSuccess(reqId, 404, { found: false })
        return null
      }
    } catch (error) {
      logger.logRequestError(`TopicRepo.getById(${id})`, error)
      throw error
    }
  }

  /**
   * 创建主题
   */
  static async create(data: ITopicFormData): Promise<ITopic> {
    try {
      const reqId = logger.logRequestStart('TopicRepo.create', 'POST')
      
      // 数据验证
      const validation = validateTopic(data)
      if (!validation.valid) {
        throw new Error(`数据验证失败: ${validation.errors.join(', ')}`)
      }
      
      const response = await topicApi.createTopic(data)
      
      if (response.errCode === 0) {
        logger.logRequestSuccess(reqId, 201, { id: response.data.id })
        return response.data
      } else {
        throw new Error(response.msg || '创建主题失败')
      }
    } catch (error) {
      logger.logRequestError('TopicRepo.create', error)
      throw error
    }
  }

  /**
   * 更新主题
   */
  static async update(id: number, data: Partial<ITopicFormData>): Promise<ITopic> {
    try {
      const reqId = logger.logRequestStart(`TopicRepo.update(${id})`, 'PUT')
      
      // 数据验证（仅验证提供的字段）
      if (Object.keys(data).length > 0) {
        const validation = validateTopic(data as ITopicFormData)
        if (!validation.valid) {
          throw new Error(`数据验证失败: ${validation.errors.join(', ')}`)
        }
      }
      
      // 过滤掉undefined值
      const updateData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
      ) as unknown as ITopicFormData
      
      const response = await topicApi.updateTopic({ id, ...updateData })
      
      if (response.errCode === 0) {
        logger.logRequestSuccess(reqId, 200, { id })
        return response.data
      } else {
        throw new Error(response.msg || '更新主题失败')
      }
    } catch (error) {
      logger.logRequestError(`TopicRepo.update(${id})`, error)
      throw error
    }
  }

  /**
   * 删除主题
   */
  static async delete(id: number): Promise<void> {
    try {
      const reqId = logger.logRequestStart(`TopicRepo.delete(${id})`, 'DELETE')
      const response = await topicApi.deleteTopic({ id })
      
      if (response.errCode === 0) {
        logger.logRequestSuccess(reqId, 200, { id })
      } else {
        throw new Error(response.msg || '删除主题失败')
      }
    } catch (error) {
      logger.logRequestError(`TopicRepo.delete(${id})`, error)
      throw error
    }
  }

  /**
   * 批量保存主题 - API模式下不支持批量操作，改为逐个创建
   */
  static async saveAll(topics: ITopic[]): Promise<{ success: boolean; count: number }> {
    try {
      const reqId = logger.logRequestStart('TopicRepo.saveAll', 'POST')
      let successCount = 0
      
      for (const topic of topics) {
        try {
          const response = await topicApi.createTopic({
            topicName: topic.topicName,
            description: topic.description
          })
          if (response.errCode === 0) {
            successCount++
          }
        } catch (error) {
          logger.warn('批量保存主题失败', { topicId: topic.id, error })
        }
      }
      
      logger.logRequestSuccess(reqId, 200, { count: successCount })
      return { success: successCount > 0, count: successCount }
    } catch (error) {
      logger.logRequestError('TopicRepo.saveAll', error)
      throw error
    }
  }

  /**
   * 检查是否存在主题数据
   */
  static async exists(): Promise<boolean> {
    try {
      const topics = await this.getAll()
      const hasData = topics.length > 0
      logger.info('检查主题数据存在性', { hasData, count: topics.length })
      return hasData
    } catch (error) {
      logger.warn('检查主题数据存在性失败', { error })
      return false
    }
  }

}
