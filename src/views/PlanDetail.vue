<script lang="ts" setup>
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { MarkdownEditor, MarkdownViewer } from '@/components'
import { usePlanStore } from '@/stores/plan'
import { TopicLogRepo } from '@/repos/topic-log-repo'
import { TopicEnums } from '@/constants/enums'
import { TaskEnums } from '@/types/plan'
import { timestampToChineseDateTime, formatDeadline, isTaskOverdue } from '@/utils/time'
import { ElNotification, ElMessageBox } from 'element-plus'
import { logger } from '@/utils/logger'
import type { RecentTask } from '@/types/plan'
import type { TopicLogListItem, ITopicLogFormData } from '@/types/topic'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const planStore = usePlanStore()

// 从路由参数获取任务ID
const taskId = computed(() => {
  const id = route.params.id
  if (typeof id === 'string') {
    const numId = parseInt(id, 10)
    return isNaN(numId) ? null : numId
  }
  return null
})

// 任务数据
const task = ref<RecentTask | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// 日志相关状态
const logs = ref<TopicLogListItem[]>([])
const logsLoading = ref(false)
const logsError = ref<string>('')
const editorContent = ref('')
const saving = ref(false)

// 编辑日志相关状态
const editingLog = ref<TopicLogListItem | null>(null)
const editLogContent = ref('')
const showEditLogDialog = ref(false)
const editLogError = ref('')

// 加载任务详情
const loadTask = async () => {
  if (!taskId.value) return
  
  loading.value = true
  error.value = null
  try {
    const taskData = await planStore.getTaskById(taskId.value)
    if (!taskData) {
      error.value = '任务不存在'
      return
    }
    task.value = taskData
    logger.info('任务详情加载成功', { id: taskId.value })
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载任务详情失败'
    logger.error('加载任务详情失败', { error: err, id: taskId.value })
  } finally {
    loading.value = false
  }
}

// 加载日志列表
const loadLogs = async () => {
  if (!taskId.value) {
    logs.value = []
    return
  }
  
  logsLoading.value = true
  logsError.value = ''
  try {
    const data = await TopicLogRepo.getListItemsByTopicIdsAndTypes(
      [taskId.value],
      [TopicEnums.TopicType.RecentTask],
      { offset: 0, size: 100 }
    )
    // 按创建时间倒序排列（最新的在前）
    logs.value = data.sort((a, b) => b.createTime - a.createTime)
    logger.info('任务日志加载成功', { taskId: taskId.value, count: logs.value.length })
  } catch (err) {
    logsError.value = err instanceof Error ? err.message : '加载日志失败'
    logger.error('加载任务日志失败', { error: err, taskId: taskId.value })
  } finally {
    logsLoading.value = false
  }
}

