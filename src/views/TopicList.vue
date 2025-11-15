<script lang="ts" setup>
import { onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { MarkdownEditor, MarkdownViewer } from '@/components'
import { useTopicStore } from '@/stores/topic'
import { useTopicManagement } from '@/composables/useTopicManagement'
import { timestampToChineseDateTime } from '@/utils/time'

const { t } = useI18n()

// 初始化 store 和 composable
const topicStore = useTopicStore()
const {
  // 编辑主题弹窗状态
  showAddTopicDialog,
  isEditMode,
  topicForm,
  creatingTopic,
  topicFormError,
  // 编辑器状态
  editorContent,
  saving,
  canSave,
  selectedTopic,
  // 编辑日志弹窗状态
  showEditLogDialog,
  editLogContent,
  updatingLog,
  editLogError,
  // 右键菜单状态
  contextMenuVisible,
  contextMenuPosition,
  contextMenuTopic,
  // 编辑主题弹窗方法
  handleOpenAddTopicDialog,
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
  // 右键菜单方法
  handleContextMenu,
  handleDeleteTopic,
  handlePinTopic,
  handleUnpinTopic,
  // 刷新
  handleRefresh,
} = useTopicManagement(topicStore)

// 从 store 获取状态
const topics = computed(() => topicStore.topics)
const loading = computed(() => topicStore.loading)
const error = computed(() => topicStore.error)
const selectedTopicId = computed(() => topicStore.selectedTopicId)
const logs = computed(() => topicStore.logs)
const logsLoading = computed(() => topicStore.logsLoading)
const logsError = computed(() => topicStore.logsError)

onMounted(() => {
  topicStore.loadTopics()
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
        @click="topicStore.loadTopics"
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

    <!-- 添加/编辑主题弹窗 -->
    <el-dialog
      v-model="showAddTopicDialog"
      :title="isEditMode ? '编辑主题' : '添加主题'"
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
            @click="handleSubmitTopic"
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
      <div 
        v-if="contextMenuTopic"
        class="p-context-menu-item" 
        @click="handleOpenEditTopicDialogFromMenu"
      >
        <span>编辑</span>
      </div>
      <div class="p-context-menu-item p-context-menu-item--danger" @click="handleDeleteTopic">
        <span>删除</span>
      </div>
    </div>
  </div>
</template>
