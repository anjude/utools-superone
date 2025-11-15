import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { IStock, IStockFormData } from '@/types/stock'
import type { TopicLogListItem, ITopicLogFormData } from '@/types/topic'
import { StockRepo } from '@/repos/stock-repo'
import { TopicLogRepo } from '@/repos/topic-log-repo'
import { CacheManager } from '@/utils/cache-manager'
import { CACHE_KEYS } from './cache'
import { logger } from '@/utils/logger'
import { TopicEnums } from '@/constants/enums'
import type { StockType } from '@/types/stock'

/**
 * 标的状态管理 Store
 * 管理标的列表、选中状态、日志列表、CRUD 操作
 */
export const useStockStore = defineStore('stock', () => {
  // 标的相关状态
  const stocks = ref<IStock[]>([])
  const loading = ref(false)
  const error = ref<string>('')
  const selectedStockId = ref<number | null>(null)

  // 日志相关状态
  const logs = ref<TopicLogListItem[]>([])
  const logsLoading = ref(false)
  const logsError = ref<string>('')

  // 计算属性
  const selectedStock = computed(() => {
    return stocks.value.find(s => s.id === selectedStockId.value) || null
  })

  // 加载标的列表
  const loadStocks = async (type?: StockType): Promise<void> => {
    loading.value = true
    error.value = ''
    try {
      const data = await StockRepo.getAll(type)
      // 按置顶权重和创建时间排序：置顶的在前，同置顶权重按创建时间倒序
      stocks.value = data.sort((a, b) => {
        if (a.top !== b.top) {
          return b.top - a.top // 置顶权重大的在前
        }
        return b.createTime - a.createTime // 创建时间新的在前
      })
      
      // 如果有标的且没有选中，尝试从缓存恢复选中的标的
      if (stocks.value.length > 0 && !selectedStockId.value) {
        const savedStockId = CacheManager.get<number>(CACHE_KEYS.SELECTED_STOCK_ID, null, true)
        
        if (savedStockId !== null) {
          // 检查保存的标的是否还存在
          const stockExists = stocks.value.some(stock => stock.id === savedStockId)
          if (stockExists) {
            selectedStockId.value = savedStockId
          } else {
            // 如果保存的标的不存在，选择第一个标的
            selectedStockId.value = stocks.value[0].id
            // 更新缓存为第一个标的
            CacheManager.set(CACHE_KEYS.SELECTED_STOCK_ID, selectedStockId.value, true)
          }
        } else {
          // 没有保存的标的，默认选中第一个
          selectedStockId.value = stocks.value[0].id
          // 保存到缓存
          CacheManager.set(CACHE_KEYS.SELECTED_STOCK_ID, selectedStockId.value, true)
        }
      }
      
      logger.info('标的列表加载成功', { count: stocks.value.length })
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载标的列表失败'
      logger.error('加载标的列表失败', { error: err })
      throw err
    } finally {
      loading.value = false
    }
  }

  // 设置选中的标的ID
  const setSelectedStockId = (id: number | null) => {
    selectedStockId.value = id
    if (id !== null) {
      CacheManager.set(CACHE_KEYS.SELECTED_STOCK_ID, id, true)
    }
    logger.info('选中的标的ID已更新', { id })
  }

  // 创建标的
  const createStock = async (data: IStockFormData): Promise<IStock> => {
    try {
      const newStock = await StockRepo.create(data)
      // 重新加载列表
      await loadStocks()
      // 选中新创建的标的
      if (newStock.id) {
        setSelectedStockId(newStock.id)
      }
      logger.info('标的创建成功', { id: newStock.id })
      return newStock
    } catch (err) {
      logger.error('创建标的失败', { error: err })
      throw err
    }
  }

  // 更新标的
  const updateStock = async (id: number, data: Partial<IStockFormData>): Promise<IStock> => {
    try {
      const updatedStock = await StockRepo.update(id, data)
      // 重新加载列表
      await loadStocks()
      logger.info('标的更新成功', { id })
      return updatedStock
    } catch (err) {
      logger.error('更新标的失败', { error: err, id })
      throw err
    }
  }

  // 删除标的
  const deleteStock = async (id: number): Promise<void> => {
    try {
      await StockRepo.delete(id)
      // 如果删除的是当前选中的标的，清空选中状态
      if (selectedStockId.value === id) {
        selectedStockId.value = null
      }
      // 重新加载列表
      await loadStocks()
      logger.info('标的删除成功', { id })
    } catch (err) {
      logger.error('删除标的失败', { error: err, id })
      throw err
    }
  }

  // 加载日志列表
  const loadLogs = async (stockId: number): Promise<void> => {
    if (!stockId) {
      logs.value = []
      return
    }
    logsLoading.value = true
    logsError.value = ''
    try {
      const data = await TopicLogRepo.getListItemsByTopicIdsAndTypes(
        [stockId],
        [TopicEnums.TopicType.Stock],
        { offset: 0, size: 100 }
      )
      // 按创建时间倒序排列（最新的在前）
      logs.value = data.sort((a, b) => b.createTime - a.createTime)
      logger.info('标的日志加载成功', { stockId, count: logs.value.length })
    } catch (err) {
      logsError.value = err instanceof Error ? err.message : '加载日志失败'
      logger.error('加载标的日志失败', { error: err, stockId })
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
      if (selectedStockId.value) {
        await loadLogs(selectedStockId.value)
      }
      logger.info('标的日志创建成功', { topicId: data.topicId })
    } catch (err) {
      logger.error('创建标的日志失败', { error: err, topicId: data.topicId })
      throw err
    }
  }

  // 更新日志
  const updateLog = async (id: number, data: Partial<ITopicLogFormData>): Promise<void> => {
    try {
      await TopicLogRepo.update(id, data)
      // 重新加载日志列表
      if (selectedStockId.value) {
        await loadLogs(selectedStockId.value)
      }
      logger.info('标的日志更新成功', { id })
    } catch (err) {
      logger.error('更新标的日志失败', { error: err, id })
      throw err
    }
  }

  // 删除日志
  const deleteLog = async (id: number): Promise<void> => {
    try {
      await TopicLogRepo.delete(id)
      // 重新加载日志列表
      if (selectedStockId.value) {
        await loadLogs(selectedStockId.value)
      }
      logger.info('标的日志删除成功', { id })
    } catch (err) {
      logger.error('删除标的日志失败', { error: err, id })
      throw err
    }
  }

  return {
    // 标的相关状态
    stocks,
    loading,
    error,
    selectedStockId,
    selectedStock,
    // 日志相关状态
    logs,
    logsLoading,
    logsError,
    // 标的相关方法
    loadStocks,
    setSelectedStockId,
    createStock,
    updateStock,
    deleteStock,
    // 日志相关方法
    loadLogs,
    createLog,
    updateLog,
    deleteLog,
  }
})

