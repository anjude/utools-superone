import { ref, computed, watch, nextTick } from 'vue'
import { ElMessageBox, ElNotification } from 'element-plus'
import type { ITopic, ITopicFormData, TopicLogListItem, ITopicLogFormData } from '@/types/topic'
import { TopicEnums } from '@/constants/enums'
import { getCurrentTimestamp } from '@/utils/time'
import { logger } from '@/utils/logger'

/**
 * 主题管理 Composable
 * 管理编辑弹窗、右键菜单等 UI 状态
 */
export function useTopicManagement(
  topicStore: ReturnType<typeof import('@/stores/topic').useTopicStore>
) {

  // 编辑主题弹窗相关状态
  const showAddTopicDialog = ref(false)
  const editingTopicId = ref<number | null>(null)
  const topicForm = ref<{
    topicName: string
    description: string
  }>({
    topicName: '',
    description: '',
  })
  const creatingTopic = ref(false)
  const topicFormError = ref<string>('')

  // 判断是否为编辑模式
  const isEditMode = computed(() => editingTopicId.value !== null)

  // 编辑器相关状态
  const editorContent = ref('')
  const saving = ref(false)

  // 判断编辑器是否有内容（用于优化保存按钮禁用状态）
  const hasEditorContent = computed(() => {
    return editorContent.value.trim().length > 0
  })

  // 判断保存按钮是否可用
  const canSave = computed(() => {
    return (
      topicStore.selectedTopicId !== null &&
      hasEditorContent.value &&
      !saving.value
    )
  })

  // 当前选中的主题（从 store 获取）
  const selectedTopic = computed(() => topicStore.selectedTopic)

  // 编辑日志弹窗相关状态
  const showEditLogDialog = ref(false)
  const editingLog = ref<TopicLogListItem | null>(null)
  const editLogContent = ref('')
  const updatingLog = ref(false)
  const editLogError = ref<string>('')

  // 右键菜单相关状态
  const contextMenuVisible = ref(false)
  const contextMenuPosition = ref({ x: 0, y: 0 })
  const contextMenuTopic = ref<ITopic | null>(null)
  let contextMenuCloseHandler: ((e: MouseEvent) => void) | null = null

  // 监听选中主题变化，自动加载日志
  watch(
    () => topicStore.selectedTopicId,
    (newId) => {
      if (newId) {
        topicStore.loadLogs(newId)
      } else {
        topicStore.logs = []
      }
    }
  )

  // 打开添加主题对话框
  const handleOpenAddTopicDialog = () => {
    editingTopicId.value = null
    topicForm.value = {
      topicName: '',
      description: '',
    }
    topicFormError.value = ''
    showAddTopicDialog.value = true
  }

  // 打开编辑主题对话框
  const handleOpenEditTopicDialog = (topic: ITopic) => {
    editingTopicId.value = topic.id
    topicForm.value = {
      topicName: topic.topicName,
      description: topic.description || '',
    }
    topicFormError.value = ''
    showAddTopicDialog.value = true
  }

  // 从右键菜单打开编辑对话框
  const handleOpenEditTopicDialogFromMenu = () => {
    if (!contextMenuTopic.value) return
    handleOpenEditTopicDialog(contextMenuTopic.value)
    closeContextMenu()
  }

  // 关闭添加/编辑主题对话框
  const handleCloseAddTopicDialog = () => {
    showAddTopicDialog.value = false
    editingTopicId.value = null
    topicForm.value = {
      topicName: '',
      description: '',
    }
    topicFormError.value = ''
  }

  // 创建主题
  const handleCreateTopic = async () => {
    if (!topicForm.value.topicName?.trim()) {
      topicFormError.value = '主题名称不能为空'
      return
    }

    creatingTopic.value = true
    topicFormError.value = ''
    try {
      const description = topicForm.value.description?.trim()
      await topicStore.createTopic({
        topicName: topicForm.value.topicName.trim(),
        ...(description ? { description } : {}),
      })
      handleCloseAddTopicDialog()
      logger.info('主题创建成功')
    } catch (err) {
      topicFormError.value = err instanceof Error ? err.message : '创建主题失败'
      logger.error('创建主题失败', { error: err })
    } finally {
      creatingTopic.value = false
    }
  }

  // 更新主题
  const handleUpdateTopic = async () => {
    if (!editingTopicId.value) return

    if (!topicForm.value.topicName?.trim()) {
      topicFormError.value = '主题名称不能为空'
      return
    }

    creatingTopic.value = true
    topicFormError.value = ''
    try {
      const description = topicForm.value.description?.trim()
      await topicStore.updateTopic(editingTopicId.value, {
        topicName: topicForm.value.topicName.trim(),
        ...(description ? { description } : {}),
      })
      handleCloseAddTopicDialog()
      logger.info('主题更新成功', { id: editingTopicId.value })
    } catch (err) {
      topicFormError.value = err instanceof Error ? err.message : '更新主题失败'
      logger.error('更新主题失败', { error: err, id: editingTopicId.value })
    } finally {
      creatingTopic.value = false
    }
  }

  // 提交主题表单
  const handleSubmitTopic = () => {
    if (isEditMode.value) {
      handleUpdateTopic()
    } else {
      handleCreateTopic()
    }
  }

  // 选择主题
  const handleTopicSelect = (topic: ITopic) => {
    topicStore.setSelectedTopicId(topic.id)
  }

  // 保存日志
  const handleSaveLog = async () => {
    if (!topicStore.selectedTopicId || !editorContent.value.trim()) {
      return
    }

    saving.value = true
    try {
      await topicStore.createLog({
        topicId: topicStore.selectedTopicId,
        topicType: TopicEnums.TopicType.Topic,
        content: editorContent.value.trim(),
      })
      // 清空编辑器
      editorContent.value = ''
      logger.info('日志保存成功', { topicId: topicStore.selectedTopicId })
    } catch (err) {
      logger.error('保存日志失败', { error: err })
      ElNotification({
        message: err instanceof Error ? err.message : '保存日志失败',
        type: 'error',
        duration: 2000,
        position: 'bottom-right',
      })
    } finally {
      saving.value = false
    }
  }

  // 打开编辑日志弹窗
  const handleOpenEditLogDialog = (log: TopicLogListItem) => {
    editingLog.value = log
    editLogContent.value = log.content
    editLogError.value = ''
    showEditLogDialog.value = true
  }

  // 关闭编辑日志弹窗
  const handleCloseEditLogDialog = () => {
    showEditLogDialog.value = false
    editingLog.value = null
    editLogContent.value = ''
    editLogError.value = ''
  }

  // 保存编辑的日志
  const handleUpdateLog = async () => {
    if (!editingLog.value || !editLogContent.value.trim()) {
      editLogError.value = '日志内容不能为空'
      return
    }

    updatingLog.value = true
    editLogError.value = ''
    try {
      await topicStore.updateLog(editingLog.value.id, {
        content: editLogContent.value.trim(),
        topicId: editingLog.value.topicId,
        topicType: editingLog.value.topicType,
      })
      handleCloseEditLogDialog()
      logger.info('日志更新成功', { id: editingLog.value.id })
    } catch (err) {
      editLogError.value = err instanceof Error ? err.message : '更新日志失败'
      logger.error('更新日志失败', { error: err })
    } finally {
      updatingLog.value = false
    }
  }

  // 复制日志内容
  const handleCopyLog = async (log: TopicLogListItem) => {
    try {
      await navigator.clipboard.writeText(log.content)
      ElNotification({
        message: '已复制到剪贴板',
        type: 'success',
        duration: 2000,
        position: 'bottom-right',
      })
    } catch (err) {
      logger.error('复制失败', { error: err })
      ElNotification({
        message: '复制失败',
        type: 'error',
        duration: 2000,
        position: 'bottom-right',
      })
    }
  }

  // 删除日志
  const handleDeleteLog = async (log: TopicLogListItem) => {
    try {
      await ElMessageBox.confirm('确定要删除这条日志吗？此操作不可恢复。', '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        showClose: false,
        closeOnClickModal: false,
        closeOnPressEscape: false,
      })

      await topicStore.deleteLog(log.id)
      logger.info('日志删除成功', { id: log.id })
    } catch (err) {
      // 用户取消删除或删除失败
      if (err === 'cancel') {
        return
      }
      logger.error('删除日志失败', { error: err })
      ElMessageBox.alert(err instanceof Error ? err.message : '删除日志失败', '错误', {
        confirmButtonText: '确定',
        type: 'error',
      })
    }
  }

  // 切换日志标记
  const handleToggleMark = async (log: TopicLogListItem) => {
    try {
      const currentMark = log.mark || 0
      const isMarked = (currentMark & TopicEnums.TopicLogMark.Normal) > 0
      const newMark = isMarked
        ? currentMark & ~TopicEnums.TopicLogMark.Normal // 清除标记
        : currentMark | TopicEnums.TopicLogMark.Normal // 设置标记

      await topicStore.updateLog(log.id, {
        mark: newMark,
        topicId: log.topicId,
        topicType: log.topicType,
      })
      logger.info('日志标记切换成功', { id: log.id, marked: !isMarked })
    } catch (err) {
      logger.error('切换日志标记失败', { error: err })
      ElNotification({
        message: err instanceof Error ? err.message : '切换标记失败',
        type: 'error',
        duration: 2000,
        position: 'bottom-right',
      })
    }
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
  const handleContextMenu = (event: MouseEvent, topic: ITopic) => {
    event.preventDefault()
    event.stopPropagation()

    // 先关闭之前的菜单（如果有）
    closeContextMenu()

    contextMenuTopic.value = topic
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

  // 删除主题
  const handleDeleteTopic = async () => {
    if (!contextMenuTopic.value) return

    const topicId = contextMenuTopic.value.id
    const topicName = contextMenuTopic.value.topicName

    try {
      await ElMessageBox.confirm(
        `确定要删除主题「${topicName}」吗？此操作不可恢复。`,
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

      await topicStore.deleteTopic(topicId)
      closeContextMenu()
      logger.info('主题删除成功', { id: topicId })
    } catch (err) {
      // 用户取消删除或删除失败
      if (err === 'cancel') {
        closeContextMenu()
        return
      }
      logger.error('删除主题失败', { error: err })
      ElMessageBox.alert(err instanceof Error ? err.message : '删除主题失败', '错误', {
        confirmButtonText: '确定',
        type: 'error',
      })
    }
  }

  // 置顶主题
  const handlePinTopic = async () => {
    if (!contextMenuTopic.value) return

    const topicId = contextMenuTopic.value.id
    const currentTimestamp = getCurrentTimestamp()

    try {
      await topicStore.updateTopic(topicId, { top: currentTimestamp })
      await topicStore.loadTopics()
      closeContextMenu()
      logger.info('主题置顶成功', { id: topicId })
    } catch (err) {
      logger.error('置顶主题失败', { error: err })
      ElMessageBox.alert(err instanceof Error ? err.message : '置顶主题失败', '错误', {
        confirmButtonText: '确定',
        type: 'error',
      })
    }
  }

  // 取消置顶主题
  const handleUnpinTopic = async () => {
    if (!contextMenuTopic.value) return

    const topicId = contextMenuTopic.value.id

    try {
      await topicStore.updateTopic(topicId, { top: 0 })
      await topicStore.loadTopics()
      closeContextMenu()
      logger.info('取消置顶成功', { id: topicId })
    } catch (err) {
      logger.error('取消置顶失败', { error: err })
      ElMessageBox.alert(err instanceof Error ? err.message : '取消置顶失败', '错误', {
        confirmButtonText: '确定',
        type: 'error',
      })
    }
  }

  // 刷新功能（同时刷新主题列表和日志）
  const handleRefresh = async () => {
    await topicStore.loadTopics()
    if (topicStore.selectedTopicId) {
      await topicStore.loadLogs(topicStore.selectedTopicId)
    }
  }

  return {
    // 编辑主题弹窗状态
    showAddTopicDialog,
    editingTopicId,
    topicForm,
    creatingTopic,
    topicFormError,
    isEditMode,
    // 编辑器状态
    editorContent,
    saving,
    hasEditorContent,
    canSave,
    selectedTopic,
    // 编辑日志弹窗状态
    showEditLogDialog,
    editingLog,
    editLogContent,
    updatingLog,
    editLogError,
    // 右键菜单状态
    contextMenuVisible,
    contextMenuPosition,
    contextMenuTopic,
    // 编辑主题弹窗方法
    handleOpenAddTopicDialog,
    handleOpenEditTopicDialog,
    handleOpenEditTopicDialogFromMenu,
    handleCloseAddTopicDialog,
    handleSubmitTopic,
    // 主题选择
    handleTopicSelect,
    // 编辑器方法
    handleSaveLog,
    // 编辑日志弹窗方法
    handleOpenEditLogDialog,
    handleCloseEditLogDialog,
    handleUpdateLog,
    // 日志操作
    handleCopyLog,
    handleDeleteLog,
    handleToggleMark,
    // 右键菜单方法
    handleContextMenu,
    closeContextMenu,
    handleDeleteTopic,
    handlePinTopic,
    handleUnpinTopic,
    // 刷新
    handleRefresh,
  }
}

