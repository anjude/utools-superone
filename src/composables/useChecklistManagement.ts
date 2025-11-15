import { ref, computed, nextTick } from 'vue'
import { ElMessageBox } from 'element-plus'
import type { ChecklistEntity, ChecklistEditForm } from '@/types/checklist'
import { getCurrentTimestamp } from '@/utils/time'
import { logger } from '@/utils/logger'
import { idGenerator } from '@/utils/id-generator'

/**
 * 清单管理 Composable
 * 管理编辑弹窗、右键菜单等 UI 状态
 */
export function useChecklistManagement(
  checklistStore: ReturnType<typeof import('@/stores/checklist').useChecklistStore>
) {
  // 编辑清单弹窗相关状态
  const showEditChecklistDialog = ref(false)
  const editingChecklistId = ref<number | null>(null)
  const checklistForm = ref<ChecklistEditForm>({
    title: '',
    items: [],
  })
  const creatingChecklist = ref(false)
  const checklistFormError = ref<string>('')
  const forceUpdate = ref(0)

  // 判断是否为编辑模式
  const isEditMode = computed(() => editingChecklistId.value !== null)

  const canSaveChecklist = computed(() => {
    return checklistForm.value.title.trim().length > 0 && 
           checklistForm.value.items.length > 0 &&
           checklistForm.value.items.every(item => item.contentMd.trim().length > 0) &&
           !creatingChecklist.value
  })

  // 右键菜单相关状态
  const contextMenuVisible = ref(false)
  const contextMenuPosition = ref({ x: 0, y: 0 })
  const contextMenuChecklist = ref<ChecklistEntity | null>(null)
  let contextMenuCloseHandler: ((e: MouseEvent) => void) | null = null

  // 打开添加清单对话框
  const handleOpenAddChecklistDialog = () => {
    editingChecklistId.value = null
    checklistForm.value = {
      title: '',
      items: [{ id: idGenerator.generateId(), contentMd: '' }],
    }
    checklistFormError.value = ''
    forceUpdate.value++
    showEditChecklistDialog.value = true
  }

  // 打开编辑清单对话框
  const handleOpenEditChecklistDialog = (checklist: ChecklistEntity) => {
    editingChecklistId.value = checklist.id
    checklistForm.value = {
      title: checklist.title,
      items: checklist.items.map(item => ({ ...item })),
    }
    checklistFormError.value = ''
    forceUpdate.value++
    showEditChecklistDialog.value = true
  }

  // 从右键菜单打开编辑对话框
  const handleOpenEditChecklistDialogFromMenu = () => {
    if (!contextMenuChecklist.value) return
    handleOpenEditChecklistDialog(contextMenuChecklist.value)
    closeContextMenu()
  }

  // 关闭添加/编辑清单对话框
  const handleCloseEditChecklistDialog = () => {
    showEditChecklistDialog.value = false
    editingChecklistId.value = null
    checklistForm.value = {
      title: '',
      items: [],
    }
    checklistFormError.value = ''
  }

  // 添加检查项
  const handleAddItem = () => {
    checklistForm.value.items.push({ id: idGenerator.generateId(), contentMd: '' })
    forceUpdate.value++
  }

  // 删除检查项
  const handleDeleteItem = (index: number) => {
    if (checklistForm.value.items.length > 1) {
      checklistForm.value.items.splice(index, 1)
      forceUpdate.value++
    }
  }

  // 上移检查项
  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const items = checklistForm.value.items
      const temp = items[index]
      items[index] = items[index - 1]
      items[index - 1] = temp
      forceUpdate.value++
    }
  }

  // 下移检查项
  const handleMoveDown = (index: number) => {
    const items = checklistForm.value.items
    if (index < items.length - 1) {
      const temp = items[index]
      items[index] = items[index + 1]
      items[index + 1] = temp
      forceUpdate.value++
    }
  }

  // 创建清单
  const handleCreateChecklist = async () => {
    if (!checklistForm.value.title?.trim()) {
      checklistFormError.value = '清单标题不能为空'
      return
    }

    if (!checklistForm.value.items || checklistForm.value.items.length === 0) {
      checklistFormError.value = '至少需要一个检查项'
      return
    }

    for (const item of checklistForm.value.items) {
      if (!item.contentMd?.trim()) {
        checklistFormError.value = '检查项内容不能为空'
        return
      }
    }

    creatingChecklist.value = true
    checklistFormError.value = ''
    try {
      await checklistStore.createChecklist({
        title: checklistForm.value.title.trim(),
        items: checklistForm.value.items.map(item => ({
          id: item.id,
          contentMd: item.contentMd.trim(),
        })),
      })
      handleCloseEditChecklistDialog()
      logger.info('清单创建成功')
    } catch (err) {
      checklistFormError.value = err instanceof Error ? err.message : '创建清单失败'
      logger.error('创建清单失败', { error: err })
    } finally {
      creatingChecklist.value = false
    }
  }

  // 更新清单
  const handleUpdateChecklist = async () => {
    if (!editingChecklistId.value) return
    
    if (!checklistForm.value.title?.trim()) {
      checklistFormError.value = '清单标题不能为空'
      return
    }

    if (!checklistForm.value.items || checklistForm.value.items.length === 0) {
      checklistFormError.value = '至少需要一个检查项'
      return
    }

    for (const item of checklistForm.value.items) {
      if (!item.contentMd?.trim()) {
        checklistFormError.value = '检查项内容不能为空'
        return
      }
    }

    creatingChecklist.value = true
    checklistFormError.value = ''
    try {
      await checklistStore.updateChecklist(editingChecklistId.value, {
        title: checklistForm.value.title.trim(),
        items: checklistForm.value.items.map(item => ({
          id: item.id,
          contentMd: item.contentMd.trim(),
        })),
      })
      handleCloseEditChecklistDialog()
      logger.info('清单更新成功', { id: editingChecklistId.value })
    } catch (err) {
      checklistFormError.value = err instanceof Error ? err.message : '更新清单失败'
      logger.error('更新清单失败', { error: err, id: editingChecklistId.value })
    } finally {
      creatingChecklist.value = false
    }
  }

  // 提交清单表单
  const handleSubmitChecklist = () => {
    if (isEditMode.value) {
      handleUpdateChecklist()
    } else {
      handleCreateChecklist()
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
  const handleContextMenu = (event: MouseEvent, checklist: ChecklistEntity) => {
    event.preventDefault()
    event.stopPropagation()
    
    closeContextMenu()
    
    contextMenuChecklist.value = checklist
    contextMenuPosition.value = { x: event.clientX, y: event.clientY }
    contextMenuVisible.value = true
    
    nextTick(() => {
      contextMenuCloseHandler = (e: MouseEvent) => {
        if (!(e.target as HTMLElement).closest('.p-context-menu')) {
          closeContextMenu()
        }
      }
      document.addEventListener('click', contextMenuCloseHandler)
    })
  }

  // 删除清单
  const handleDeleteChecklist = async () => {
    if (!contextMenuChecklist.value) return
    
    const checklistId = contextMenuChecklist.value.id
    const checklistTitle = contextMenuChecklist.value.title
    
    try {
      await ElMessageBox.confirm(
        `确定要删除清单「${checklistTitle}」吗？此操作不可恢复。`,
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
      
      await checklistStore.deleteChecklist(checklistId)
      closeContextMenu()
      logger.info('清单删除成功', { id: checklistId })
    } catch (err) {
      if (err === 'cancel') {
        closeContextMenu()
        return
      }
      logger.error('删除清单失败', { error: err, id: checklistId })
      ElMessageBox.alert(
        err instanceof Error ? err.message : '删除清单失败',
        '错误',
        {
          confirmButtonText: '确定',
          type: 'error',
        }
      )
    }
  }

  // 置顶清单
  const handlePinChecklist = async () => {
    if (!contextMenuChecklist.value) return
    
    const checklistId = contextMenuChecklist.value.id
    const currentTimestamp = getCurrentTimestamp()
    
    try {
      await checklistStore.updateChecklist(checklistId, { top: currentTimestamp })
      await checklistStore.loadChecklists()
      closeContextMenu()
      logger.info('清单置顶成功', { id: checklistId })
    } catch (err) {
      logger.error('置顶清单失败', { error: err, id: checklistId })
      ElMessageBox.alert(
        err instanceof Error ? err.message : '置顶清单失败',
        '错误',
        {
          confirmButtonText: '确定',
          type: 'error',
        }
      )
    }
  }

  // 取消置顶清单
  const handleUnpinChecklist = async () => {
    if (!contextMenuChecklist.value) return
    
    const checklistId = contextMenuChecklist.value.id
    
    try {
      await checklistStore.updateChecklist(checklistId, { top: 0 })
      await checklistStore.loadChecklists()
      closeContextMenu()
      logger.info('取消置顶成功', { id: checklistId })
    } catch (err) {
      logger.error('取消置顶失败', { error: err, id: checklistId })
      ElMessageBox.alert(
        err instanceof Error ? err.message : '取消置顶失败',
        '错误',
        {
          confirmButtonText: '确定',
          type: 'error',
        }
      )
    }
  }

  return {
    // 编辑弹窗状态
    showEditChecklistDialog,
    editingChecklistId,
    checklistForm,
    creatingChecklist,
    checklistFormError,
    forceUpdate,
    isEditMode,
    canSaveChecklist,
    // 右键菜单状态
    contextMenuVisible,
    contextMenuPosition,
    contextMenuChecklist,
    // 编辑弹窗方法
    handleOpenAddChecklistDialog,
    handleOpenEditChecklistDialog,
    handleOpenEditChecklistDialogFromMenu,
    handleCloseEditChecklistDialog,
    handleAddItem,
    handleDeleteItem,
    handleMoveUp,
    handleMoveDown,
    handleSubmitChecklist,
    // 右键菜单方法
    handleContextMenu,
    closeContextMenu,
    handleDeleteChecklist,
    handlePinChecklist,
    handleUnpinChecklist,
  }
}

