<script lang="ts" setup>
import { onMounted, ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElNotification } from 'element-plus'
import { MarkdownEditor, MarkdownViewer } from '@/components'
import { ChecklistRepo } from '@/repos/checklist-repo'
import type { ChecklistEntity, ChecklistEditForm, ChecklistItemEntity, ChecklistExecutionRecordEntity, ChecklistExecutionStepEntity } from '@/types/checklist'
import { ChecklistEnums } from '@/constants/enums'
import { ExecutionMode, ChecklistExecutionStatus } from '@/types/checklist'
import { timestampToChineseDateTime, getCurrentTimestamp } from '@/utils/time'
import { CacheManager } from '@/utils/cache-manager'
import { CACHE_KEYS } from '@/stores/cache'

const { t } = useI18n()
const router = useRouter()

const checklists = ref<ChecklistEntity[]>([])
const loading = ref(false)
const error = ref<string>('')

// 选中的清单ID
const selectedChecklistId = ref<number | null>(null)

// 当前选中的清单
const selectedChecklist = computed(() => {
  return checklists.value.find(c => c.id === selectedChecklistId.value) || null
})

// 执行相关状态
const completedSteps = ref<Set<number>>(new Set())
const stepSummaries = ref<Map<number, string>>(new Map())
const overallSummary = ref('')
const visibleNotes = ref<Set<number>>(new Set())
const executionStartTime = ref<number | null>(null)

// 执行记录相关状态
const executions = ref<ChecklistExecutionRecordEntity[]>([])
const executionsLoading = ref(false)
const executionsError = ref<string>('')

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

// 执行记录详情弹窗相关状态
const showExecutionDetailDialog = ref(false)
const viewingExecution = ref<ChecklistExecutionRecordEntity | null>(null)

// 右键菜单相关状态
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const contextMenuChecklist = ref<ChecklistEntity | null>(null)
let contextMenuCloseHandler: ((e: MouseEvent) => void) | null = null

// 计算属性
const totalSteps = computed(() => selectedChecklist.value?.items.length || 0)
const completedCount = computed(() => completedSteps.value.size)
const progressPercent = computed(() => {
  if (totalSteps.value === 0) return 0
  return Math.round((completedCount.value / totalSteps.value) * 100)
})

const canComplete = computed(() => {
  return selectedChecklistId.value !== null && totalSteps.value > 0
})

const canSaveChecklist = computed(() => {
  return checklistForm.value.title.trim().length > 0 && 
         checklistForm.value.items.length > 0 &&
         checklistForm.value.items.every(item => item.contentMd.trim().length > 0) &&
         !creatingChecklist.value
})

// 加载清单列表
const loadChecklists = async () => {
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
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载清单列表失败'
    console.error('加载清单列表失败:', err)
  } finally {
    loading.value = false
  }
}

// 加载执行记录列表
const loadExecutions = async (checklistId: number) => {
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
  } catch (err) {
    executionsError.value = err instanceof Error ? err.message : '加载执行记录失败'
    console.error('加载执行记录失败:', err)
  } finally {
    executionsLoading.value = false
  }
}

// 刷新功能
const handleRefresh = async () => {
  await loadChecklists()
  if (selectedChecklistId.value) {
    await loadExecutions(selectedChecklistId.value)
    resetExecution()
  }
}

// 监听选中清单变化，自动加载执行记录和重置执行状态
watch(selectedChecklistId, (newId) => {
  if (newId) {
    loadExecutions(newId)
    resetExecution()
    CacheManager.set(CACHE_KEYS.SELECTED_CHECKLIST_ID, newId, true)
  } else {
    executions.value = []
    resetExecution()
  }
})

