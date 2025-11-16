<script lang="ts" setup>
import { onMounted, watch, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { ElDialog } from 'element-plus'
import { CuModuleNav, MarkdownEditor, MarkdownViewer } from '@/components'
import { useChecklistStore } from '@/stores/checklist'
import { useChecklistExecution } from '@/composables/useChecklistExecution'
import { useChecklistManagement } from '@/composables/useChecklistManagement'
import type { ChecklistExecutionStepEntity } from '@/types/checklist'
import { timestampToChineseDateTime } from '@/utils/time'

const router = useRouter()
const checklistStore = useChecklistStore()
const management = useChecklistManagement(checklistStore)

// 使用 store 的状态（需要使用 storeToRefs 保持响应性）
const { checklists, loading, error, selectedChecklistId, selectedChecklist } = storeToRefs(checklistStore)

// 使用 execution composable
const execution = useChecklistExecution(() => selectedChecklist.value || null)

// 监听选中清单变化，恢复执行进度
watch(selectedChecklistId, (newId, oldId) => {
  if (oldId && oldId !== newId) {
    // 保存旧checklist的进度
    execution.saveProgress(oldId)
  }
  if (newId) {
    // 恢复新checklist的进度
    execution.restoreProgress(newId)
  }
})

// 刷新功能
const handleRefresh = async () => {
  await checklistStore.loadChecklists()
  if (selectedChecklistId.value) {
    execution.restoreProgress(selectedChecklistId.value)
  }
}

// 选择清单
const handleChecklistSelect = (checklistId: number) => {
  checklistStore.setSelectedChecklistId(checklistId)
}

// 执行完成弹窗相关状态
const showExecutionResultDialog = ref(false)
const executionResult = ref<{
  checklistTitle: string
  stepSummaries: ChecklistExecutionStepEntity[]
  overallSummaryMd?: string
  completedCount: number
  totalCount: number
  createTime: number
} | null>(null)

// 获取执行步骤对应的检查项内容
const getStepItemContent = (step: ChecklistExecutionStepEntity): string => {
  if (!selectedChecklist.value) return ''
  const item = selectedChecklist.value.items.find(item => item.id === step.itemId)
  return item?.contentMd || ''
}

// 完成执行
const handleCompleteExecution = async () => {
  if (!selectedChecklistId.value) return
  try {
    const result = await execution.completeExecution(selectedChecklistId.value)
    if (result) {
      executionResult.value = result
      showExecutionResultDialog.value = true
    }
  } catch (err) {
    // 错误已在 completeExecution 中处理
  }
}

// 跳转到详情页
const handleViewDetail = (checklistId: number) => {
  router.push({ name: 'ChecklistDetail', params: { id: checklistId } })
}

// 根据百分比计算进度条颜色（使用主题色）
const progressBarStyle = computed(() => {
  const percent = execution.progressPercent.value
  // 使用主题色，100%时使用深色变体作为完成提示
  const color = percent >= 100 ? 'var(--primary-color-active)' : 'var(--primary-color)'
  
  return {
    width: `${percent}%`,
    backgroundColor: color
  }
})

onMounted(async () => {
  await checklistStore.loadChecklists()
  // 如果已有选中的checklist，恢复其进度
  if (selectedChecklistId.value) {
    execution.restoreProgress(selectedChecklistId.value)
  }
})
</script>

<template>
  <div class="p-checklist-list-wrap">
    <!-- 顶部：清单列表 -->
    <div class="p-checklist-list-header">
      <div class="p-header-left">
        <CuModuleNav>
          <h2 class="p-page-title">检查清单</h2>
        </CuModuleNav>
      </div>
      <div class="p-header-actions">
        <el-button 
          type="primary" 
          size="small"
          @click="management.handleOpenAddChecklistDialog"
        >
          添加清单
        </el-button>
        <button 
          class="cu-button cu-button--text cu-button--small" 
          @click="handleRefresh" 
          :disabled="loading"
        >
          {{ loading ? '加载中' : '刷新' }}
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
        @click="checklistStore.loadChecklists"
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
          @click="handleChecklistSelect(checklist.id)"
          @contextmenu.prevent="management.handleContextMenu($event, checklist)"
        >
          <span v-if="checklist.top > 0" class="p-checklist-tag-top-icon">🔝</span>
          <span class="p-checklist-tag-name">{{ checklist.title }}</span>
        </div>
      </div>
    </div>

    <!-- 执行区域 -->
    <div v-if="selectedChecklist" class="p-execution-section">
      <div class="p-execution-header">
        <div class="p-execution-header-top">
          <h3 class="p-execution-title">{{ selectedChecklist.title }} - 执行</h3>
          <div class="p-execution-header-actions">
            <button 
              class="cu-button cu-button--text cu-button--small"
              @click="management.handleOpenEditChecklistDialog(selectedChecklist)"
            >
              编辑
            </button>
            <button 
              class="cu-button cu-button--text cu-button--small"
              @click="handleViewDetail(selectedChecklist.id)"
            >
              查看详情 →
            </button>
          </div>
        </div>
        <div class="cu-progress-info">
          <div class="cu-progress-label">
            <span class="cu-progress-label-text">执行进度</span>
            <span class="cu-progress-count">{{ execution.completedCount }}/{{ execution.totalSteps }}</span>
          </div>
          <span class="cu-progress-percent">{{ execution.progressPercent }}%</span>
        </div>
        <div class="cu-progress-modern">
          <div class="cu-progress__bar" :style="progressBarStyle"></div>
        </div>
      </div>

      <div class="p-execution-actions">
        <button 
          class="cu-button cu-button--text cu-button--small"
          @click="execution.handleSelectAll"
        >
          全部完成
        </button>
        <button 
          class="cu-button cu-button--text cu-button--small"
          @click="execution.resetExecution"
        >
          重置
        </button>
      </div>

      <div class="p-execution-items">
        <div
          v-for="(item, index) in selectedChecklist.items"
          :key="item.id"
          class="p-execution-item"
          :class="{ 'p-execution-item--completed': execution.isStepCompleted(item.id) }"
        >
          <div 
            class="cu-checkbox cu-checkbox--absolute"
            :class="{ 'cu-checkbox--checked': execution.isStepCompleted(item.id) }"
            @click="execution.toggleStepCompletion(item.id)"
          >
            <span class="cu-checkbox__icon">✓</span>
          </div>
          <div class="p-execution-item-content">
            <div class="p-execution-item-number">{{ index + 1 }}.</div>
            <div class="p-execution-item-body">
              <MarkdownViewer :content="item.contentMd" class="p-execution-item-text" />
              
              <!-- 备注区域 -->
              <div v-if="execution.isNotesVisible(item.id)" class="p-execution-item-notes">
                <MarkdownEditor
                  :model-value="execution.getStepSummary(item.id)"
                  placeholder="添加备注..."
                  :height="80"
                  :autofocus="false"
                  @update:model-value="(value: string) => execution.saveStepSummary(item.id, value)"
                />
              </div>
              <button
                v-else
                class="p-execution-item-notes-btn"
                @click.stop="() => execution.showItemNotes(item.id)"
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
          :model-value="execution.overallSummary.value"
          placeholder="整体总结、问题记录、改进建议..."
          :height="100"
          :autofocus="false"
          @update:model-value="(value: string) => execution.overallSummary.value = value"
        />
      </div>

      <!-- 完成执行按钮 -->
      <div class="p-execution-footer">
        <button 
          class="cu-button cu-button--primary"
          :disabled="!execution.canComplete"
          @click="handleCompleteExecution"
        >
          完成执行
        </button>
      </div>
    </div>

    <div v-else class="p-execution-empty">
      请先选择一个清单
    </div>

    <!-- 添加/编辑清单弹窗 -->
    <el-dialog
      v-model="management.showEditChecklistDialog.value"
      :title="management.isEditMode.value ? '编辑清单' : '添加清单'"
      width="700px"
      @close="management.handleCloseEditChecklistDialog"
    >
      <el-form :model="management.checklistForm.value" label-width="100px">
        <el-form-item label="清单标题" required>
          <el-input
            v-model="management.checklistForm.value.title"
            placeholder="请输入清单标题"
            :maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="检查项" required>
          <div class="p-checklist-items-list">
            <div
              v-for="(item, index) in management.checklistForm.value.items"
              :key="`${item.id || index}-${management.forceUpdate.value}`"
              class="p-checklist-item-editor"
            >
              <div class="p-checklist-item-header">
                <span class="p-checklist-item-number">{{ index + 1 }}.</span>
                <div class="p-checklist-item-actions">
                  <button
                    v-if="management.checklistForm.value.items.length > 1"
                    class="p-checklist-item-action-btn"
                    @click="management.handleMoveUp(index)"
                    :disabled="index === 0"
                    title="上移"
                  >
                    ↑
                  </button>
                  <button
                    v-if="management.checklistForm.value.items.length > 1"
                    class="p-checklist-item-action-btn"
                    @click="management.handleMoveDown(index)"
                    :disabled="index === management.checklistForm.value.items.length - 1"
                    title="下移"
                  >
                    ↓
                  </button>
                  <button
                    class="p-checklist-item-action-btn p-checklist-item-action-btn--danger"
                    @click="management.handleDeleteItem(index)"
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
                :autofocus="false"
              />
            </div>
          </div>
          <div class="p-checklist-add-item">
            <el-button 
              type="primary" 
              size="small"
              :disabled="management.checklistForm.value.items.length >= 50"
              @click="management.handleAddItem"
            >
              添加检查项
            </el-button>
            <span v-if="management.checklistForm.value.items.length >= 50" class="p-checklist-limit-tip">
              最多支持50个检查项
            </span>
          </div>
        </el-form-item>
        <el-form-item v-if="management.checklistFormError.value">
          <el-alert
            :title="management.checklistFormError.value"
            type="error"
            :closable="false"
            show-icon
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="management.handleCloseEditChecklistDialog">取消</el-button>
          <el-button 
            type="primary" 
            @click="management.handleSubmitChecklist"
            :loading="management.creatingChecklist.value"
            :disabled="!management.canSaveChecklist.value"
          >
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 右键菜单 -->
    <div
      v-if="management.contextMenuVisible.value"
      class="p-context-menu"
      :style="{ left: `${management.contextMenuPosition.value.x}px`, top: `${management.contextMenuPosition.value.y}px` }"
      @click.stop
    >
      <div 
        v-if="management.contextMenuChecklist.value && management.contextMenuChecklist.value.top > 0"
        class="p-context-menu-item" 
        @click="management.handleUnpinChecklist"
      >
        <span>取消置顶</span>
      </div>
      <div 
        v-else
        class="p-context-menu-item" 
        @click="management.handlePinChecklist"
      >
        <span>置顶</span>
      </div>
      <div 
        v-if="management.contextMenuChecklist.value"
        class="p-context-menu-item" 
        @click="management.handleOpenEditChecklistDialogFromMenu"
      >
        <span>编辑</span>
      </div>
      <div class="p-context-menu-item p-context-menu-item--danger" @click="management.handleDeleteChecklist">
        <span>删除</span>
      </div>
    </div>

    <!-- 执行结果弹窗 -->
    <el-dialog
      v-model="showExecutionResultDialog"
      title="执行完成"
      width="700px"
      :close-on-click-modal="false"
    >
      <div v-if="executionResult" class="p-execution-result">
        <div class="p-execution-result-header">
          <h3 class="p-execution-result-title">{{ executionResult.checklistTitle }}</h3>
          <p class="p-execution-result-time">{{ timestampToChineseDateTime(executionResult.createTime) }}</p>
          <div class="p-execution-result-progress">
            <span class="p-progress-label">完成进度：</span>
            <span class="p-progress-value">{{ executionResult.completedCount }}/{{ executionResult.totalCount }}</span>
            <div class="p-progress-bar-small">
              <div 
                class="p-progress-bar-fill-small" 
                :style="{ width: `${Math.round((executionResult.completedCount / executionResult.totalCount) * 100)}%` }"
              ></div>
            </div>
          </div>
        </div>

        <div v-if="executionResult.stepSummaries && executionResult.stepSummaries.length > 0" class="p-execution-result-steps">
          <h4 class="p-execution-result-section-title">步骤详情</h4>
          <div
            v-for="(step, index) in executionResult.stepSummaries"
            :key="step.itemId"
            class="p-execution-result-step"
            :class="{ 'p-execution-result-step--skipped': step.isSkipped }"
          >
            <div class="p-execution-result-step-header">
              <span class="p-execution-result-step-number">{{ index + 1 }}.</span>
              <span class="p-execution-result-step-status">
                {{ step.isSkipped ? '未完成' : '已完成' }}
              </span>
            </div>
            <div class="p-execution-result-step-content">
              <MarkdownViewer :content="getStepItemContent(step)" />
            </div>
            <div v-if="step.summaryMd" class="p-execution-result-step-summary">
              <strong>备注：</strong>
              <MarkdownViewer :content="step.summaryMd" />
            </div>
          </div>
        </div>

        <div v-if="executionResult.overallSummaryMd" class="p-execution-result-summary">
          <h4 class="p-execution-result-section-title">执行总结</h4>
          <MarkdownViewer :content="executionResult.overallSummaryMd" />
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="showExecutionResultDialog = false">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

