<script lang="ts" setup>
import { onMounted, onUnmounted, computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { CuModuleNav, MarkdownEditor } from '@/components'
import { usePlanStore } from '@/stores/plan'
import { usePlanManagement } from '@/composables/usePlanManagement'
import { timestampToChineseDateTime, formatDeadline, isTaskOverdue } from '@/utils/time'
import { TaskEnums } from '@/types/plan'
import { ElNotification, ElIcon } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import { logger } from '@/utils/logger'
import type { RecentTask } from '@/types/plan'

const { t } = useI18n()
const router = useRouter()

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
  // 任务选择相关
  selectedTaskId,
  selectedTask,
  handleTaskSelect,
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
  // 右键菜单新增方法
  handleNavigateToDetail,
  handleSaveSnapshot,
  // 刷新
  handleRefresh,
  // 工具方法
  getStatusLabel,
  getPriorityLabel,
  // 恢复选中任务
  restoreSelectedTask,
} = usePlanManagement(planStore)

// 从 store 获取状态
const tasks = computed(() => planStore.filteredTasks)
const loading = computed(() => planStore.loading)
const error = computed(() => planStore.error)

// 任务详情编辑状态管理
const taskDescriptions = ref<Record<number, string>>({})
const savingDescriptions = ref<Record<number, boolean>>({})
const saveTimers = ref<Record<number, ReturnType<typeof setTimeout>>>({})

// 初始化任务描述并同步更新
watch(tasks, (newTasks) => {
  newTasks.forEach((task) => {
    // 如果任务描述在 store 中已更新，同步到本地状态
    // 只有当本地状态为空或与 store 不一致时才更新（避免覆盖正在编辑的内容）
    const currentDescription = taskDescriptions.value[task.id]
    const storeDescription = task.description || ''
    
    if (!currentDescription || currentDescription === '') {
      // 如果本地没有描述，使用 store 中的描述
      taskDescriptions.value[task.id] = storeDescription
    } else if (currentDescription !== storeDescription && !savingDescriptions.value[task.id]) {
      // 如果本地描述与 store 不一致，且不在保存中，说明 store 已更新，同步本地
      taskDescriptions.value[task.id] = storeDescription
    }
  })
  
  // 如果选中的任务不在列表中，或者当前没有选中任务，恢复选中任务（会尝试恢复上次选择或选择第一个）
  if (selectedTaskId.value === null || !newTasks.find(t => t.id === selectedTaskId.value)) {
    restoreSelectedTask()
  }
}, { immediate: true })

// 防抖保存任务描述
const saveTaskDescription = async (taskId: number) => {
  // 清除之前的定时器
  if (saveTimers.value[taskId]) {
    clearTimeout(saveTimers.value[taskId])
  }

  // 设置新的定时器，1秒后保存
  saveTimers.value[taskId] = setTimeout(async () => {
    const newDescription = taskDescriptions.value[taskId] || ''
    const task = tasks.value.find(t => t.id === taskId)
    
    // 如果内容没有变化，不保存
    if (task && task.description === newDescription) {
      savingDescriptions.value[taskId] = false
      return
    }

    savingDescriptions.value[taskId] = true
    try {
      await planStore.updateTask(taskId, { description: newDescription })
      logger.info('任务描述保存成功', { id: taskId })
    } catch (err) {
      logger.error('保存任务描述失败', { error: err, id: taskId })
      ElNotification({
        message: err instanceof Error ? err.message : '保存任务描述失败',
        type: 'error',
        duration: 2000,
        position: 'bottom-right',
      })
      // 恢复原值
      if (task) {
        taskDescriptions.value[taskId] = task.description || ''
      }
    } finally {
      savingDescriptions.value[taskId] = false
    }
  }, 1000)
}

// 处理任务描述变化
const handleDescriptionChange = (taskId: number, value: string) => {
  taskDescriptions.value[taskId] = value
  saveTaskDescription(taskId)
}

// 直接切换任务状态（用于底部按钮）
const handleDirectChangeStatus = async (task: RecentTask, newStatus: TaskEnums.Status) => {
  if (task.status === newStatus) return
  
  try {
    await planStore.updateTaskStatus(task.id, newStatus)
    ElNotification({
      message: '状态更新成功',
      type: 'success',
      duration: 1000,
      position: 'bottom-right',
    })
    logger.info('任务状态更新成功', { id: task.id, status: newStatus })
  } catch (err) {
    logger.error('更新任务状态失败', { error: err, id: task.id, status: newStatus })
    ElNotification({
      message: err instanceof Error ? err.message : '更新状态失败',
      type: 'error',
      duration: 2000,
      position: 'bottom-right',
    })
  }
}

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

