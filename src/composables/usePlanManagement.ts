import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElNotification } from 'element-plus'
import type { RecentTask, RecentTaskForm } from '@/types/plan'
import { TaskEnums } from '@/types/plan'
import { getCurrentTimestamp } from '@/utils/time'
import { logger } from '@/utils/logger'
import { validateTextField, validatePriority, validateForm } from '@/utils/form-validation'
import { CacheManager } from '@/utils/cache-manager'
import { CACHE_KEYS } from '@/stores/cache'
import { TopicLogRepo } from '@/repos/topic-log-repo'
import { TopicEnums } from '@/constants/enums'
import { formatDeadline } from '@/utils/time'

/**
 * 计划管理 Composable
 * 管理编辑弹窗、状态筛选、表单验证等 UI 状态
 */
export function usePlanManagement(
  planStore: ReturnType<typeof import('@/stores/plan').usePlanStore>
) {
  const router = useRouter()
  // 编辑任务弹窗相关状态
  const showAddPlanDialog = ref(false)
  const editingTaskId = ref<number | null>(null)
  const planForm = ref<RecentTaskForm>({
    title: '',
    description: '',
    priority: TaskEnums.Priority.Medium,
    deadline: undefined,
  })
  const creatingTask = ref(false)
  const planFormError = ref<string>('')

  // 判断是否为编辑模式
  const isEditMode = computed(() => editingTaskId.value !== null)

  // 状态筛选相关状态
  const statusList = computed(() => [
    { value: TaskEnums.Status.Pending, label: '待处理' },
    { value: TaskEnums.Status.InProgress, label: '进行中' },
    { value: TaskEnums.Status.Completed, label: '已完成' },
    { value: TaskEnums.Status.Cancelled, label: '已取消' },
  ])

  // 右键菜单相关状态
  const contextMenuVisible = ref(false)
  const contextMenuPosition = ref({ x: 0, y: 0 })
  const contextMenuTask = ref<RecentTask | null>(null)
  let contextMenuCloseHandler: ((e: MouseEvent) => void) | null = null

  // 状态选择菜单相关状态
  const statusMenuVisible = ref(false)
  const statusMenuPosition = ref({ x: 0, y: 0 })
  const statusMenuTask = ref<RecentTask | null>(null)
  let statusMenuCloseHandler: ((e: MouseEvent) => void) | null = null

  // 任务选择相关状态
  const selectedTaskId = ref<number | null>(null)
  
  // 计算属性：获取选中的任务
  const selectedTask = computed(() => {
    if (!selectedTaskId.value) return null
    return planStore.tasks.find(task => task.id === selectedTaskId.value) || null
  })
  
  // 选择任务
  const handleTaskSelect = (task: RecentTask) => {
    selectedTaskId.value = task.id
    // 保存到缓存
    CacheManager.set(CACHE_KEYS.SELECTED_PLAN_TASK_ID, task.id, true)
    logger.info('任务已选择', { id: task.id })
  }
  
  // 恢复上次选择的任务，如果没有则选择第一个任务
  const restoreSelectedTask = () => {
    const filteredTasks = planStore.filteredTasks
    if (filteredTasks.length === 0) {
      selectedTaskId.value = null
      return
    }
    
    // 尝试从缓存恢复上次选择的任务
    const cachedTaskId = CacheManager.get<number>(CACHE_KEYS.SELECTED_PLAN_TASK_ID, null, true)
    if (cachedTaskId !== null) {
      const task = filteredTasks.find(t => t.id === cachedTaskId)
      if (task) {
        selectedTaskId.value = cachedTaskId
        logger.info('已恢复上次选择的任务', { id: cachedTaskId })
        return
      }
    }
    
    // 如果没有缓存或任务不存在，选择第一个任务
    selectedTaskId.value = filteredTasks[0].id
    CacheManager.set(CACHE_KEYS.SELECTED_PLAN_TASK_ID, filteredTasks[0].id, true)
    logger.info('已选择第一个任务', { id: filteredTasks[0].id })
  }

  // 打开添加任务对话框
  const handleOpenAddPlanDialog = () => {
    editingTaskId.value = null
    planForm.value = {
      title: '',
      description: '',
      priority: TaskEnums.Priority.Medium,
      deadline: undefined,
    }
    planFormError.value = ''
    showAddPlanDialog.value = true
  }

  // 打开编辑任务对话框
  const handleOpenEditPlanDialog = (task: RecentTask) => {
    editingTaskId.value = task.id
    planForm.value = {
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      deadline: task.deadline,
    }
    planFormError.value = ''
    showAddPlanDialog.value = true
  }

  // 从右键菜单打开编辑对话框
  const handleOpenEditPlanDialogFromMenu = () => {
    if (!contextMenuTask.value) return
    handleOpenEditPlanDialog(contextMenuTask.value)
    closeContextMenu()
  }

  // 关闭添加/编辑任务对话框
  const handleCloseAddPlanDialog = () => {
    showAddPlanDialog.value = false
    editingTaskId.value = null
    planForm.value = {
      title: '',
      description: '',
      priority: TaskEnums.Priority.Medium,
      deadline: undefined,
    }
    planFormError.value = ''
  }

  // 创建任务
  const handleCreateTask = async () => {
    // 表单验证
    const validations = [
      validateTextField(planForm.value.title, '任务标题', {
        required: true,
        minLength: 1,
        maxLength: 50,
      }),
      validatePriority(planForm.value.priority, '优先级'),
    ]

    if (!validateForm(validations)) {
      return
    }

    creatingTask.value = true
    planFormError.value = ''
    try {
      const description = planForm.value.description?.trim()
      // 确保 deadline 是数字类型（秒级时间戳）
      const deadline = planForm.value.deadline
        ? typeof planForm.value.deadline === 'string'
          ? parseInt(planForm.value.deadline, 10)
          : planForm.value.deadline
        : undefined
      
      await planStore.createTask({
        title: planForm.value.title.trim(),
        description: description || '',
        priority: planForm.value.priority,
        deadline,
      })
      handleCloseAddPlanDialog()
      ElNotification({
        message: '任务创建成功',
        type: 'success',
        duration: 2000,
        position: 'bottom-right',
      })
      logger.info('任务创建成功')
    } catch (err) {
      planFormError.value = err instanceof Error ? err.message : '创建任务失败'
      logger.error('创建任务失败', { error: err })
      ElNotification({
        message: err instanceof Error ? err.message : '创建任务失败',
        type: 'error',
        duration: 2000,
        position: 'bottom-right',
      })
    } finally {
      creatingTask.value = false
    }
  }

  // 更新任务
  const handleUpdateTask = async () => {
    if (!editingTaskId.value) return

    // 表单验证
    const validations = [
      validateTextField(planForm.value.title, '任务标题', {
        required: true,
        minLength: 1,
        maxLength: 50,
      }),
      validatePriority(planForm.value.priority, '优先级'),
    ]

    if (!validateForm(validations)) {
      return
    }

    creatingTask.value = true
    planFormError.value = ''
    try {
      const description = planForm.value.description?.trim()
      // 确保 deadline 是数字类型（秒级时间戳）
      const deadline = planForm.value.deadline
        ? typeof planForm.value.deadline === 'string'
          ? parseInt(planForm.value.deadline, 10)
          : planForm.value.deadline
        : undefined
      
      await planStore.updateTask(editingTaskId.value, {
        title: planForm.value.title.trim(),
        description: description || '',
        priority: planForm.value.priority,
        deadline,
      })
      handleCloseAddPlanDialog()
      ElNotification({
        message: '任务更新成功',
        type: 'success',
        duration: 2000,
        position: 'bottom-right',
      })
      logger.info('任务更新成功', { id: editingTaskId.value })
    } catch (err) {
      planFormError.value = err instanceof Error ? err.message : '更新任务失败'
      logger.error('更新任务失败', { error: err, id: editingTaskId.value })
      ElNotification({
        message: err instanceof Error ? err.message : '更新任务失败',
        type: 'error',
        duration: 2000,
        position: 'bottom-right',
      })
    } finally {
      creatingTask.value = false
    }
  }

  // 提交任务表单
  const handleSubmitPlan = () => {
    if (isEditMode.value) {
      handleUpdateTask()
    } else {
      handleCreateTask()
    }
  }

  // 切换状态筛选
  const handleToggleStatus = (status: TaskEnums.Status) => {
    planStore.toggleStatus(status)
  }

  // 关闭右键菜单
  const closeContextMenu = () => {
    contextMenuVisible.value = false
    if (contextMenuCloseHandler) {
      document.removeEventListener('click', contextMenuCloseHandler)
      contextMenuCloseHandler = null
    }
  }

  // 右键菜单处理
  const handleContextMenu = (event: MouseEvent, task: RecentTask) => {
    event.preventDefault()
    event.stopPropagation()

    // 先关闭之前的菜单（如果有）
    closeContextMenu()

    contextMenuTask.value = task
    contextMenuPosition.value = { x: event.clientX, y: event.clientY }
    contextMenuVisible.value = true

    // 点击其他地方关闭菜单
    nextTick(() => {
      contextMenuCloseHandler = (e: MouseEvent) => {
        if (!(e.target as HTMLElement).closest('.p-context-menu')) {
          closeContextMenu()
        }
      }
      document.addEventListener('click', contextMenuCloseHandler)
    })
  }

  // 关闭状态选择菜单
  const closeStatusMenu = () => {
    statusMenuVisible.value = false
    if (statusMenuCloseHandler) {
      document.removeEventListener('click', statusMenuCloseHandler)
      statusMenuCloseHandler = null
    }
  }

  // 打开状态选择菜单
  const handleOpenStatusMenu = (event: MouseEvent, task: RecentTask) => {
    event.preventDefault()
    event.stopPropagation()

    // 先关闭之前的菜单（如果有）
    closeStatusMenu()

    statusMenuTask.value = task
    statusMenuPosition.value = { x: event.clientX, y: event.clientY }
    statusMenuVisible.value = true

    // 点击其他地方关闭菜单
    nextTick(() => {
      statusMenuCloseHandler = (e: MouseEvent) => {
        if (!(e.target as HTMLElement).closest('.p-status-menu')) {
          closeStatusMenu()
        }
      }
      document.addEventListener('click', statusMenuCloseHandler)
    })
  }

  // 切换任务状态
  const handleChangeTaskStatus = async (newStatus: TaskEnums.Status) => {
    if (!statusMenuTask.value) return

    const taskId = statusMenuTask.value.id
    const currentStatus = statusMenuTask.value.status

    // 如果状态相同，不执行操作
    if (currentStatus === newStatus) {
      closeStatusMenu()
      return
    }

    try {
      await planStore.updateTaskStatus(taskId, newStatus)
      closeStatusMenu()
      ElNotification({
        message: '状态更新成功',
        type: 'success',
        duration: 500,
        position: 'bottom-right',
      })
      logger.info('任务状态更新成功', { id: taskId, status: newStatus })
    } catch (err) {
      logger.error('更新任务状态失败', { error: err, id: taskId, status: newStatus })
      ElNotification({
        message: err instanceof Error ? err.message : '更新状态失败',
        type: 'error',
        duration: 2000,
        position: 'bottom-right',
      })
    }
  }

  // 删除任务
  const handleDeleteTask = async () => {
    if (!contextMenuTask.value) return

    const taskId = contextMenuTask.value.id
    const taskTitle = contextMenuTask.value.title

    try {
      await ElMessageBox.confirm(
        `确定要删除任务「${taskTitle}」吗？此操作不可恢复。`,
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

      await planStore.deleteTask(taskId)
      // 如果删除的是当前选中的任务，清除选中状态
      if (selectedTaskId.value === taskId) {
        selectedTaskId.value = null
      }
      closeContextMenu()
      ElNotification({
        message: '任务删除成功',
        type: 'success',
        duration: 2000,
        position: 'bottom-right',
      })
      logger.info('任务删除成功', { id: taskId })
    } catch (err) {
      // 用户取消删除或删除失败
      if (err === 'cancel') {
        closeContextMenu()
        return
      }
      logger.error('删除任务失败', { error: err })
      ElMessageBox.alert(err instanceof Error ? err.message : '删除任务失败', '错误', {
        confirmButtonText: '确定',
        type: 'error',
      })
    }
  }

  // 置顶任务
  const handlePinTask = async () => {
    if (!contextMenuTask.value) return

    const taskId = contextMenuTask.value.id
    const currentTimestamp = getCurrentTimestamp()

    try {
      await planStore.updateTask(taskId, { top: currentTimestamp })
      await planStore.loadTasks()
      closeContextMenu()
      ElNotification({
        message: '任务置顶成功',
        type: 'success',
        duration: 2000,
        position: 'bottom-right',
      })
      logger.info('任务置顶成功', { id: taskId })
    } catch (err) {
      logger.error('置顶任务失败', { error: err })
      ElNotification({
        message: err instanceof Error ? err.message : '置顶任务失败',
        type: 'error',
        duration: 2000,
        position: 'bottom-right',
      })
    }
  }

  // 取消置顶任务
  const handleUnpinTask = async () => {
    if (!contextMenuTask.value) return

    const taskId = contextMenuTask.value.id

    try {
      await planStore.updateTask(taskId, { top: 0 })
      await planStore.loadTasks()
      closeContextMenu()
      ElNotification({
        message: '取消置顶成功',
        type: 'success',
        duration: 2000,
        position: 'bottom-right',
      })
      logger.info('取消置顶成功', { id: taskId })
    } catch (err) {
      logger.error('取消置顶失败', { error: err })
      ElNotification({
        message: err instanceof Error ? err.message : '取消置顶失败',
        type: 'error',
        duration: 2000,
        position: 'bottom-right',
      })
    }
  }

  // 刷新功能
  const handleRefresh = async () => {
    await planStore.loadTasks()
  }

  // 获取状态标签文本
  const getStatusLabel = (status: TaskEnums.Status): string => {
    const statusItem = statusList.value.find(s => s.value === status)
    return statusItem?.label || '未知状态'
  }

  // 获取优先级标签文本
  const getPriorityLabel = (priority: TaskEnums.Priority): string => {
    const priorityMap = {
      [TaskEnums.Priority.Low]: '低',
      [TaskEnums.Priority.Medium]: '中',
      [TaskEnums.Priority.High]: '高',
    }
    return priorityMap[priority] || '未知'
  }

  // 跳转到任务详情页
  const handleNavigateToDetail = () => {
    if (!contextMenuTask.value) return
    closeContextMenu()
    router.push({ name: 'PlanDetail', params: { id: contextMenuTask.value.id } })
    logger.info('跳转到任务详情页', { id: contextMenuTask.value.id })
  }

  // 保存快照
  const handleSaveSnapshot = async () => {
    if (!contextMenuTask.value) return

    const task = contextMenuTask.value
    const taskId = task.id

    try {
      // 格式化任务详情为 markdown
      const snapshotContent = formatTaskSnapshot(task)
      
      // 创建日志
      await TopicLogRepo.create({
        topicType: TopicEnums.TopicType.RecentTask,
        topicId: taskId,
        content: snapshotContent
      })
      
      closeContextMenu()
      logger.info('任务快照保存成功', { taskId })
      ElNotification({
        message: '快照保存成功',
        type: 'success',
        duration: 2000,
        position: 'bottom-right',
      })
    } catch (err) {
      logger.error('任务快照保存失败', { error: err, taskId })
      ElNotification({
        message: err instanceof Error ? err.message : '保存失败',
        type: 'error',
        duration: 2000,
        position: 'bottom-right',
      })
    }
  }

  // 格式化任务详情为 markdown
  const formatTaskSnapshot = (taskData: RecentTask): string => {
    const lines: string[] = []
    
    lines.push('# 任务快照')
    lines.push('')
    lines.push(`**标题**: ${taskData.title || '-'}`)
    lines.push(`**状态**: ${getStatusLabel(taskData.status)}`)
    lines.push(`**优先级**: ${getPriorityLabel(taskData.priority)}`)
    
    if (taskData.deadline) {
      lines.push(`**截止日期**: ${formatDeadline(taskData.deadline)}`)
    } else {
      lines.push('**截止日期**: 无')
    }
    
    lines.push('')
    lines.push('**描述**:')
    if (taskData.description) {
      lines.push('')
      lines.push(taskData.description)
    } else {
      lines.push('')
      lines.push('暂无描述')
    }
    
    return lines.join('\n')
  }

  return {
    // 编辑任务弹窗状态
    showAddPlanDialog,
    editingTaskId,
    planForm,
    creatingTask,
    planFormError,
    isEditMode,
    // 状态筛选相关
    statusList,
    selectedStatusList: computed(() => planStore.selectedStatusList),
    // 任务选择相关
    selectedTaskId,
    selectedTask,
    handleTaskSelect,
    restoreSelectedTask,
    // 右键菜单状态
    contextMenuVisible,
    contextMenuPosition,
    contextMenuTask,
    // 状态选择菜单状态
    statusMenuVisible,
    statusMenuPosition,
    statusMenuTask,
    // 编辑任务弹窗方法
    handleOpenAddPlanDialog,
    handleOpenEditPlanDialog: handleOpenEditPlanDialog,
    handleOpenEditPlanDialogFromMenu,
    handleCloseAddPlanDialog,
    handleSubmitPlan,
    // 状态筛选方法
    handleToggleStatus,
    // 状态流转方法
    handleOpenStatusMenu,
    handleChangeTaskStatus,
    // 右键菜单方法
    handleContextMenu,
    closeContextMenu,
    handleDeleteTask,
    handlePinTask,
    handleUnpinTask,
    // 刷新
    handleRefresh,
    // 工具方法
    getStatusLabel,
    getPriorityLabel,
    // 右键菜单新增方法
    handleNavigateToDetail,
    handleSaveSnapshot,
  }
}

