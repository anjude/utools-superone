<script lang="ts" setup>
import { onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MarkdownViewer } from '@/components'
import { useChecklistStore } from '@/stores/checklist'
import { useExecutionHistory } from '@/composables/useExecutionHistory'
import type { ChecklistExecutionStepEntity } from '@/types/checklist'
import { ChecklistExecutionStatus } from '@/types/checklist'
import { timestampToChineseDateTime } from '@/utils/time'

const route = useRoute()
const router = useRouter()
const checklistStore = useChecklistStore()
const executionHistory = useExecutionHistory()

// 从路由参数获取清单ID
const checklistId = computed(() => {
  const id = route.params.id
  if (typeof id === 'string') {
    const numId = parseInt(id, 10)
    return isNaN(numId) ? null : numId
  }
  return null
})

// 当前清单
const checklist = computed(() => {
  if (!checklistId.value) return null
  return checklistStore.checklists.find(c => c.id === checklistId.value) || null
})

// 加载清单详情（如果不在列表中）
const loadChecklistDetail = async () => {
  if (!checklistId.value) return
  if (!checklist.value) {
    // 如果不在列表中，单独加载
    await checklistStore.getChecklistById(checklistId.value)
  }
}

// 获取执行步骤对应的检查项内容
const getStepItemContent = (step: ChecklistExecutionStepEntity): string => {
  if (!checklist.value) return ''
  const item = checklist.value.items.find(item => item.id === step.itemId)
  return item?.contentMd || ''
}

// 监听清单ID变化，加载执行记录
watch(checklistId, (newId) => {
  if (newId) {
    executionHistory.loadExecutions(newId)
  }
}, { immediate: true })

// 监听清单变化，重新加载执行记录
watch(() => checklist.value, (newChecklist) => {
  if (newChecklist && checklistId.value) {
    executionHistory.loadExecutions(checklistId.value)
  }
})

onMounted(async () => {
  // 加载清单列表（如果还没有加载）
  if (checklistStore.checklists.length === 0) {
    await checklistStore.loadChecklists()
  }
  // 加载清单详情
  await loadChecklistDetail()
  // 加载执行记录
  if (checklistId.value) {
    await executionHistory.loadExecutions(checklistId.value)
  }
})
</script>