// 获取状态按钮的类名
const getStatusButtonClass = (status: TaskEnums.Status): string => {
  const statusClassMap = {
    [TaskEnums.Status.Pending]: 'pending',
    [TaskEnums.Status.InProgress]: 'in-progress',
    [TaskEnums.Status.Completed]: 'completed',
    [TaskEnums.Status.Cancelled]: 'cancelled',
  }
  return statusClassMap[status] || 'pending'
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

onMounted(async () => {
  await planStore.loadTasks()
  // 任务加载完成后，恢复上次选择的任务或选择第一个任务
  restoreSelectedTask()
})

// 组件卸载时清理所有定时器
onUnmounted(() => {
  Object.values(saveTimers.value).forEach((timer) => {
    if (timer) {
      clearTimeout(timer)
    }
  })
  saveTimers.value = {}
})
</script>

<template>
  <div class="p-plan-list-wrap">
    <!-- 顶部：标题和操作按钮 -->
    <div class="p-plan-list-header">
      <div class="p-header-left">
        <CuModuleNav>
          <h2 class="p-page-title">近期任务</h2>
        </CuModuleNav>
      </div>
      <div v-if="!loading && !error" class="p-header-center">
        <div class="p-status-filter">
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
      </div>
      <div class="p-header-right">
        <div class="p-header-buttons">
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
    </div>

    <!-- 加载、错误状态 -->
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

    <!-- 左右布局 -->
    <div class="p-tasks-layout">
      <!-- 左侧：任务标题列表 -->
      <div class="p-tasks-list-section">
        <div v-if="tasks.length === 0" class="p-tasks-empty">
          {{ selectedStatusList.length > 0 ? '没有符合条件的任务' : '暂无任务' }}
        </div>
        <ul v-else class="p-tasks-list">
          <li 
            v-for="task in tasks" 
            :key="task.id" 
            class="p-task-list-item"
            :class="{ 'p-task-list-item--active': selectedTaskId === task.id }"
            @click="handleTaskSelect(task)"
            @contextmenu.prevent="handleContextMenu($event, task)"
          >
            <h3 class="p-task-list-item-title">
              <span v-if="task.top > 0" class="p-task-list-item-top-icon">🔝</span>
              {{ task.title }}
            </h3>
          </li>
        </ul>
      </div>

      <!-- 右侧：任务详情 -->
      <div class="p-task-detail-section">
        <div v-if="!selectedTask" class="p-task-detail-empty">
          请从左侧选择一个任务查看详情
        </div>
        <div v-else class="p-task-detail">
          <div class="p-task-detail-description">
            <MarkdownEditor
              :model-value="taskDescriptions[selectedTask!.id] || selectedTask!.description || ''"
              @update:model-value="(value: string) => handleDescriptionChange(selectedTask!.id, value)"
              placeholder="点击编辑任务详情（支持 Markdown 格式）"
              :height="'100%'"
            />
            <div v-if="savingDescriptions[selectedTask!.id]" class="p-task-description-saving">
              保存中...
            </div>
          </div>

          <div class="p-task-detail-footer">
            <div class="p-task-detail-meta">
              <span 
                class="cu-tag cu-tag--small"
                :class="getPriorityClass(selectedTask!.priority)"
              >
                {{ getPriorityLabel(selectedTask!.priority) }}优先级
              </span>
            </div>
            <div class="p-task-detail-info">
              <span v-if="selectedTask!.deadline" class="p-task-detail-deadline" :class="{ 'p-task-detail-deadline--overdue': isTaskOverdue(selectedTask!.deadline, selectedTask!.completed) }">
                📅 {{ formatDeadline(selectedTask!.deadline) }}
              </span>
              <span class="p-task-detail-time">{{ timestampToChineseDateTime(selectedTask!.createTime) }}</span>
            </div>
            <div class="p-task-detail-actions">
              <div class="p-task-detail-status-buttons">
                <button
                  v-for="status in statusList"
                  :key="status.value"
                  class="p-task-status-btn"
                  :class="{
                    'p-task-status-btn--active': selectedTask!.status === status.value,
                    [`p-task-status-btn--${getStatusButtonClass(status.value)}`]: true
                  }"
                  @click="handleDirectChangeStatus(selectedTask!, status.value)"
                  :title="`切换到${status.label}`"
                >
                  {{ status.label }}
                </button>
              </div>
              <button
                class="p-task-detail-jump-btn"
                @click="router.push({ name: 'PlanDetail', params: { id: selectedTask!.id } })"
                title="跳转到详情页"
              >
                <ElIcon :size="16">
                  <ArrowRight />
                </ElIcon>
              </button>
            </div>
          </div>
        </div>
      </div>
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
        <el-form-item label="任务描述" label-position="top">
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
        v-if="contextMenuTask"
        class="p-context-menu-item" 
        @click="handleNavigateToDetail"
      >
        <span>跳转详情</span>
      </div>
      <div 
        v-if="contextMenuTask"
        class="p-context-menu-item" 
        @click="handleSaveSnapshot"
      >
        <span>保存快照</span>
      </div>
      <div class="p-context-menu-divider"></div>
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

