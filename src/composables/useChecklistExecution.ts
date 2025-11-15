import { ref, computed, watch } from 'vue'
import { ElNotification } from 'element-plus'
import { ChecklistRepo } from '@/repos/checklist-repo'
import type { ChecklistEntity, ChecklistExecutionStepEntity } from '@/types/checklist'
import { ExecutionMode, ChecklistExecutionStatus } from '@/types/checklist'
import { getCurrentTimestamp } from '@/utils/time'
import { logger } from '@/utils/logger'
import { CacheManager } from '@/utils/cache-manager'
import { CACHE_KEYS } from '@/stores/cache'

/**
 * 清单执行进度缓存数据结构
 */
interface ChecklistExecutionProgress {
  completedSteps: number[]
  stepSummaries: Record<number, string>
  overallSummary: string
  visibleNotes: number[]
}

/**
 * 清单执行 Composable
 * 管理执行状态和执行逻辑
 */
export function useChecklistExecution(checklist: () => ChecklistEntity | null) {
  // 执行相关状态
  const completedSteps = ref<Set<number>>(new Set())
  const stepSummaries = ref<Map<number, string>>(new Map())
  const overallSummary = ref('')
  const visibleNotes = ref<Set<number>>(new Set())
  const executionStartTime = ref<number | null>(null)

  // 计算属性
  const totalSteps = computed(() => checklist()?.items.length || 0)
  const completedCount = computed(() => completedSteps.value.size)
  const progressPercent = computed(() => {
    if (totalSteps.value === 0) return 0
    return Math.round((completedCount.value / totalSteps.value) * 100)
  })

  const canComplete = computed(() => {
    return checklist() !== null && totalSteps.value > 0
  })

  // 获取缓存key
  const getCacheKey = (checklistId: number): string => {
    return `${CACHE_KEYS.CHECKLIST_EXECUTION_PROGRESS}${checklistId}`
  }

  // 保存进度到缓存
  const saveProgress = (checklistId: number) => {
    if (!checklistId) return
    
    const progress: ChecklistExecutionProgress = {
      completedSteps: Array.from(completedSteps.value),
      stepSummaries: Object.fromEntries(stepSummaries.value),
      overallSummary: overallSummary.value,
      visibleNotes: Array.from(visibleNotes.value),
    }
    
    CacheManager.set(getCacheKey(checklistId), progress, true)
    logger.debug('保存清单执行进度', { checklistId, progress })
  }

  // 从缓存恢复进度
  const restoreProgress = (checklistId: number) => {
    if (!checklistId) return
    
    const currentChecklist = checklist()
    if (!currentChecklist) {
      logger.debug('无法恢复进度：清单不存在', { checklistId })
      return
    }

    const cached = CacheManager.get<ChecklistExecutionProgress>(getCacheKey(checklistId), null, true)
    if (!cached) {
      logger.debug('未找到缓存的执行进度', { checklistId })
      return
    }

    // 获取当前checklist的所有itemId，用于验证
    const validItemIds = new Set(currentChecklist.items.map(item => item.id))

    // 恢复完成步骤（只恢复有效的itemId）
    completedSteps.value.clear()
    cached.completedSteps.forEach(id => {
      if (validItemIds.has(id)) {
        completedSteps.value.add(id)
      }
    })

    // 恢复步骤备注（只恢复有效的itemId）
    stepSummaries.value.clear()
    Object.entries(cached.stepSummaries).forEach(([id, summary]) => {
      const itemId = Number(id)
      if (validItemIds.has(itemId)) {
        stepSummaries.value.set(itemId, summary)
      }
    })

    // 恢复整体总结
    overallSummary.value = cached.overallSummary || ''

    // 恢复可见备注（只恢复有效的itemId）
    visibleNotes.value.clear()
    cached.visibleNotes.forEach(id => {
      if (validItemIds.has(id)) {
        visibleNotes.value.add(id)
      }
    })

    logger.debug('恢复清单执行进度', { checklistId, cached })
  }

  // 清除缓存进度
  const clearProgress = (checklistId: number) => {
    if (!checklistId) return
    CacheManager.remove(getCacheKey(checklistId), true)
    logger.debug('清除清单执行进度缓存', { checklistId })
  }

  // 重置执行状态
  const resetExecution = () => {
    const currentChecklist = checklist()
    if (currentChecklist) {
      clearProgress(currentChecklist.id)
    }
    completedSteps.value.clear()
    stepSummaries.value.clear()
    overallSummary.value = ''
    visibleNotes.value.clear()
    executionStartTime.value = null
  }

  // 切换步骤完成状态
  const toggleStepCompletion = (itemId: number) => {
    if (completedSteps.value.has(itemId)) {
      completedSteps.value.delete(itemId)
    } else {
      completedSteps.value.add(itemId)
    }
    if (!executionStartTime.value) {
      executionStartTime.value = getCurrentTimestamp()
    }
    // 自动保存进度
    const currentChecklist = checklist()
    if (currentChecklist) {
      saveProgress(currentChecklist.id)
    }
  }

  // 判断步骤是否完成
  const isStepCompleted = (itemId: number): boolean => {
    return completedSteps.value.has(itemId)
  }

  // 获取步骤备注
  const getStepSummary = (itemId: number): string => {
    return stepSummaries.value.get(itemId) || ''
  }

  // 保存步骤备注
  const saveStepSummary = (itemId: number, summary: string) => {
    if (summary.trim().length > 0) {
      stepSummaries.value.set(itemId, summary)
    } else {
      stepSummaries.value.delete(itemId)
    }
    if (!executionStartTime.value) {
      executionStartTime.value = getCurrentTimestamp()
    }
    // 自动保存进度
    const currentChecklist = checklist()
    if (currentChecklist) {
      saveProgress(currentChecklist.id)
    }
  }

  // 判断备注是否可见
  const isNotesVisible = (itemId: number): boolean => {
    const existing = stepSummaries.value.get(itemId) || ''
    return existing.trim().length > 0 || visibleNotes.value.has(itemId)
  }

  // 显示备注编辑器
  const showItemNotes = (itemId: number) => {
    visibleNotes.value.add(itemId)
  }

  // 备注失去焦点
  const handleNotesBlur = (itemId: number) => {
    const notes = stepSummaries.value.get(itemId) || ''
    if (notes.trim().length === 0) {
      visibleNotes.value.delete(itemId)
    }
  }

  // 全部完成
  const handleSelectAll = () => {
    const currentChecklist = checklist()
    if (currentChecklist) {
      currentChecklist.items.forEach(item => {
        completedSteps.value.add(item.id)
      })
      if (!executionStartTime.value) {
        executionStartTime.value = getCurrentTimestamp()
      }
      // 自动保存进度
      saveProgress(currentChecklist.id)
    }
  }

  // 完成执行
  const completeExecution = async (checklistId: number): Promise<{
    checklistId: number
    checklistTitle: string
    stepSummaries: ChecklistExecutionStepEntity[]
    overallSummaryMd?: string
    completedCount: number
    totalCount: number
    createTime: number
    status: ChecklistExecutionStatus
  } | null> => {
    const currentChecklist = checklist()
    if (!checklistId || !currentChecklist) return null

    try {
      const currentTime = getCurrentTimestamp()
      const startTime = executionStartTime.value || currentTime

      // 构建步骤摘要
      const stepSummariesList: ChecklistExecutionStepEntity[] = currentChecklist.items.map(item => {
        const summary = stepSummaries.value.get(item.id) || ''
        const isCompleted = completedSteps.value.has(item.id)
        return {
          itemId: item.id,
          summaryMd: summary,
          confirmTime: isCompleted ? currentTime : undefined,
          isSkipped: !isCompleted,
        }
      })

      // 创建执行记录
      await ChecklistRepo.createExecution({
        checklistId,
        mode: ExecutionMode.Overview,
        overallSummaryMd: overallSummary.value.trim() || undefined,
        stepSummaries: stepSummariesList,
        startTime,
        finishTime: currentTime,
        status: ChecklistExecutionStatus.Completed,
      })

      // 保存执行记录数据用于弹窗展示
      const executionRecord = {
        checklistId,
        checklistTitle: currentChecklist.title,
        stepSummaries: stepSummariesList,
        overallSummaryMd: overallSummary.value.trim() || undefined,
        completedCount: stepSummariesList.filter(s => !s.isSkipped).length,
        totalCount: stepSummariesList.length,
        createTime: currentTime,
        status: ChecklistExecutionStatus.Completed,
      }

      // 清除缓存并重置执行状态
      clearProgress(checklistId)
      resetExecution()

      logger.info('执行记录已保存', { checklistId })
      
      // 返回执行记录数据，用于弹窗展示
      return executionRecord
    } catch (err) {
      logger.error('完成执行失败', { error: err, checklistId })
      ElNotification({
        message: err instanceof Error ? err.message : '完成执行失败',
        type: 'error',
        duration: 2000,
        position: 'bottom-right'
      })
      throw err
    }
  }

  // 监听整体总结变化，自动保存
  watch(overallSummary, () => {
    const currentChecklist = checklist()
    if (currentChecklist) {
      saveProgress(currentChecklist.id)
    }
  })

  return {
    // 状态
    completedSteps,
    stepSummaries,
    overallSummary,
    visibleNotes,
    executionStartTime,
    // 计算属性
    totalSteps,
    completedCount,
    progressPercent,
    canComplete,
    // 方法
    resetExecution,
    restoreProgress,
    saveProgress,
    toggleStepCompletion,
    isStepCompleted,
    getStepSummary,
    saveStepSummary,
    isNotesVisible,
    showItemNotes,
    handleNotesBlur,
    handleSelectAll,
    completeExecution,
  }
}

