import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ITopic, ITopicFormData, TopicLogListItem, ITopicLogFormData } from '@/types/topic'
import { TopicRepo } from '@/repos/topic-repo'
import { TopicLogRepo } from '@/repos/topic-log-repo'
import { CacheManager } from '@/utils/cache-manager'
import { CACHE_KEYS } from './cache'
import { logger } from '@/utils/logger'
import { TopicEnums } from '@/constants/enums'

/**
 * 主题状态管理 Store
 * 管理主题列表、选中状态、日志列表、CRUD 操作
 */
export const useTopicStore = defineStore('topic', () => {
  // 主题相关状态
  const topics = ref<ITopic[]>([])
  const loading = ref(false)
  const error = ref<string>('')
  const selectedTopicId = ref<number | null>(null)

  // 日志相关状态
  const logs = ref<TopicLogListItem[]>([])
  const logsLoading = ref(false)
  const logsError = ref<string>('')

  // 计算属性
  const selectedTopic = computed(() => {
    return topics.value.find(t => t.id === selectedTopicId.value) || null
  })

  // 加载主题列表
  const loadTopics = async (): Promise<void> => {
    loading.value = true
    error.value = ''
    try {
      const data = await TopicRepo.getAll()
      // 按置顶权重和创建时间排序：置顶的在前，同置顶权重按创建时间倒序
      topics.value = data.sort((a, b) => {
        if (a.top !== b.top) {
          return b.top - a.top // 置顶权重大的在前
        }
        return b.createTime - a.createTime // 创建时间新的在前
      })
      
      // 如果有主题且没有选中，尝试从缓存恢复选中的主题
      if (topics.value.length > 0 && !selectedTopicId.value) {
        const savedTopicId = CacheManager.get<number>(CACHE_KEYS.SELECTED_TOPIC_ID, null, true)
        
        if (savedTopicId !== null) {
          // 检查保存的主题是否还存在
          const topicExists = topics.value.some(topic => topic.id === savedTopicId)
          if (topicExists) {
            selectedTopicId.value = savedTopicId
          } else {
            // 如果保存的主题不存在，选择第一个主题
            selectedTopicId.value = topics.value[0].id
            // 更新缓存为第一个主题
            CacheManager.set(CACHE_KEYS.SELECTED_TOPIC_ID, selectedTopicId.value, true)
          }
        } else {
          // 没有保存的主题，默认选中第一个
          selectedTopicId.value = topics.value[0].id
          // 保存到缓存
          CacheManager.set(CACHE_KEYS.SELECTED_TOPIC_ID, selectedTopicId.value, true)
        }
      }
      
      logger.info('主题列表加载成功', { count: topics.value.length })
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载主题列表失败'
      logger.error('加载主题列表失败', { error: err })
      throw err
    } finally {
      loading.value = false
    }
  }

  // 设置选中的主题ID
  const setSelectedTopicId = (id: number | null) => {
    selectedTopicId.value = id
    if (id !== null) {
      CacheManager.set(CACHE_KEYS.SELECTED_TOPIC_ID, id, true)
    }
    logger.info('选中的主题ID已更新', { id })
  }

  // 创建主题
  const createTopic = async (data: ITopicFormData): Promise<ITopic> => {
    try {
      const newTopic = await TopicRepo.create(data)
      // 重新加载列表
      await loadTopics()
      // 选中新创建的主题
      if (newTopic.id) {
        setSelectedTopicId(newTopic.id)
      }
      logger.info('主题创建成功', { id: newTopic.id })
      return newTopic
    } catch (err) {
      logger.error('创建主题失败', { error: err })
      throw err
    }
  }

  // 更新主题
  const updateTopic = async (id: number, data: Partial<ITopicFormData>): Promise<ITopic> => {
    try {
      const updatedTopic = await TopicRepo.update(id, data)
      // 重新加载列表
      await loadTopics()
      logger.info('主题更新成功', { id })
      return updatedTopic
    } catch (err) {
      logger.error('更新主题失败', { error: err, id })
      throw err
    }
  }

  // 删除主题
  const deleteTopic = async (id: number): Promise<void> => {
    try {
      await TopicRepo.delete(id)
      // 如果删除的是当前选中的主题，清空选中状态
      if (selectedTopicId.value === id) {
        selectedTopicId.value = null
      }
      // 重新加载列表
      await loadTopics()
      logger.info('主题删除成功', { id })
    } catch (err) {
      logger.error('删除主题失败', { error: err, id })
      throw err
    }
  }

  // 加载日志列表
  const loadLogs = async (topicId: number): Promise<void> => {
    if (!topicId) {
      logs.value = []
      return
    }
    logsLoading.value = true
    logsError.value = ''
    try {
      const data = await TopicLogRepo.getListItemsByTopicIdsAndTypes(
        [topicId],
        [TopicEnums.TopicType.Topic],
        { offset: 0, size: 100 }
      )
      // 按创建时间倒序排列（最新的在前）
      logs.value = data.sort((a, b) => b.createTime - a.createTime)
      logger.info('主题日志加载成功', { topicId, count: logs.value.length })
    } catch (err) {
      logsError.value = err instanceof Error ? err.message : '加载日志失败'
      logger.error('加载主题日志失败', { error: err, topicId })
      throw err
    } finally {
      logsLoading.value = false
    }
  }

  // 创建日志
  const createLog = async (data: ITopicLogFormData): Promise<void> => {
    try {
      await TopicLogRepo.create(data)
      // 重新加载日志列表
      if (selectedTopicId.value) {
        await loadLogs(selectedTopicId.value)
      }
      logger.info('主题日志创建成功', { topicId: data.topicId })
    } catch (err) {
      logger.error('创建主题日志失败', { error: err, topicId: data.topicId })
      throw err
    }
  }

  // 更新日志
  const updateLog = async (id: number, data: Partial<ITopicLogFormData>): Promise<void> => {
    try {
      await TopicLogRepo.update(id, data)
      // 重新加载日志列表
      if (selectedTopicId.value) {
        await loadLogs(selectedTopicId.value)
      }
      logger.info('主题日志更新成功', { id })
    } catch (err) {
      logger.error('更新主题日志失败', { error: err, id })
      throw err
    }
  }

  // 删除日志
  const deleteLog = async (id: number): Promise<void> => {
    try {
      await TopicLogRepo.delete(id)
      // 重新加载日志列表
      if (selectedTopicId.value) {
        await loadLogs(selectedTopicId.value)
      }
      logger.info('主题日志删除成功', { id })
    } catch (err) {
      logger.error('删除主题日志失败', { error: err, id })
      throw err
    }
  }

  return {
    // 主题相关状态
    topics,
    loading,
    error,
    selectedTopicId,
    selectedTopic,
    // 日志相关状态
    logs,
    logsLoading,
    logsError,
    // 主题相关方法
    loadTopics,
    setSelectedTopicId,
    createTopic,
    updateTopic,
    deleteTopic,
    // 日志相关方法
    loadLogs,
    createLog,
    updateLog,
    deleteLog,
  }
})

