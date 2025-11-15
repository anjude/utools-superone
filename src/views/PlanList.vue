<script lang="ts" setup>
import { onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { MarkdownEditor, MarkdownViewer } from '@/components'
import { usePlanStore } from '@/stores/plan'
import { usePlanManagement } from '@/composables/usePlanManagement'
import { timestampToChineseDateTime, formatDeadline, isTaskOverdue } from '@/utils/time'
import { TaskEnums } from '@/types/plan'

const { t } = useI18n()

// 初始化 store 和 composable
const planStore = usePlanStore()
const {
  // 编辑任务弹窗状态
  showAddPlanDialog,
  isEditMode,
  planForm,
  creatingTask,
  planFormError,
  // 状态筛选相关
  statusList,
  selectedStatusList,
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
  handleOpenEditPlanDialog,
  handleCloseAddPlanDialog,
  handleSubmitPlan,
  // 状态筛选方法
  handleToggleStatus,
  // 状态流转方法
  handleOpenStatusMenu,
  handleChangeTaskStatus,
  // 右键菜单方法
  handleContextMenu,
  handleDeleteTask,
  handlePinTask,
  handleUnpinTask,
  // 刷新
  handleRefresh,
  // 工具方法
  getStatusLabel,
  getPriorityLabel,
} = usePlanManagement(planStore)

// 从 store 获取状态
const tasks = computed(() => planStore.filteredTasks)
const loading = computed(() => planStore.loading)
const error = computed(() => planStore.error)

// 获取状态标签的样式类
const getStatusClass = (status: TaskEnums.Status): string => {
  const statusClassMap = {
    [TaskEnums.Status.Pending]: 'cu-tag--warning',
    [TaskEnums.Status.InProgress]: 'cu-tag--info',
    [TaskEnums.Status.Completed]: 'cu-tag--success',
    [TaskEnums.Status.Cancelled]: 'cu-tag--default',
  }
  return statusClassMap[status] || 'cu-tag--default'
}

// 获取优先级标签的样式类
const getPriorityClass = (priority: TaskEnums.Priority): string => {
  const priorityClassMap = {
    [TaskEnums.Priority.Low]: 'cu-tag--default',
    [TaskEnums.Priority.Medium]: 'cu-tag--info',
    [TaskEnums.Priority.High]: 'cu-tag--danger',
  }
  return priorityClassMap[priority] || 'cu-tag--default'
}

onMounted(() => {
  planStore.loadTasks()
})
</script>

<template>
  <div class="p-plan-list-wrap">
    <!-- 顶部：标题和操作按钮 -->
    <div class="p-plan-list-header">
      <h2 class="p-page-title">近期任务</h2>
      <div class="p-header-actions">
        <el-button 
          type="primary" 
          size="small"
          @click="handleOpenAddPlanDialog"
        >
          添加任务
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

    <!-- 状态筛选区域 -->
    <div v-if="loading && tasks.length === 0" class="p-loading">
      加载中...
    </div>

    <div v-else-if="error" class="p-error">
      <p>{{ error }}</p>
      <button 
        class="cu-button cu-button--primary cu-button--small" 
        @click="() => planStore.loadTasks()"
      >
        重试
      </button>
    </div>

    <div v-else class="p-status-filter">
      <div 
        v-for="status in statusList"
        :key="status.value"
        class="p-status-tag"
        :class="{ 'p-status-tag--active': selectedStatusList.includes(status.value) }"
        @click="handleToggleStatus(status.value)"
      >
        {{ status.label }}
      </div>
    </div>

    <!-- 任务列表 -->
    <div class="p-tasks-section">
      <div v-if="tasks.length === 0" class="p-tasks-empty">
        {{ selectedStatusList.length > 0 ? '没有符合条件的任务' : '暂无任务' }}
      </div>
      <ul v-else class="p-tasks-list">
        <li 
          v-for="task in tasks" 
          :key="task.id" 
          class="cu-card cu-card--small p-task-item"
          @contextmenu.prevent="handleContextMenu($event, task)"
        >
          <div class="p-task-header">
            <h3 class="p-task-title">
              <span v-if="task.top > 0" class="p-task-top-icon">🔝</span>
              {{ task.title }}
            </h3>
            <div class="p-task-meta">
              <span 
                class="cu-tag cu-tag--small"
                :class="getPriorityClass(task.priority)"
              >
                {{ getPriorityLabel(task.priority) }}优先级
              </span>
              <span 
                class="cu-tag cu-tag--small cu-tag--status"
                :class="getStatusClass(task.status)"
                @click.stop="handleOpenStatusMenu($event, task)"
              >
                {{ getStatusLabel(task.status) }}
              </span>
            </div>
          </div>
          
          <div v-if="task.description" class="p-task-description">
            <MarkdownViewer :content="task.description" />
          </div>

          <div class="p-task-footer">
            <div class="p-task-info">
              <span v-if="task.deadline" class="p-task-deadline" :class="{ 'p-task-deadline--overdue': isTaskOverdue(task.deadline, task.completed) }">
                📅 {{ formatDeadline(task.deadline) }}
              </span>
              <span class="p-task-time">{{ timestampToChineseDateTime(task.createTime) }}</span>
            </div>
            <div class="p-task-actions">
              <button 
                class="p-task-action-btn" 
                @click="handleOpenEditPlanDialog(task)"
                title="编辑"
              >
                编辑
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- 添加/编辑任务弹窗 -->
    <el-dialog
      v-model="showAddPlanDialog"
      :title="isEditMode ? '编辑任务' : '添加任务'"
      width="600px"
      @close="handleCloseAddPlanDialog"
    >
      <el-form :model="planForm" label-width="80px">
        <el-form-item label="任务标题" required>
          <el-input
            v-model="planForm.title"
            placeholder="请输入任务标题"
            :maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="优先级" required>
          <el-radio-group v-model="planForm.priority">
            <el-radio :label="TaskEnums.Priority.Low">低</el-radio>
            <el-radio :label="TaskEnums.Priority.Medium">中</el-radio>
            <el-radio :label="TaskEnums.Priority.High">高</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker
            v-model="planForm.deadline"
            type="date"
            placeholder="选择截止日期"
            format="YYYY-MM-DD"
            value-format="X"
            :disabled-date="(date: Date) => {
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              return date.getTime() < today.getTime() - 86400000
            }"
          />
        </el-form-item>
        <el-form-item label="任务描述">
          <MarkdownEditor
            v-model="planForm.description"
            placeholder="请输入任务描述（可选，支持 Markdown 格式）"
            :height="150"
          />
        </el-form-item>
        <el-form-item v-if="planFormError">
          <el-alert
            :title="planFormError"
            type="error"
            :closable="false"
            show-icon
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseAddPlanDialog">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleSubmitPlan"
            :loading="creatingTask"
          >
            确定
          </el-button>
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
        v-if="contextMenuTask && contextMenuTask.top > 0"
        class="p-context-menu-item" 
        @click="handleUnpinTask"
      >
        <span>取消置顶</span>
      </div>
      <div 
        v-else
        class="p-context-menu-item" 
        @click="handlePinTask"
      >
        <span>置顶</span>
      </div>
      <div 
        v-if="contextMenuTask"
        class="p-context-menu-item" 
        @click="handleOpenEditPlanDialog(contextMenuTask)"
      >
        <span>编辑</span>
      </div>
      <div class="p-context-menu-item p-context-menu-item--danger" @click="handleDeleteTask">
        <span>删除</span>
      </div>
    </div>

    <!-- 状态选择菜单 -->
    <div
      v-if="statusMenuVisible"
      class="p-status-menu"
      :style="{ left: `${statusMenuPosition.x}px`, top: `${statusMenuPosition.y}px` }"
      @click.stop
    >
      <div 
        v-for="status in statusList"
        :key="status.value"
        class="p-status-menu-item"
        :class="{ 'p-status-menu-item--active': statusMenuTask?.status === status.value }"
        @click="handleChangeTaskStatus(status.value)"
      >
        <span>{{ status.label }}</span>
        <span v-if="statusMenuTask?.status === status.value" class="p-status-menu-item-check">✓</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/07-pages/plan-list';
</style>

