<script lang="ts" setup>
import { onMounted, ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'
import { MarkdownEditor, MarkdownViewer } from '@/components'
import { TopicRepo } from '@/repos/topic-repo'
import { TopicLogRepo } from '@/repos/topic-log-repo'
import type { ITopic, ITopicFormData, TopicLogListItem } from '@/types/topic'
import { TopicEnums } from '@/constants/enums'
import { timestampToChineseDateTime, getCurrentTimestamp } from '@/utils/time'
import { CacheManager } from '@/utils/cache-manager'
import { CACHE_KEYS } from '@/stores/cache'

const { t } = useI18n()
const router = useRouter()

const topics = ref<ITopic[]>([])
const loading = ref(false)
const error = ref<string>('')

// 选中的主题ID（用于编辑器和日志列表）
const selectedTopicId = ref<number | null>(null)
const editorContent = ref('')
const saving = ref(false)

// 日志相关状态
const logs = ref<TopicLogListItem[]>([])
const logsLoading = ref(false)
const logsError = ref<string>('')

// 编辑日志弹窗相关状态
const showEditLogDialog = ref(false)
const editingLog = ref<TopicLogListItem | null>(null)
const editLogContent = ref('')
const updatingLog = ref(false)
const editLogError = ref<string>('')

// 当前选中的主题
const selectedTopic = computed(() => {
  return topics.value.find(t => t.id === selectedTopicId.value) || null
})

// 判断编辑器是否有内容（用于优化保存按钮禁用状态）
const hasEditorContent = computed(() => {
  return editorContent.value.trim().length > 0
})

// 判断保存按钮是否可用
const canSave = computed(() => {
  return selectedTopicId.value !== null && hasEditorContent.value && !saving.value
})

// 添加主题弹窗相关状态
const showAddTopicDialog = ref(false)
const topicForm = ref<{
  topicName: string
  description: string
}>({
  topicName: '',
  description: '',
})
const creatingTopic = ref(false)
const topicFormError = ref<string>('')

// 右键菜单相关状态
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const contextMenuTopic = ref<ITopic | null>(null)
let contextMenuCloseHandler: ((e: MouseEvent) => void) | null = null

const loadTopics = async () => {
  loading.value = true
  error.value = ''
  try {
    const data = await TopicRepo.getAll()
    // 按置顶权重和创建时间排序：置顶的在前，同置顶权重按创建时间倒序
    topics.value = data.sort((a, b) => {
      if (a.top !== b.top) {
        return b.top - a.top // 置顶权重大的在前
      }
      return b.createTime - a.createTime // 创建时间新的在前
    })
    
    // 如果有主题且没有选中，尝试从缓存恢复选中的主题
    if (topics.value.length > 0 && !selectedTopicId.value) {
      // 从本地缓存读取保存的主题ID
      const savedTopicId = CacheManager.get<number>(CACHE_KEYS.SELECTED_TOPIC_ID, null, true)
      
      if (savedTopicId !== null) {
        // 检查保存的主题是否还存在
        const topicExists = topics.value.some(topic => topic.id === savedTopicId)
        if (topicExists) {
          selectedTopicId.value = savedTopicId
        } else {
          // 如果保存的主题不存在，选择第一个主题
          selectedTopicId.value = topics.value[0].id
          // 更新缓存为第一个主题
          CacheManager.set(CACHE_KEYS.SELECTED_TOPIC_ID, selectedTopicId.value, true)
        }
      } else {
        // 没有保存的主题，默认选中第一个
        selectedTopicId.value = topics.value[0].id
        // 保存到缓存
        CacheManager.set(CACHE_KEYS.SELECTED_TOPIC_ID, selectedTopicId.value, true)
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('topic.loadFailed')
    console.error('加载主题列表失败:', err)
  } finally {
    loading.value = false
  }
}

const loadLogs = async (topicId: number) => {
  if (!topicId) {
    logs.value = []
    return
  }
  logsLoading.value = true
  logsError.value = ''
  try {
    const data = await TopicLogRepo.getListItemsByTopicIdsAndTypes(
      [topicId],
      [TopicEnums.TopicType.Topic],
      { offset: 0, size: 100 }
    )
    // 按创建时间倒序排列（最新的在前）
    logs.value = data.sort((a, b) => b.createTime - a.createTime)
  } catch (err) {
    logsError.value = err instanceof Error ? err.message : '加载日志失败'
    console.error('加载主题日志失败:', err)
  } finally {
    logsLoading.value = false
  }
}

// 刷新功能（同时刷新主题列表和日志）
const handleRefresh = async () => {
  await loadTopics()
  if (selectedTopicId.value) {
    await loadLogs(selectedTopicId.value)
  }
}

// 监听选中主题变化，自动加载日志
watch(selectedTopicId, (newId) => {
  if (newId) {
    loadLogs(newId)
  } else {
    logs.value = []
  }
})

const handleTopicSelect = (topic: ITopic) => {
  selectedTopicId.value = topic.id
  // 保存选中的主题ID到本地缓存
  CacheManager.set(CACHE_KEYS.SELECTED_TOPIC_ID, topic.id, true)
}

const handleSaveLog = async () => {
  if (!selectedTopicId.value || !editorContent.value.trim()) {
    return
  }

  saving.value = true
  try {
    await TopicLogRepo.create({
      topicId: selectedTopicId.value,
      topicType: TopicEnums.TopicType.Topic,
      content: editorContent.value.trim(),
    })
    // 清空编辑器
    editorContent.value = ''
    // 重新加载日志列表
    await loadLogs(selectedTopicId.value)
  } catch (err) {
    console.error('保存日志失败:', err)
    alert(err instanceof Error ? err.message : '保存日志失败')
  } finally {
    saving.value = false
  }
}

const handleOpenAddTopicDialog = () => {
  topicForm.value = {
    topicName: '',
    description: '',
  }
  topicFormError.value = ''
  showAddTopicDialog.value = true
}

const handleCloseAddTopicDialog = () => {
  showAddTopicDialog.value = false
  topicForm.value = {
    topicName: '',
    description: '',
  }
  topicFormError.value = ''
}

const handleCreateTopic = async () => {
  if (!topicForm.value.topicName?.trim()) {
    topicFormError.value = '主题名称不能为空'
    return
  }

  creatingTopic.value = true
  topicFormError.value = ''
  try {
    const description = topicForm.value.description?.trim()
    const newTopic = await TopicRepo.create({
      topicName: topicForm.value.topicName.trim(),
      ...(description ? { description } : {}),
    })
    // 关闭弹窗
    handleCloseAddTopicDialog()
    // 刷新主题列表
    await loadTopics()
    // 自动选中新创建的主题
    if (newTopic.id) {
      selectedTopicId.value = newTopic.id
      // 保存选中的主题ID到本地缓存
      CacheManager.set(CACHE_KEYS.SELECTED_TOPIC_ID, newTopic.id, true)
    }
  } catch (err) {
    topicFormError.value = err instanceof Error ? err.message : '创建主题失败'
    console.error('创建主题失败:', err)
  } finally {
    creatingTopic.value = false
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
    
    // 如果用户确认删除，执行删除操作
    await TopicRepo.delete(topicId)
    
    // 如果删除的是当前选中的主题，清空选中状态
    if (selectedTopicId.value === topicId) {
      selectedTopicId.value = null
    }
    
    // 刷新主题列表
    await loadTopics()
    closeContextMenu()
  } catch (err) {
    // 用户取消删除或删除失败
    if (err === 'cancel') {
      closeContextMenu()
      return
    }
    console.error('删除主题失败:', err)
    ElMessageBox.alert(
      err instanceof Error ? err.message : '删除主题失败',
      '错误',
      {
        confirmButtonText: '确定',
        type: 'error',
      }
    )
  }
}

// 置顶主题
const handlePinTopic = async () => {
  if (!contextMenuTopic.value) return
  
  const topicId = contextMenuTopic.value.id
  const currentTimestamp = getCurrentTimestamp()
  
  try {
    await TopicRepo.update(topicId, { top: currentTimestamp })
    
    // 刷新主题列表
    await loadTopics()
    closeContextMenu()
  } catch (err) {
    console.error('置顶主题失败:', err)
    ElMessageBox.alert(
      err instanceof Error ? err.message : '置顶主题失败',
      '错误',
      {
        confirmButtonText: '确定',
        type: 'error',
      }
    )
  }
}

// 取消置顶主题
const handleUnpinTopic = async () => {
  if (!contextMenuTopic.value) return
  
  const topicId = contextMenuTopic.value.id
  
  try {
    await TopicRepo.update(topicId, { top: 0 })
    
    // 刷新主题列表
    await loadTopics()
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

// 复制日志内容
const handleCopyLog = async (log: TopicLogListItem) => {
  try {
    await navigator.clipboard.writeText(log.content)
    if (window.utools && typeof window.utools.showNotification === 'function') {
      window.utools.showNotification('已复制到剪贴板')
    } else {
      alert('已复制到剪贴板')
    }
  } catch (err) {
    console.error('复制失败:', err)
    alert('复制失败')
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
    await TopicLogRepo.update(editingLog.value.id, {
      content: editLogContent.value.trim(),
      topicId: editingLog.value.topicId,
      topicType: editingLog.value.topicType,
    })
    // 关闭弹窗
    handleCloseEditLogDialog()
    // 重新加载日志列表
    if (selectedTopicId.value) {
      await loadLogs(selectedTopicId.value)
    }
  } catch (err) {
    editLogError.value = err instanceof Error ? err.message : '更新日志失败'
    console.error('更新日志失败:', err)
  } finally {
    updatingLog.value = false
  }
}

// 删除日志
const handleDeleteLog = async (log: TopicLogListItem) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条日志吗？此操作不可恢复。',
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
    
    // 如果用户确认删除，执行删除操作
    await TopicLogRepo.delete(log.id)
    
    // 重新加载日志列表
    if (selectedTopicId.value) {
      await loadLogs(selectedTopicId.value)
    }
  } catch (err) {
    // 用户取消删除或删除失败
    if (err === 'cancel') {
      return
    }
    console.error('删除日志失败:', err)
    ElMessageBox.alert(
      err instanceof Error ? err.message : '删除日志失败',
      '错误',
      {
        confirmButtonText: '确定',
        type: 'error',
      }
    )
  }
}

onMounted(() => {
  loadTopics()
})
</script>

<template>
  <div class="p-topic-list-wrap">
    <!-- 顶部：主题列表 -->
    <div class="p-topic-list-header">
      <h2 class="p-page-title">主题日志</h2>
      <div class="p-header-actions">
        <el-button 
          type="primary" 
          size="small"
          @click="handleOpenAddTopicDialog"
        >
          添加主题
        </el-button>
        <button 
          class="cu-button cu-button--text cu-button--small" 
          @click="handleRefresh" 
          :disabled="loading || logsLoading"
        >
          {{ loading || logsLoading ? '加载中' : '刷新' }}
        </button>
      </div>
    </div>

    <!-- 主题选择区域 -->
    <div v-if="loading && topics.length === 0" class="p-loading">
      加载中...
    </div>

    <div v-else-if="error" class="p-error">
      <p>{{ error }}</p>
      <button 
        class="cu-button cu-button--primary cu-button--small" 
        @click="loadTopics"
      >
        重试
      </button>
    </div>

    <div v-else-if="topics.length === 0" class="p-empty">
      暂无主题
    </div>

    <div v-else class="p-topics-selector-wrapper">
      <div class="p-topics-selector">
        <div 
          v-for="topic in topics" 
          :key="topic.id" 
          class="p-topic-tag"
          :class="{ 'p-topic-tag--active': selectedTopicId === topic.id }"
          @click="handleTopicSelect(topic)"
          @contextmenu.prevent="handleContextMenu($event, topic)"
        >
          <span v-if="topic.top > 0" class="p-topic-tag-top-icon">🔝</span>
          <span class="p-topic-tag-name">{{ topic.topicName }}</span>
        </div>
      </div>
      <div class="p-topics-selector-actions">
        <button 
          class="cu-button cu-button--primary cu-button--small"
          @click="handleSaveLog"
          :disabled="!canSave"
        >
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>

    <!-- 中间：固定编辑器 -->
    <div class="p-editor-section">
      <MarkdownEditor
        v-model="editorContent"
        :placeholder="selectedTopic ? `记录到「${selectedTopic.topicName}」...` : '请先选择一个主题'"
        :height="150"
        :disabled="!selectedTopicId"
      />
    </div>

    <!-- 底部：日志列表 -->
    <div class="p-logs-section">
      <h3 class="p-logs-title">
        {{ selectedTopic ? `${selectedTopic.topicName} 的日志` : '日志列表' }}
      </h3>
      <div v-if="logsLoading" class="p-logs-loading">加载中...</div>
      <div v-else-if="logsError" class="p-logs-error">{{ logsError }}</div>
      <div v-else-if="!selectedTopicId" class="p-logs-empty">请先选择一个主题</div>
      <div v-else-if="logs.length === 0" class="p-logs-empty">暂无日志</div>
      <ul v-else class="p-logs-list">
        <li v-for="log in logs" :key="log.id" class="cu-card cu-card--small p-log-item">
          <MarkdownViewer :content="log.content" class="p-log-content" />
          <div class="p-log-meta">
            <span class="p-log-time">{{ timestampToChineseDateTime(log.createTime) }}</span>
            <div class="p-log-actions">
              <button 
                class="p-log-action-btn" 
                @click="handleCopyLog(log)"
                title="复制"
              >
                复制
              </button>
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

    <!-- 添加主题弹窗 -->
    <el-dialog
      v-model="showAddTopicDialog"
      title="添加主题"
      width="600px"
      @close="handleCloseAddTopicDialog"
    >
      <el-form :model="topicForm" label-width="80px">
        <el-form-item label="主题名称" required>
          <el-input
            v-model="topicForm.topicName"
            placeholder="请输入主题名称"
            :maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="主题描述">
          <MarkdownEditor
            v-model="topicForm.description"
            placeholder="请输入主题描述（可选，支持 Markdown 格式）"
            :height="150"
          />
        </el-form-item>
        <el-form-item v-if="topicFormError">
          <el-alert
            :title="topicFormError"
            type="error"
            :closable="false"
            show-icon
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseAddTopicDialog">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleCreateTopic"
            :loading="creatingTopic"
          >
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑日志弹窗 -->
    <el-dialog
      v-model="showEditLogDialog"
      title="编辑日志"
      width="600px"
      @close="handleCloseEditLogDialog"
    >
      <el-form :model="{ content: editLogContent }" label-width="80px">
        <el-form-item label="日志内容" required>
          <MarkdownEditor
            v-model="editLogContent"
            placeholder="请输入日志内容（支持 Markdown 格式）"
            :height="200"
          />
        </el-form-item>
        <el-form-item v-if="editLogError">
          <el-alert
            :title="editLogError"
            type="error"
            :closable="false"
            show-icon
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseEditLogDialog">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleUpdateLog"
            :loading="updatingLog"
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
        v-if="contextMenuTopic && contextMenuTopic.top > 0"
        class="p-context-menu-item" 
        @click="handleUnpinTopic"
      >
        <span>取消置顶</span>
      </div>
      <div 
        v-else
        class="p-context-menu-item" 
        @click="handlePinTopic"
      >
        <span>置顶</span>
      </div>
      <div class="p-context-menu-item p-context-menu-item--danger" @click="handleDeleteTopic">
        <span>删除</span>
      </div>
    </div>
  </div>
</template>
