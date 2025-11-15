import { ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { ChecklistRepo } from '@/repos/checklist-repo'
import type { ChecklistExecutionRecordEntity } from '@/types/checklist'
import { logger } from '@/utils/logger'

/**
 * 执行历史 Composable
 * 管理执行记录列表和详情
 */
export function useExecutionHistory() {
  // 执行记录相关状态
  const executions = ref<ChecklistExecutionRecordEntity[]>([])
  const executionsLoading = ref(false)
  const executionsError = ref<string>('')

  // 执行记录详情弹窗相关状态
  const showExecutionDetailDialog = ref(false)
  const viewingExecution = ref<ChecklistExecutionRecordEntity | null>(null)

  // 加载执行记录列表
  const loadExecutions = async (checklistId: number): Promise<void> => {
    if (!checklistId) {
      executions.value = []
      return
    }
    executionsLoading.value = true
    executionsError.value = ''
    try {
      const data = await ChecklistRepo.getExecutionList(checklistId)
      // 按创建时间倒序排列（最新的在前）
      executions.value = data.sort((a, b) => b.createTime - a.createTime)
      logger.info('执行记录列表加载成功', { checklistId, count: executions.value.length })
    } catch (err) {
      executionsError.value = err instanceof Error ? err.message : '加载执行记录失败'
      logger.error('加载执行记录失败', { error: err, checklistId })
      throw err
    } finally {
      executionsLoading.value = false
    }
  }

  // 查看执行记录详情
  const handleViewExecutionDetail = (execution: ChecklistExecutionRecordEntity) => {
    viewingExecution.value = execution
    showExecutionDetailDialog.value = true
  }

  // 关闭执行记录详情对话框
  const handleCloseExecutionDetailDialog = () => {
    showExecutionDetailDialog.value = false
    viewingExecution.value = null
  }

  // 删除执行记录
  const handleDeleteExecution = async (execution: ChecklistExecutionRecordEntity): Promise<void> => {
    try {
      await ElMessageBox.confirm(
        '确定要删除这条执行记录吗？此操作不可恢复。',
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          showClose: false,
          closeOnClickModal: false,
          closeOnPressEscape: false,
        }
      )
      
      await ChecklistRepo.deleteExecution(execution.id)
      
      // 从列表中移除
      const index = executions.value.findIndex(e => e.id === execution.id)
      if (index > -1) {
        executions.value.splice(index, 1)
      }
      
      logger.info('执行记录删除成功', { id: execution.id })
    } catch (err) {
      if (err === 'cancel') {
        return
      }
      logger.error('删除执行记录失败', { error: err, id: execution.id })
      ElMessageBox.alert(
        err instanceof Error ? err.message : '删除执行记录失败',
        '错误',
        {
          confirmButtonText: '确定',
          type: 'error',
        }
      )
      throw err
    }
  }

  // 获取执行记录的完成进度
  const getExecutionProgress = (execution: ChecklistExecutionRecordEntity): string => {
    if (!execution.stepSummaries || execution.stepSummaries.length === 0) {
      return '0/0'
    }
    const completed = execution.stepSummaries.filter(s => !s.isSkipped).length
    const total = execution.stepSummaries.length
    return `${completed}/${total}`
  }

  return {
    // 状态
    executions,
    executionsLoading,
    executionsError,
    showExecutionDetailDialog,
    viewingExecution,
    // 方法
    loadExecutions,
    handleViewExecutionDetail,
    handleCloseExecutionDetailDialog,
    handleDeleteExecution,
    getExecutionProgress,
  }
}

