import { ref, computed } from 'vue'
import { ElNotification } from 'element-plus'
import { ChecklistRepo } from '@/repos/checklist-repo'
import type { ChecklistEntity, ChecklistExecutionStepEntity } from '@/types/checklist'
import { ExecutionMode, ChecklistExecutionStatus } from '@/types/checklist'
import { getCurrentTimestamp } from '@/utils/time'
import { logger } from '@/utils/logger'

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

  // 重置执行状态
  const resetExecution = () => {
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
    }
  }

  // 全部清除
  const handleUnselectAll = () => {
    completedSteps.value.clear()
  }

  // 完成执行
  const completeExecution = async (checklistId: number): Promise<void> => {
    const currentChecklist = checklist()
    if (!checklistId || !currentChecklist) return

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

      // 重置执行状态
      resetExecution()

      logger.info('执行记录已保存', { checklistId })
      
      ElNotification({
        message: '执行记录已保存',
        type: 'success',
        duration: 2000,
        position: 'bottom-right'
      })
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
    toggleStepCompletion,
    isStepCompleted,
    getStepSummary,
    saveStepSummary,
    isNotesVisible,
    showItemNotes,
    handleNotesBlur,
    handleSelectAll,
    handleUnselectAll,
    completeExecution,
  }
}

