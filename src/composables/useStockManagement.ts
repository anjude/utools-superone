import { ref, computed, watch, nextTick } from 'vue'
import { ElMessageBox, ElNotification } from 'element-plus'
import type { IStock, IStockFormData } from '@/types/stock'
import type { TopicLogListItem, ITopicLogFormData } from '@/types/topic'
import { StockEnums, TopicEnums } from '@/constants/enums'
import { getCurrentTimestamp } from '@/utils/time'
import { logger } from '@/utils/logger'

/**
 * 标的管理 Composable
 * 管理编辑弹窗、右键菜单等 UI 状态
 */
export function useStockManagement(
  stockStore: ReturnType<typeof import('@/stores/stock').useStockStore>
) {

  // 编辑标的弹窗相关状态
  const showAddStockDialog = ref(false)
  const editingStockId = ref<number | null>(null)
  const stockForm = ref<IStockFormData>({
    name: '',
    code: '',
    type: StockEnums.StockType.Stock,
    pe: undefined,
    pb: undefined,
    dividendYield: undefined,
    currentPrice: undefined,
    watchPrice: undefined,
    top: 0,
  })
  const creatingStock = ref(false)
  const stockFormError = ref<string>('')

  // 判断是否为编辑模式
  const isEditMode = computed(() => editingStockId.value !== null)

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
      stockStore.selectedStockId !== null &&
      hasEditorContent.value &&
      !saving.value
    )
  })

  // 当前选中的标的（从 store 获取）
  const selectedStock = computed(() => stockStore.selectedStock)

  // 编辑日志弹窗相关状态
  const showEditLogDialog = ref(false)
  const editingLog = ref<TopicLogListItem | null>(null)
  const editLogContent = ref('')
  const updatingLog = ref(false)
  const editLogError = ref<string>('')

  // 右键菜单相关状态
  const contextMenuVisible = ref(false)
  const contextMenuPosition = ref({ x: 0, y: 0 })
  const contextMenuStock = ref<IStock | null>(null)
  let contextMenuCloseHandler: ((e: MouseEvent) => void) | null = null

  // 标的类型选项
  const stockTypeOptions = [
    { label: '股票', value: StockEnums.StockType.Stock },
    { label: '基金', value: StockEnums.StockType.Fund },
    { label: '债券', value: StockEnums.StockType.Bond },
    { label: 'ETF', value: StockEnums.StockType.ETF },
    { label: '其他', value: StockEnums.StockType.Other },
  ]

  // 获取标的类型文本
  const getStockTypeText = (type: StockEnums.StockType): string => {
    const option = stockTypeOptions.find(opt => opt.value === type)
    return option?.label || '未知'
  }

  // 监听选中标的变化，自动加载日志
  watch(
    () => stockStore.selectedStockId,
    (newId) => {
      if (newId) {
        stockStore.loadLogs(newId)
      } else {
        stockStore.logs = []
      }
    }
  )

  // 打开添加标的对话框
  const handleOpenAddStockDialog = () => {
    editingStockId.value = null
    stockForm.value = {
      name: '',
      code: '',
      type: StockEnums.StockType.Stock,
      pe: undefined,
      pb: undefined,
      dividendYield: undefined,
      currentPrice: undefined,
      watchPrice: undefined,
      top: 0,
    }
    stockFormError.value = ''
    showAddStockDialog.value = true
  }

  // 打开编辑标的对话框
  const handleOpenEditStockDialog = (stock: IStock) => {
    editingStockId.value = stock.id
    stockForm.value = {
      name: stock.name,
      code: stock.code,
      type: stock.type,
      pe: stock.pe,
      pb: stock.pb,
      dividendYield: stock.dividendYield,
      currentPrice: stock.currentPrice,
      watchPrice: stock.watchPrice,
      top: stock.top,
    }
    stockFormError.value = ''
    showAddStockDialog.value = true
  }

  // 从右键菜单打开编辑对话框
  const handleOpenEditStockDialogFromMenu = () => {
    if (!contextMenuStock.value) return
    handleOpenEditStockDialog(contextMenuStock.value)
    closeContextMenu()
  }

  // 关闭添加/编辑标的对话框
  const handleCloseAddStockDialog = () => {
    showAddStockDialog.value = false
    editingStockId.value = null
    stockForm.value = {
      name: '',
      code: '',
      type: StockEnums.StockType.Stock,
      pe: undefined,
      pb: undefined,
      dividendYield: undefined,
      currentPrice: undefined,
      watchPrice: undefined,
      top: 0,
    }
    stockFormError.value = ''
  }

  // 创建标的
  const handleCreateStock = async () => {
    if (!stockForm.value.name?.trim()) {
      stockFormError.value = '标的名称不能为空'
      return
    }

    if (!stockForm.value.code?.trim()) {
      stockFormError.value = '标的代码不能为空'
      return
    }

    creatingStock.value = true
    stockFormError.value = ''
    try {
      await stockStore.createStock({
        name: stockForm.value.name.trim(),
        code: stockForm.value.code.trim(),
        type: stockForm.value.type,
        pe: stockForm.value.pe,
        pb: stockForm.value.pb,
        dividendYield: stockForm.value.dividendYield,
        currentPrice: stockForm.value.currentPrice,
        watchPrice: stockForm.value.watchPrice,
        top: 0,
      })
      handleCloseAddStockDialog()
      logger.info('标的创建成功')
    } catch (err) {
      stockFormError.value = err instanceof Error ? err.message : '创建标的失败'
      logger.error('创建标的失败', { error: err })
    } finally {
      creatingStock.value = false
    }
  }

  // 更新标的
  const handleUpdateStock = async () => {
    if (!editingStockId.value) return

    if (!stockForm.value.name?.trim()) {
      stockFormError.value = '标的名称不能为空'
      return
    }

    if (!stockForm.value.code?.trim()) {
      stockFormError.value = '标的代码不能为空'
      return
    }

    creatingStock.value = true
    stockFormError.value = ''
    try {
      await stockStore.updateStock(editingStockId.value, {
        name: stockForm.value.name.trim(),
        code: stockForm.value.code.trim(),
        type: stockForm.value.type,
        pe: stockForm.value.pe,
        pb: stockForm.value.pb,
        dividendYield: stockForm.value.dividendYield,
        currentPrice: stockForm.value.currentPrice,
        watchPrice: stockForm.value.watchPrice,
      })
      handleCloseAddStockDialog()
      logger.info('标的更新成功', { id: editingStockId.value })
    } catch (err) {
      stockFormError.value = err instanceof Error ? err.message : '更新标的失败'
      logger.error('更新标的失败', { error: err, id: editingStockId.value })
    } finally {
      creatingStock.value = false
    }
  }

  // 提交标的表单
  const handleSubmitStock = () => {
    if (isEditMode.value) {
      handleUpdateStock()
    } else {
      handleCreateStock()
    }
  }

  // 选择标的
  const handleStockSelect = (stock: IStock) => {
    stockStore.setSelectedStockId(stock.id)
  }

  // 保存日志
  const handleSaveLog = async () => {
    if (!stockStore.selectedStockId || !editorContent.value.trim()) {
      return
    }

    saving.value = true
    try {
      await stockStore.createLog({
        topicId: stockStore.selectedStockId,
        topicType: TopicEnums.TopicType.Stock,
        content: editorContent.value.trim(),
      })
      // 清空编辑器
      editorContent.value = ''
      logger.info('日志保存成功', { stockId: stockStore.selectedStockId })
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
      await stockStore.updateLog(editingLog.value.id, {
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

      await stockStore.deleteLog(log.id)
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

  // 关闭右键菜单
  const closeContextMenu = () => {
    contextMenuVisible.value = false
    if (contextMenuCloseHandler) {
      document.removeEventListener('click', contextMenuCloseHandler)
      contextMenuCloseHandler = null
    }
  }

  // 右键菜单处理
  const handleContextMenu = (event: MouseEvent, stock: IStock) => {
    event.preventDefault()
    event.stopPropagation()

    // 先关闭之前的菜单（如果有）
    closeContextMenu()

    contextMenuStock.value = stock
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

  // 删除标的
  const handleDeleteStock = async () => {
    if (!contextMenuStock.value) return

    const stockId = contextMenuStock.value.id
    const stockName = contextMenuStock.value.name

    try {
      await ElMessageBox.confirm(
        `确定要删除标的「${stockName}」吗？此操作不可恢复。`,
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

      await stockStore.deleteStock(stockId)
      closeContextMenu()
      logger.info('标的删除成功', { id: stockId })
    } catch (err) {
      // 用户取消删除或删除失败
      if (err === 'cancel') {
        closeContextMenu()
        return
      }
      logger.error('删除标的失败', { error: err })
      ElMessageBox.alert(err instanceof Error ? err.message : '删除标的失败', '错误', {
        confirmButtonText: '确定',
        type: 'error',
      })
    }
  }

  // 置顶标的
  const handlePinStock = async () => {
    if (!contextMenuStock.value) return

    const stockId = contextMenuStock.value.id
    const currentTimestamp = getCurrentTimestamp()

    try {
      await stockStore.updateStock(stockId, { top: currentTimestamp })
      await stockStore.loadStocks()
      closeContextMenu()
      logger.info('标的置顶成功', { id: stockId })
    } catch (err) {
      logger.error('置顶标的失败', { error: err })
      ElMessageBox.alert(err instanceof Error ? err.message : '置顶标的失败', '错误', {
        confirmButtonText: '确定',
        type: 'error',
      })
    }
  }

  // 取消置顶标的
  const handleUnpinStock = async () => {
    if (!contextMenuStock.value) return

    const stockId = contextMenuStock.value.id

    try {
      await stockStore.updateStock(stockId, { top: 0 })
      await stockStore.loadStocks()
      closeContextMenu()
      logger.info('取消置顶成功', { id: stockId })
    } catch (err) {
      logger.error('取消置顶失败', { error: err })
      ElMessageBox.alert(err instanceof Error ? err.message : '取消置顶失败', '错误', {
        confirmButtonText: '确定',
        type: 'error',
      })
    }
  }

  // 刷新功能（同时刷新标的列表和日志）
  const handleRefresh = async () => {
    await stockStore.loadStocks()
    if (stockStore.selectedStockId) {
      await stockStore.loadLogs(stockStore.selectedStockId)
    }
  }

  return {
    // 编辑标的弹窗状态
    showAddStockDialog,
    editingStockId,
    stockForm,
    creatingStock,
    stockFormError,
    isEditMode,
    // 编辑器状态
    editorContent,
    saving,
    hasEditorContent,
    canSave,
    selectedStock,
    // 编辑日志弹窗状态
    showEditLogDialog,
    editingLog,
    editLogContent,
    updatingLog,
    editLogError,
    // 右键菜单状态
    contextMenuVisible,
    contextMenuPosition,
    contextMenuStock,
    // 工具方法
    stockTypeOptions,
    getStockTypeText,
    // 编辑标的弹窗方法
    handleOpenAddStockDialog,
    handleOpenEditStockDialog,
    handleOpenEditStockDialogFromMenu,
    handleCloseAddStockDialog,
    handleSubmitStock,
    // 标的选择
    handleStockSelect,
    // 编辑器方法
    handleSaveLog,
    // 编辑日志弹窗方法
    handleOpenEditLogDialog,
    handleCloseEditLogDialog,
    handleUpdateLog,
    // 日志操作
    handleCopyLog,
    handleDeleteLog,
    // 右键菜单方法
    handleContextMenu,
    closeContextMenu,
    handleDeleteStock,
    handlePinStock,
    handleUnpinStock,
    // 刷新
    handleRefresh,
  }
}

