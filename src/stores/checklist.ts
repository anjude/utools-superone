import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ChecklistEntity, ChecklistEditForm } from '@/types/checklist'
import { ChecklistRepo } from '@/repos/checklist-repo'
import { CacheManager } from '@/utils/cache-manager'
import { CACHE_KEYS } from './cache'
import { logger } from '@/utils/logger'

/**
 * 清单状态管理 Store
 * 管理清单列表、选中状态、CRUD 操作
 */
export const useChecklistStore = defineStore('checklist', () => {
  // 状态
  const checklists = ref<ChecklistEntity[]>([])
  const loading = ref(false)
  const error = ref<string>('')
  const selectedChecklistId = ref<number | null>(null)

  // 计算属性
  const selectedChecklist = computed(() => {
    return checklists.value.find(c => c.id === selectedChecklistId.value) || null
  })

  // 加载清单列表
  const loadChecklists = async (): Promise<void> => {
    loading.value = true
    error.value = ''
    try {
      const data = await ChecklistRepo.getAll()
      // 按置顶权重和创建时间排序：置顶的在前，同置顶权重按创建时间倒序
      checklists.value = data.sort((a, b) => {
        if (a.top !== b.top) {
          return b.top - a.top // 置顶权重大的在前
        }
        return b.createTime - a.createTime // 创建时间新的在前
      })
      
      // 如果有清单且没有选中，尝试从缓存恢复选中的清单
      if (checklists.value.length > 0 && !selectedChecklistId.value) {
        const savedChecklistId = CacheManager.get<number>(CACHE_KEYS.SELECTED_CHECKLIST_ID, null, true)
        
        if (savedChecklistId !== null) {
          const checklistExists = checklists.value.some(checklist => checklist.id === savedChecklistId)
          if (checklistExists) {
            selectedChecklistId.value = savedChecklistId
          } else {
            selectedChecklistId.value = checklists.value[0].id
            CacheManager.set(CACHE_KEYS.SELECTED_CHECKLIST_ID, selectedChecklistId.value, true)
          }
        } else {
          selectedChecklistId.value = checklists.value[0].id
          CacheManager.set(CACHE_KEYS.SELECTED_CHECKLIST_ID, selectedChecklistId.value, true)
        }
      }
      
      logger.info('清单列表加载成功', { count: checklists.value.length })
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载清单列表失败'
      logger.error('加载清单列表失败', { error: err })
      throw err
    } finally {
      loading.value = false
    }
  }

  // 设置选中的清单
  const setSelectedChecklistId = (id: number | null) => {
    selectedChecklistId.value = id
    if (id !== null) {
      CacheManager.set(CACHE_KEYS.SELECTED_CHECKLIST_ID, id, true)
    }
  }

  // 创建清单
  const createChecklist = async (data: ChecklistEditForm): Promise<ChecklistEntity> => {
    try {
      const newChecklist = await ChecklistRepo.create(data)
      // 重新加载列表
      await loadChecklists()
      // 选中新创建的清单
      if (newChecklist.id) {
        setSelectedChecklistId(newChecklist.id)
      }
      logger.info('清单创建成功', { id: newChecklist.id })
      return newChecklist
    } catch (err) {
      logger.error('创建清单失败', { error: err })
      throw err
    }
  }

  // 更新清单
  const updateChecklist = async (id: number, data: Partial<ChecklistEditForm>): Promise<ChecklistEntity> => {
    try {
      const updatedChecklist = await ChecklistRepo.update(id, data)
      // 重新加载列表
      await loadChecklists()
      logger.info('清单更新成功', { id })
      return updatedChecklist
    } catch (err) {
      logger.error('更新清单失败', { error: err, id })
      throw err
    }
  }

  // 删除清单
  const deleteChecklist = async (id: number): Promise<void> => {
    try {
      await ChecklistRepo.delete(id)
      // 如果删除的是当前选中的清单，清空选中状态
      if (selectedChecklistId.value === id) {
        selectedChecklistId.value = null
      }
      // 重新加载列表
      await loadChecklists()
      logger.info('清单删除成功', { id })
    } catch (err) {
      logger.error('删除清单失败', { error: err, id })
      throw err
    }
  }

  // 根据ID获取清单
  const getChecklistById = async (id: number): Promise<ChecklistEntity | null> => {
    try {
      return await ChecklistRepo.getById(id)
    } catch (err) {
      logger.error('获取清单失败', { error: err, id })
      throw err
    }
  }

  return {
    // 状态
    checklists,
    loading,
    error,
    selectedChecklistId,
    selectedChecklist,
    // 方法
    loadChecklists,
    setSelectedChecklistId,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    getChecklistById,
  }
})