<template>
  <div class="p-checklist-detail-wrap">
    <!-- 顶部：返回按钮和标题 -->
    <div class="p-checklist-detail-header">
      <button 
        class="cu-button cu-button--text cu-button--small" 
        @click="router.push({ name: 'ChecklistList' })"
      >
        ← 返回
      </button>
      <h2 class="p-page-title">{{ checklist?.title || '清单详情' }}</h2>
    </div>

    <!-- 清单不存在 -->
    <div v-if="!checklistId" class="p-error">
      <p>无效的清单ID</p>
      <button 
        class="cu-button cu-button--primary cu-button--small" 
        @click="router.push({ name: 'ChecklistList' })"
      >
        返回列表
      </button>
    </div>

    <!-- 加载中 -->
    <div v-else-if="checklistStore.loading" class="p-loading">
      加载中...
    </div>

    <!-- 清单不存在 -->
    <div v-else-if="!checklist" class="p-error">
      <p>清单不存在</p>
      <button 
        class="cu-button cu-button--primary cu-button--small" 
        @click="router.push({ name: 'ChecklistList' })"
      >
        返回列表
      </button>
    </div>

    <!-- 清单详情和执行历史 -->
    <div v-else class="p-checklist-detail-content">
      <!-- 清单信息 -->
      <div class="p-checklist-info">
        <h3 class="p-checklist-info-title">清单信息</h3>
        <div class="p-checklist-items">
          <div
            v-for="(item, index) in checklist.items"
            :key="item.id"
            class="p-checklist-item"
          >
            <div class="p-checklist-item-number">{{ index + 1 }}.</div>
            <div class="p-checklist-item-content">
              <MarkdownViewer :content="item.contentMd" />
            </div>
          </div>
        </div>
      </div>

      <!-- 执行记录列表 -->
      <div class="p-executions-section">
        <h3 class="p-executions-title">
          {{ checklist.title }} 的执行记录
        </h3>
        <div v-if="executionHistory.executionsLoading.value" class="p-executions-loading">加载中...</div>
        <div v-else-if="executionHistory.executionsError.value" class="p-executions-error">{{ executionHistory.executionsError.value }}</div>
        <div v-else-if="executionHistory.executions.value.length === 0" class="p-executions-empty">暂无执行记录</div>
        <ul v-else class="p-executions-list">
          <li v-for="execution in executionHistory.executions.value" :key="execution.id" class="cu-card cu-card--small p-execution-record-item">
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
              完成进度: {{ executionHistory.getExecutionProgress(execution) }}
            </div>
            <div class="p-execution-record-actions">
              <button 
                class="p-execution-record-action-btn" 
                @click="executionHistory.handleViewExecutionDetail(execution)"
                title="查看详情"
              >
                查看详情
              </button>
              <button 
                class="p-execution-record-action-btn p-execution-record-action-btn--danger" 
                @click="executionHistory.handleDeleteExecution(execution).then(() => executionHistory.loadExecutions(checklistId!))"
                title="删除"
              >
                删除
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- 执行记录详情弹窗 -->
    <el-dialog
      v-model="executionHistory.showExecutionDetailDialog.value"
      title="执行记录详情"
      width="700px"
      @close="executionHistory.handleCloseExecutionDetailDialog"
    >
      <div v-if="executionHistory.viewingExecution.value && checklist" class="p-execution-detail">
        <div class="p-execution-detail-info">
          <p><strong>执行时间：</strong>{{ timestampToChineseDateTime(executionHistory.viewingExecution.value.createTime) }}</p>
          <p><strong>完成状态：</strong>
            <span :class="{
              'p-status-completed': executionHistory.viewingExecution.value.status === ChecklistExecutionStatus.Completed,
              'p-status-in-progress': executionHistory.viewingExecution.value.status === ChecklistExecutionStatus.InProgress
            }">
              {{ executionHistory.viewingExecution.value.status === ChecklistExecutionStatus.Completed ? '已完成' : '进行中' }}
            </span>
          </p>
          <p><strong>完成进度：</strong>{{ executionHistory.getExecutionProgress(executionHistory.viewingExecution.value) }}</p>
        </div>
        
        <div v-if="executionHistory.viewingExecution.value.stepSummaries && executionHistory.viewingExecution.value.stepSummaries.length > 0" class="p-execution-detail-steps">
          <h4>步骤详情</h4>
          <div
            v-for="(step, index) in executionHistory.viewingExecution.value.stepSummaries"
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
            <!-- 显示检查项内容 -->
            <div class="p-execution-detail-step-content">
              <MarkdownViewer :content="getStepItemContent(step)" />
            </div>
            <!-- 显示备注（如果有） -->
            <div v-if="step.summaryMd" class="p-execution-detail-step-summary">
              <strong>备注：</strong>
              <MarkdownViewer :content="step.summaryMd" />
            </div>
          </div>
        </div>

        <div v-if="executionHistory.viewingExecution.value.overallSummaryMd" class="p-execution-detail-summary">
          <h4>执行总结</h4>
          <MarkdownViewer :content="executionHistory.viewingExecution.value.overallSummaryMd" />
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="executionHistory.handleCloseExecutionDetailDialog">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/07-pages/checklist-list' as *;

.p-checklist-detail-wrap {
  padding: var(--spacing-lg);
  max-width: 1200px;
  margin: 0 auto;
}

.p-checklist-detail-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.p-checklist-detail-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.p-checklist-info {
  .p-checklist-info-title {
    margin: 0 0 var(--spacing-md);
    font-size: 16px;
    font-weight: 600;
    color: var(--text-color);
  }
}

.p-checklist-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.p-checklist-item {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-color);
}

.p-checklist-item-number {
  flex-shrink: 0;
  font-weight: 600;
  color: var(--text-color);
  opacity: 0.7;
}

.p-checklist-item-content {
  flex: 1;
  min-width: 0;
}

.p-execution-detail-step-content {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: rgba(0, 0, 0, 0.02);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-color);
}
</style>