const handleChecklistSelect = (checklist: ChecklistEntity) => {
  selectedChecklistId.value = checklist.id
}

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
  if (selectedChecklist.value) {
    selectedChecklist.value.items.forEach(item => {
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
const handleCompleteExecution = async () => {
  if (!selectedChecklistId.value || !selectedChecklist.value) return

  try {
    const currentTime = getCurrentTimestamp()
    const startTime = executionStartTime.value || currentTime

    // 构建步骤摘要
    const stepSummariesList: ChecklistExecutionStepEntity[] = selectedChecklist.value.items.map(item => {
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
      checklistId: selectedChecklistId.value,
      mode: ExecutionMode.Overview,
      overallSummaryMd: overallSummary.value.trim() || undefined,
      stepSummaries: stepSummariesList,
      startTime: startTime,
      finishTime: currentTime,
      status: ChecklistExecutionStatus.Completed,
    })

    // 重置执行状态
    resetExecution()

    // 重新加载执行记录
    await loadExecutions(selectedChecklistId.value)

    ElNotification({
      message: '执行记录已保存',
      type: 'success',
      duration: 2000,
      position: 'bottom-right'
    })
  } catch (err) {
    console.error('完成执行失败:', err)
    ElNotification({
      message: err instanceof Error ? err.message : '完成执行失败',
      type: 'error',
      duration: 2000,
      position: 'bottom-right'
    })
  }
}

// 打开添加清单对话框
const handleOpenAddChecklistDialog = () => {
  editingChecklistId.value = null
  checklistForm.value = {
    title: '',
    items: [{ id: 0, contentMd: '' }],
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
  checklistForm.value.items.push({ id: 0, contentMd: '' })
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
    const newChecklist = await ChecklistRepo.create({
      title: checklistForm.value.title.trim(),
      items: checklistForm.value.items.map(item => ({
        id: item.id,
        contentMd: item.contentMd.trim(),
      })),
    })
    handleCloseEditChecklistDialog()
    await loadChecklists()
    if (newChecklist.id) {
      selectedChecklistId.value = newChecklist.id
      CacheManager.set(CACHE_KEYS.SELECTED_CHECKLIST_ID, newChecklist.id, true)
    }
  } catch (err) {
    checklistFormError.value = err instanceof Error ? err.message : '创建清单失败'
    console.error('创建清单失败:', err)
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
    await ChecklistRepo.update(editingChecklistId.value, {
      title: checklistForm.value.title.trim(),
      items: checklistForm.value.items.map(item => ({
        id: item.id,
        contentMd: item.contentMd.trim(),
      })),
    })
    handleCloseEditChecklistDialog()
    await loadChecklists()
  } catch (err) {
    checklistFormError.value = err instanceof Error ? err.message : '更新清单失败'
    console.error('更新清单失败:', err)
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
    
    await ChecklistRepo.delete(checklistId)
    
    if (selectedChecklistId.value === checklistId) {
      selectedChecklistId.value = null
    }
    
    await loadChecklists()
    closeContextMenu()
  } catch (err) {
    if (err === 'cancel') {
      closeContextMenu()
      return
    }
    console.error('删除清单失败:', err)
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
    await ChecklistRepo.update(checklistId, { top: currentTimestamp })
    await loadChecklists()
    closeContextMenu()
  } catch (err) {
    console.error('置顶清单失败:', err)
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
    await ChecklistRepo.update(checklistId, { top: 0 })
    await loadChecklists()
    closeContextMenu()
  } catch (err) {
    console.error('取消置顶失败:', err)
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
const handleDeleteExecution = async (execution: ChecklistExecutionRecordEntity) => {
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
    
    if (selectedChecklistId.value) {
      await loadExecutions(selectedChecklistId.value)
    }
  } catch (err) {
    if (err === 'cancel') {
      return
    }
    console.error('删除执行记录失败:', err)
    ElMessageBox.alert(
      err instanceof Error ? err.message : '删除执行记录失败',
      '错误',
      {
        confirmButtonText: '确定',
        type: 'error',
      }
    )
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

onMounted(() => {
  loadChecklists()
})
</script>

<template>
  <div class="p-checklist-list-wrap">
    <!-- 顶部：清单列表 -->
    <div class="p-checklist-list-header">
      <h2 class="p-page-title">检查清单</h2>
      <div class="p-header-actions">
        <el-button 
          type="primary" 
          size="small"
          @click="handleOpenAddChecklistDialog"
        >
          添加清单
        </el-button>
        <button 
          class="cu-button cu-button--text cu-button--small" 
          @click="handleRefresh" 
          :disabled="loading || executionsLoading"
        >
          {{ loading || executionsLoading ? '加载中' : '刷新' }}
        </button>
      </div>
    </div>

    <!-- 清单选择区域 -->
    <div v-if="loading && checklists.length === 0" class="p-loading">
      加载中...
    </div>

    <div v-else-if="error" class="p-error">
      <p>{{ error }}</p>
      <button 
        class="cu-button cu-button--primary cu-button--small" 
        @click="loadChecklists"
      >
        重试
      </button>
    </div>

    <div v-else-if="checklists.length === 0" class="p-empty">
      暂无清单
    </div>

    <div v-else class="p-checklists-selector-wrapper">
      <div class="p-checklists-selector">
        <div 
          v-for="checklist in checklists" 
          :key="checklist.id" 
          class="p-checklist-tag"
          :class="{ 'p-checklist-tag--active': selectedChecklistId === checklist.id }"
          @click="handleChecklistSelect(checklist)"
          @contextmenu.prevent="handleContextMenu($event, checklist)"
        >
          <span v-if="checklist.top > 0" class="p-checklist-tag-top-icon">🔝</span>
          <span class="p-checklist-tag-name">{{ checklist.title }}</span>
        </div>
      </div>
    </div>

    <!-- 执行区域 -->
    <div v-if="selectedChecklist" class="p-execution-section">
      <div class="p-execution-header">
        <h3 class="p-execution-title">{{ selectedChecklist.title }} - 执行</h3>
        <div class="p-execution-progress">
          <span class="p-progress-text">{{ completedCount }}/{{ totalSteps }}</span>
          <div class="p-progress-bar">
            <div class="p-progress-bar-fill" :style="{ width: `${progressPercent}%` }"></div>
          </div>
          <span class="p-progress-percent">{{ progressPercent }}%</span>
        </div>
      </div>

      <div class="p-execution-actions">
        <button 
          class="cu-button cu-button--text cu-button--small"
          @click="handleSelectAll"
        >
          全部完成
        </button>
        <button 
          class="cu-button cu-button--text cu-button--small"
          @click="handleUnselectAll"
        >
          全部清除
        </button>
        <button 
          class="cu-button cu-button--text cu-button--small"
          @click="resetExecution"
        >
          重置
        </button>
      </div>

      <div class="p-execution-items">
        <div
          v-for="(item, index) in selectedChecklist.items"
          :key="item.id"
          class="p-execution-item"
          :class="{ 'p-execution-item--completed': isStepCompleted(item.id) }"
        >
          <div class="p-execution-item-checkbox" @click="toggleStepCompletion(item.id)">
            <span v-if="isStepCompleted(item.id)" class="p-check-icon">✓</span>
          </div>
          <div class="p-execution-item-content">
            <div class="p-execution-item-number">{{ index + 1 }}.</div>
            <div class="p-execution-item-body">
              <MarkdownViewer :content="item.contentMd" class="p-execution-item-text" />
              
              <!-- 备注区域 -->
              <div v-if="isNotesVisible(item.id)" class="p-execution-item-notes">
                <MarkdownEditor
                  :model-value="getStepSummary(item.id)"
                  placeholder="添加备注..."
                  :height="80"
                  @update:model-value="(value: string) => saveStepSummary(item.id, value)"
                />
              </div>
              <button
                v-else
                class="p-execution-item-notes-btn"
                @click.stop="() => showItemNotes(item.id)"
              >
                备注
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 执行总结 -->
      <div class="p-execution-summary">
        <h4 class="p-execution-summary-title">执行总结</h4>
        <MarkdownEditor
          v-model="overallSummary"
          placeholder="整体总结、问题记录、改进建议..."
          :height="100"
        />
      </div>

      <!-- 完成执行按钮 -->
      <div class="p-execution-footer">
        <button 
          class="cu-button cu-button--primary"
          :disabled="!canComplete"
          @click="handleCompleteExecution"
        >
          完成执行
        </button>
      </div>
    </div>

    <div v-else class="p-execution-empty">
      请先选择一个清单
    </div>

    <!-- 执行记录列表 -->
    <div v-if="selectedChecklist" class="p-executions-section">
      <h3 class="p-executions-title">
        {{ selectedChecklist.title }} 的执行记录
      </h3>
      <div v-if="executionsLoading" class="p-executions-loading">加载中...</div>
      <div v-else-if="executionsError" class="p-executions-error">{{ executionsError }}</div>
      <div v-else-if="executions.length === 0" class="p-executions-empty">暂无执行记录</div>
      <ul v-else class="p-executions-list">
        <li v-for="execution in executions" :key="execution.id" class="cu-card cu-card--small p-execution-record-item">
          <div class="p-execution-record-header">
            <span class="p-execution-record-time">{{ timestampToChineseDateTime(execution.createTime) }}</span>
            <span class="p-execution-record-status" :class="{
              'p-execution-record-status--completed': execution.status === ChecklistExecutionStatus.Completed,
              'p-execution-record-status--in-progress': execution.status === ChecklistExecutionStatus.InProgress
            }">
              {{ execution.status === ChecklistExecutionStatus.Completed ? '已完成' : '进行中' }}
            </span>
          </div>
          <div class="p-execution-record-progress">
            完成进度: {{ getExecutionProgress(execution) }}
          </div>
          <div class="p-execution-record-actions">
            <button 
              class="p-execution-record-action-btn" 
              @click="handleViewExecutionDetail(execution)"
              title="查看详情"
            >
              查看详情
            </button>
            <button 
              class="p-execution-record-action-btn p-execution-record-action-btn--danger" 
              @click="handleDeleteExecution(execution)"
              title="删除"
            >
              删除
            </button>
          </div>
        </li>
      </ul>
    </div>

    <!-- 添加/编辑清单弹窗 -->
    <el-dialog
      v-model="showEditChecklistDialog"
      :title="isEditMode ? '编辑清单' : '添加清单'"
      width="700px"
      @close="handleCloseEditChecklistDialog"
    >
      <el-form :model="checklistForm" label-width="100px">
        <el-form-item label="清单标题" required>
          <el-input
            v-model="checklistForm.title"
            placeholder="请输入清单标题"
            :maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="检查项" required>
          <div class="p-checklist-items-list">
            <div
              v-for="(item, index) in checklistForm.items"
              :key="`${item.id || index}-${forceUpdate}`"
              class="p-checklist-item-editor"
            >
              <div class="p-checklist-item-header">
                <span class="p-checklist-item-number">{{ index + 1 }}.</span>
                <div class="p-checklist-item-actions">
                  <button
                    v-if="checklistForm.items.length > 1"
                    class="p-checklist-item-action-btn"
                    @click="handleMoveUp(index)"
                    :disabled="index === 0"
                    title="上移"
                  >
                    ↑
                  </button>
                  <button
                    v-if="checklistForm.items.length > 1"
                    class="p-checklist-item-action-btn"
                    @click="handleMoveDown(index)"
                    :disabled="index === checklistForm.items.length - 1"
                    title="下移"
                  >
                    ↓
                  </button>
                  <button
                    class="p-checklist-item-action-btn p-checklist-item-action-btn--danger"
                    @click="handleDeleteItem(index)"
                    title="删除"
                  >
                    删除
                  </button>
                </div>
              </div>
              <MarkdownEditor
                v-model="item.contentMd"
                :placeholder="`检查项 ${index + 1} 内容...`"
                :height="80"
              />
            </div>
          </div>
          <div class="p-checklist-add-item">
            <el-button 
              type="primary" 
              size="small"
              :disabled="checklistForm.items.length >= 50"
              @click="handleAddItem"
            >
              添加检查项
            </el-button>
            <span v-if="checklistForm.items.length >= 50" class="p-checklist-limit-tip">
              最多支持50个检查项
            </span>
          </div>
        </el-form-item>
        <el-form-item v-if="checklistFormError">
          <el-alert
            :title="checklistFormError"
            type="error"
            :closable="false"
            show-icon
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseEditChecklistDialog">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleSubmitChecklist"
            :loading="creatingChecklist"
            :disabled="!canSaveChecklist"
          >
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 执行记录详情弹窗 -->
    <el-dialog
      v-model="showExecutionDetailDialog"
      title="执行记录详情"
      width="700px"
      @close="handleCloseExecutionDetailDialog"
    >
      <div v-if="viewingExecution" class="p-execution-detail">
        <div class="p-execution-detail-info">
          <p><strong>执行时间：</strong>{{ timestampToChineseDateTime(viewingExecution.createTime) }}</p>
          <p><strong>完成状态：</strong>
            <span :class="{
              'p-status-completed': viewingExecution.status === ChecklistExecutionStatus.Completed,
              'p-status-in-progress': viewingExecution.status === ChecklistExecutionStatus.InProgress
            }">
              {{ viewingExecution.status === ChecklistExecutionStatus.Completed ? '已完成' : '进行中' }}
            </span>
          </p>
          <p><strong>完成进度：</strong>{{ getExecutionProgress(viewingExecution) }}</p>
        </div>
        
        <div v-if="viewingExecution.stepSummaries && viewingExecution.stepSummaries.length > 0" class="p-execution-detail-steps">
          <h4>步骤详情</h4>
          <div
            v-for="(step, index) in viewingExecution.stepSummaries"
            :key="step.itemId"
            class="p-execution-detail-step"
            :class="{ 'p-execution-detail-step--skipped': step.isSkipped }"
          >
            <div class="p-execution-detail-step-header">
              <span class="p-execution-detail-step-number">{{ index + 1 }}.</span>
              <span class="p-execution-detail-step-status">
                {{ step.isSkipped ? '未完成' : '已完成' }}
              </span>
            </div>
            <div v-if="step.summaryMd" class="p-execution-detail-step-summary">
              <MarkdownViewer :content="step.summaryMd" />
            </div>
          </div>
        </div>

        <div v-if="viewingExecution.overallSummaryMd" class="p-execution-detail-summary">
          <h4>执行总结</h4>
          <MarkdownViewer :content="viewingExecution.overallSummaryMd" />
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseExecutionDetailDialog">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenuVisible"
      class="p-context-menu"
      :style="{ left: `${contextMenuPosition.x}px`, top: `${contextMenuPosition.y}px` }"
      @click.stop
    >
      <div 
        v-if="contextMenuChecklist && contextMenuChecklist.top > 0"
        class="p-context-menu-item" 
        @click="handleUnpinChecklist"
      >
        <span>取消置顶</span>
      </div>
      <div 
        v-else
        class="p-context-menu-item" 
        @click="handlePinChecklist"
      >
        <span>置顶</span>
      </div>
      <div 
        v-if="contextMenuChecklist"
        class="p-context-menu-item" 
        @click="handleOpenEditChecklistDialogFromMenu"
      >
        <span>编辑</span>
      </div>
      <div class="p-context-menu-item p-context-menu-item--danger" @click="handleDeleteChecklist">
        <span>删除</span>
      </div>
    </div>
  </div>
</template>