// 保存日志
const handleSaveLog = async () => {
  if (!taskId.value || !editorContent.value.trim()) {
    return
  }

  saving.value = true
  try {
    await TopicLogRepo.create({
      topicId: taskId.value,
      topicType: TopicEnums.TopicType.RecentTask,
      content: editorContent.value.trim(),
    })
    // 清空编辑器
    editorContent.value = ''
    // 重新加载日志列表
    await loadLogs()
    logger.info('日志保存成功', { taskId: taskId.value })
    ElNotification({
      message: '日志保存成功',
      type: 'success',
      duration: 2000,
      position: 'bottom-right',
    })
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
    editLogError.value = '请输入日志内容'
    return
  }

  try {
    await TopicLogRepo.update(editingLog.value.id, {
      content: editLogContent.value.trim(),
    })
    handleCloseEditLogDialog()
    // 重新加载日志列表
    await loadLogs()
    logger.info('日志更新成功', { id: editingLog.value.id })
    ElNotification({
      message: '日志更新成功',
      type: 'success',
      duration: 2000,
      position: 'bottom-right',
    })
  } catch (err) {
    editLogError.value = err instanceof Error ? err.message : '更新日志失败'
    logger.error('更新日志失败', { error: err, id: editingLog.value.id })
    ElNotification({
      message: err instanceof Error ? err.message : '更新日志失败',
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

    await TopicLogRepo.delete(log.id)
    // 重新加载日志列表
    await loadLogs()
    logger.info('日志删除成功', { id: log.id })
    ElNotification({
      message: '日志删除成功',
      type: 'success',
      duration: 2000,
      position: 'bottom-right',
    })
  } catch (err) {
    // 用户取消删除或删除失败
    if (err === 'cancel') {
      return
    }
    logger.error('删除日志失败', { error: err })
    ElNotification({
      message: err instanceof Error ? err.message : '删除日志失败',
      type: 'error',
      duration: 2000,
      position: 'bottom-right',
    })
  }
}

// 保存快照
const handleSaveSnapshot = async () => {
  if (!task.value || !taskId.value) {
    ElNotification({
      message: '任务信息不存在',
      type: 'warning',
      duration: 2000,
      position: 'bottom-right',
    })
    return
  }

  try {
    // 格式化任务详情为 markdown
    const snapshotContent = formatTaskSnapshot(task.value)
    
    // 创建日志
    await TopicLogRepo.create({
      topicType: TopicEnums.TopicType.RecentTask,
      topicId: taskId.value,
      content: snapshotContent
    })
    
    // 重新加载日志列表
    await loadLogs()
    
    logger.info('任务快照保存成功', { taskId: taskId.value })
    ElNotification({
      message: '快照保存成功',
      type: 'success',
      duration: 2000,
      position: 'bottom-right',
    })
  } catch (err) {
    logger.error('任务快照保存失败', { error: err })
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

// 获取状态标签文本
const getStatusLabel = (status: TaskEnums.Status): string => {
  const statusMap = {
    [TaskEnums.Status.Pending]: '待处理',
    [TaskEnums.Status.InProgress]: '进行中',
    [TaskEnums.Status.Completed]: '已完成',
    [TaskEnums.Status.Cancelled]: '已取消',
  }
  return statusMap[status] || '未知状态'
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

onMounted(async () => {
  await loadTask()
  await loadLogs()
})
</script>

<template>
  <div class="p-plan-detail-wrap">
    <!-- 顶部：标题和操作按钮 -->
    <div class="p-plan-detail-header">
      <div class="p-header-left">
        <button 
          class="cu-button cu-button--text cu-button--small" 
          @click="router.back()"
        >
          ← 返回
        </button>
      </div>
      <div class="p-header-right">
        <button 
          class="cu-button cu-button--primary cu-button--small" 
          @click="handleSaveSnapshot"
          :disabled="!task"
        >
          保存快照
        </button>
      </div>
    </div>

    <!-- 加载、错误状态 -->
    <div v-if="loading && !task" class="p-loading">
      加载中...
    </div>

    <div v-else-if="error" class="p-error">
      <p>{{ error }}</p>
      <button 
        class="cu-button cu-button--primary cu-button--small" 
        @click="loadTask"
      >
        重试
      </button>
    </div>

    <!-- 任务详情 -->
    <div v-else-if="task" class="p-plan-detail-content">
      <!-- 任务信息卡片 -->
      <div class="cu-card p-task-info-card">
        <div class="p-task-header">
          <h2 class="p-task-title">
            <span v-if="task.top > 0" class="p-task-top-icon">🔝</span>
            {{ task.title }}
          </h2>
        </div>
        
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
          >
            {{ getStatusLabel(task.status) }}
          </span>
        </div>

        <div class="p-task-info">
          <div v-if="task.deadline" class="p-task-deadline" :class="{ 'p-task-deadline--overdue': isTaskOverdue(task.deadline, task.completed) }">
            📅 {{ formatDeadline(task.deadline) }}
          </div>
          <div class="p-task-time">
            创建时间：{{ timestampToChineseDateTime(task.createTime) }}
          </div>
        </div>

        <div v-if="task.description" class="p-task-description">
          <MarkdownViewer :content="task.description" />
        </div>
      </div>

      <!-- 新建日志编辑器 -->
      <div class="cu-card p-log-editor-card">
        <h3 class="p-log-editor-title">记录想法</h3>
        <MarkdownEditor
          v-model="editorContent"
          placeholder="记录你的任务进展和想法..."
          :height="120"
          :min-height="120"
          :max-height="300"
        />
        <div class="p-log-editor-actions">
          <button 
            class="cu-button cu-button--primary cu-button--small" 
            @click="handleSaveLog"
            :disabled="!editorContent.trim() || saving"
          >
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>

      <!-- 日志列表 -->
      <div class="p-logs-section">
        <h3 class="p-logs-title">
          {{ task.title }} 的日志
        </h3>
        <div v-if="logsLoading" class="p-logs-loading">加载中...</div>
        <div v-else-if="logsError" class="p-logs-error">{{ logsError }}</div>
        <div v-else-if="logs.length === 0" class="p-logs-empty">暂无日志</div>
        <ul v-else class="p-logs-list">
          <li v-for="log in logs" :key="log.id" class="cu-card cu-card--small p-log-item">
            <MarkdownViewer :content="log.content" class="p-log-content" />
            <div class="p-log-meta">
              <span class="p-log-time">{{ timestampToChineseDateTime(log.createTime) }}</span>
              <div class="p-log-actions">
                <button 
                  class="p-log-action-btn" 
                  @click="handleOpenEditLogDialog(log)"
                  title="编辑"
                >
                  编辑
                </button>
                <button 
                  class="p-log-action-btn p-log-action-btn--danger" 
                  @click="handleDeleteLog(log)"
                  title="删除"
                >
                  删除
                </button>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- 编辑日志弹窗 -->
    <el-dialog
      v-model="showEditLogDialog"
      title="编辑日志"
      width="600px"
      @close="handleCloseEditLogDialog"
    >
      <MarkdownEditor
        v-model="editLogContent"
        placeholder="编辑日志内容..."
        :height="200"
      />
      <div v-if="editLogError" class="p-edit-log-error">
        <el-alert
          :title="editLogError"
          type="error"
          :closable="false"
          show-icon
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseEditLogDialog">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleUpdateLog"
          >
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>


