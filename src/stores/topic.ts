import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { ITopic, ITopicFormData, TopicLogListItem, ITopicLogFormData } from '@/types/topic'
import { TopicRepo } from '@/repos/topic-repo'
import { TopicLogRepo } from '@/repos/topic-log-repo'
import { LocalTopicRepo } from '@/repos/local-topic-repo'
import { LocalTopicLogRepo } from '@/repos/local-topic-log-repo'
import { useUserStore } from './user'
import { CacheManager } from '@/utils/cache-manager'
import { CACHE_KEYS } from './cache'
import { logger } from '@/utils/logger'
import { TopicEnums } from '@/constants/enums'

/**
 * 主题状态管理 Store
 * 管理主题列表、选中状态、日志列表、CRUD 操作
 */
export const useTopicStore = defineStore('topic', () => {
  // 获取用户 store
  const userStore = useUserStore()

  // 主题相关状态
  const topics = ref<ITopic[]>([])
  const loading = ref(false)
  const error = ref<string>('')
  const selectedTopicId = ref<number | null>(null)

  // 日志相关状态
  const logs = ref<TopicLogListItem[]>([])
  const logsLoading = ref(false)
  const logsError = ref<string>('')

  // 同步状态
  const syncing = ref(false)

  // 计算属性
  const selectedTopic = computed(() => {
    return topics.value.find(t => t.id === selectedTopicId.value) || null
  })

  // 判断是否为本地模式（未登录）
  const isLocalMode = computed(() => !userStore.isLoggedIn)

  // 加载主题列表
  const loadTopics = async (): Promise<void> => {
    loading.value = true
    error.value = ''
    try {
      const data = isLocalMode.value
        ? await LocalTopicRepo.getAll()
        : await TopicRepo.getAll()
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
      
      logger.info('主题列表加载成功', { count: topics.value.length, isLocalMode: isLocalMode.value })
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载主题列表失败'
      logger.error('加载主题列表失败', { error: err, isLocalMode: isLocalMode.value })
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
      const newTopic = isLocalMode.value
        ? await LocalTopicRepo.create(data)
        : await TopicRepo.create(data)
      // 重新加载列表
      await loadTopics()
      // 选中新创建的主题
      if (newTopic.id) {
        setSelectedTopicId(newTopic.id)
      }
      logger.info('主题创建成功', { id: newTopic.id, isLocalMode: isLocalMode.value })
      return newTopic
    } catch (err) {
      logger.error('创建主题失败', { error: err, isLocalMode: isLocalMode.value })
      throw err
    }
  }

  // 更新主题
  const updateTopic = async (id: number, data: Partial<ITopicFormData>): Promise<ITopic> => {
    try {
      const updatedTopic = isLocalMode.value
        ? await LocalTopicRepo.update(id, data)
        : await TopicRepo.update(id, data)
      // 重新加载列表
      await loadTopics()
      logger.info('主题更新成功', { id, isLocalMode: isLocalMode.value })
      return updatedTopic
    } catch (err) {
      logger.error('更新主题失败', { error: err, id, isLocalMode: isLocalMode.value })
      throw err
    }
  }

  // 删除主题
  const deleteTopic = async (id: number): Promise<void> => {
    try {
      if (isLocalMode.value) {
        await LocalTopicRepo.delete(id)
        // 本地模式下，同时删除相关的 logs
        await LocalTopicLogRepo.deleteByTopicId(id)
      } else {
        await TopicRepo.delete(id)
      }
      // 如果删除的是当前选中的主题，清空选中状态
      if (selectedTopicId.value === id) {
        selectedTopicId.value = null
      }
      // 重新加载列表
      await loadTopics()
      logger.info('主题删除成功', { id, isLocalMode: isLocalMode.value })
    } catch (err) {
      logger.error('删除主题失败', { error: err, id, isLocalMode: isLocalMode.value })
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
      const data = isLocalMode.value
        ? await LocalTopicLogRepo.getListItemsByTopicIdsAndTypes(
            [topicId],
            [TopicEnums.TopicType.Topic],
            { offset: 0, size: 100 }
          )
        : await TopicLogRepo.getListItemsByTopicIdsAndTypes(
            [topicId],
            [TopicEnums.TopicType.Topic],
            { offset: 0, size: 100 }
          )
      // 按创建时间倒序排列（最新的在前）
      logs.value = data.sort((a, b) => b.createTime - a.createTime)
      logger.info('主题日志加载成功', { topicId, count: logs.value.length, isLocalMode: isLocalMode.value })
    } catch (err) {
      logsError.value = err instanceof Error ? err.message : '加载日志失败'
      logger.error('加载主题日志失败', { error: err, topicId, isLocalMode: isLocalMode.value })
      throw err
    } finally {
      logsLoading.value = false
    }
  }

  // 创建日志
  const createLog = async (data: ITopicLogFormData): Promise<void> => {
    try {
      if (isLocalMode.value) {
        await LocalTopicLogRepo.create(data)
      } else {
        await TopicLogRepo.create(data)
      }
      // 重新加载日志列表
      if (selectedTopicId.value) {
        await loadLogs(selectedTopicId.value)
      }
      logger.info('主题日志创建成功', { topicId: data.topicId, isLocalMode: isLocalMode.value })
    } catch (err) {
      logger.error('创建主题日志失败', { error: err, topicId: data.topicId, isLocalMode: isLocalMode.value })
      throw err
    }
  }

  // 更新日志
  const updateLog = async (id: number, data: Partial<ITopicLogFormData>): Promise<void> => {
    try {
      if (isLocalMode.value) {
        await LocalTopicLogRepo.update(id, data)
      } else {
        await TopicLogRepo.update(id, data)
      }
      // 重新加载日志列表
      if (selectedTopicId.value) {
        await loadLogs(selectedTopicId.value)
      }
      logger.info('主题日志更新成功', { id, isLocalMode: isLocalMode.value })
    } catch (err) {
      logger.error('更新主题日志失败', { error: err, id, isLocalMode: isLocalMode.value })
      throw err
    }
  }

  // 删除日志
  const deleteLog = async (id: number): Promise<void> => {
    try {
      if (isLocalMode.value) {
        await LocalTopicLogRepo.delete(id)
      } else {
        await TopicLogRepo.delete(id)
      }
      // 重新加载日志列表
      if (selectedTopicId.value) {
        await loadLogs(selectedTopicId.value)
      }
      logger.info('主题日志删除成功', { id, isLocalMode: isLocalMode.value })
    } catch (err) {
      logger.error('删除主题日志失败', { error: err, id, isLocalMode: isLocalMode.value })
      throw err
    }
  }

  // 同步本地数据到远程
  const syncLocalDataToRemote = async (): Promise<void> => {
    // 如果未登录，不需要同步
    if (isLocalMode.value) {
      logger.info('未登录状态，无需同步本地数据')
      return
    }

    // 检查是否有本地数据
    const localTopics = await LocalTopicRepo.getAll()
    const localLogs = await LocalTopicLogRepo.getAll()

    if (localTopics.length === 0 && localLogs.length === 0) {
      logger.info('没有本地数据需要同步')
      return
    }

    syncing.value = true
    logger.info('开始同步本地数据到远程', {
      topicCount: localTopics.length,
      logCount: localLogs.length,
    })

    try {
      // 1. 按 createTime 排序 topics
      const sortedTopics = [...localTopics].sort((a, b) => a.createTime - b.createTime)

      // 2. 建立临时 ID → 真实 ID 的映射
      const topicIdMap = new Map<number, number>()

      // 3. 逐个创建 topic，记录 ID 映射
      for (const localTopic of sortedTopics) {
        try {
          const remoteTopic = await TopicRepo.create({
            topicName: localTopic.topicName,
            description: localTopic.description,
            top: localTopic.top,
          })
          topicIdMap.set(localTopic.id, remoteTopic.id)
          logger.info('同步主题成功', {
            localId: localTopic.id,
            remoteId: remoteTopic.id,
            topicName: localTopic.topicName,
          })
        } catch (err) {
          logger.error('同步主题失败', { error: err, localId: localTopic.id })
          // 继续同步其他主题，不中断流程
        }
      }

      // 4. 按 createTime 排序 logs，按 topicId 分组
      const sortedLogs = [...localLogs].sort((a, b) => a.createTime - b.createTime)
      const logsByTopicId = new Map<number, typeof sortedLogs>()
      for (const log of sortedLogs) {
        if (!logsByTopicId.has(log.topicId)) {
          logsByTopicId.set(log.topicId, [])
        }
        logsByTopicId.get(log.topicId)!.push(log)
      }

      // 5. 为每个 topic 的 logs 创建，使用映射后的 topicId
      let successLogCount = 0
      for (const [localTopicId, logs] of logsByTopicId.entries()) {
        const remoteTopicId = topicIdMap.get(localTopicId)
        if (!remoteTopicId) {
          logger.warn('跳过日志同步：主题ID映射不存在', { localTopicId })
          continue
        }

        for (const localLog of logs) {
          try {
            await TopicLogRepo.create({
              topicId: remoteTopicId,
              topicType: localLog.topicType,
              content: localLog.content,
              extraData: localLog.extraData,
              mark: localLog.mark,
            })
            successLogCount++
            logger.info('同步日志成功', {
              localId: localLog.id,
              localTopicId,
              remoteTopicId,
            })
          } catch (err) {
            logger.error('同步日志失败', { error: err, localId: localLog.id, localTopicId })
            // 继续同步其他日志，不中断流程
          }
        }
      }

      // 6. 同步成功后删除本地数据
      await LocalTopicRepo.clearAll()
      await LocalTopicLogRepo.clearAll()

      logger.info('本地数据同步完成', {
        topicCount: sortedTopics.length,
        logCount: successLogCount,
        totalLogs: sortedLogs.length,
      })

      // 7. 重新加载远程数据
      await loadTopics()
      if (selectedTopicId.value) {
        await loadLogs(selectedTopicId.value)
      }
    } catch (err) {
      logger.error('同步本地数据失败', { error: err })
      // 同步失败时保留本地数据，不删除
      throw err
    } finally {
      syncing.value = false
    }
  }

  // 监听登录状态变化，自动触发同步
  let hasSynced = false // 防止重复同步
  watch(
    () => userStore.isLoggedIn,
    async (newValue, oldValue) => {
      // 当从未登录变为已登录时，触发同步
      if (newValue && !oldValue && !hasSynced) {
        hasSynced = true
        logger.info('检测到登录状态变化，开始同步本地数据')
        try {
          await syncLocalDataToRemote()
        } catch (err) {
          logger.error('自动同步本地数据失败', { error: err })
          // 不抛出错误，避免影响登录流程
        }
      }
      // 如果登出，重置同步标志
      if (!newValue && oldValue) {
        hasSynced = false
      }
    },
    { immediate: false }
  )

  // 同时监听 token 变化，作为备用触发方式
  watch(
    () => userStore.token,
    async (newToken, oldToken) => {
      // 当 token 从无到有时，且已登录，触发同步（防止 isLoggedIn 的 watch 未触发）
      if (newToken && !oldToken && userStore.isLoggedIn && !hasSynced) {
        hasSynced = true
        logger.info('检测到 token 变化，开始同步本地数据')
        try {
          await syncLocalDataToRemote()
        } catch (err) {
          logger.error('自动同步本地数据失败', { error: err })
        }
      }
      // 如果 token 被清除，重置同步标志
      if (!newToken && oldToken) {
        hasSynced = false
      }
    },
    { immediate: false }
  )

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
    // 同步状态
    syncing,
    // 模式状态
    isLocalMode,
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
    // 同步方法
    syncLocalDataToRemote,
  }
})

