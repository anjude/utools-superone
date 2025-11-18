<script lang="ts" setup>
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { CuModuleNav, MarkdownEditor, MarkdownViewer } from '@/components'
import { useTopicStore } from '@/stores/topic'
import { useUserStore } from '@/stores/user'
import { useTopicManagement } from '@/composables/useTopicManagement'
import { timestampToChineseDateTime } from '@/utils/time'
import { TopicEnums } from '@/constants/enums'
import { CacheManager } from '@/utils/cache-manager'
import { CACHE_KEYS } from '@/stores/cache'

const { t } = useI18n()
const router = useRouter()

// 初始化 store 和 composable
const topicStore = useTopicStore()
const userStore = useUserStore()
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
const isLoggedIn = computed(() => userStore.isLoggedIn)

// 跳转到登录页
const handleLogin = () => {
  // 保存当前路由，登录后返回
  router.push({
    name: 'Login',
    query: { redirect: router.currentRoute.value.fullPath },
  })
}

// 编辑器容器引用
const editorSectionRef = ref<HTMLElement | null>(null)

// 处理键盘快捷键
const handleEditorKeydown = (event: KeyboardEvent) => {
  // 检查是否是 Ctrl/Cmd + Enter
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    // 检查焦点是否在编辑器区域内
    const activeElement = document.activeElement
    if (editorSectionRef.value && activeElement && editorSectionRef.value.contains(activeElement)) {
      event.preventDefault()
      if (canSave.value) {
        handleSaveLog()
      }
    }
  }
}

// 初始化默认主题（未登录且没有主题时）
const initDefaultTopic = async () => {
  // 只在未登录且本地模式下初始化
  if (!isLoggedIn.value && topicStore.isLocalMode && topics.value.length === 0) {
    // 检查是否已经初始化过
    const hasInitialized = CacheManager.get<boolean>(CACHE_KEYS.DEFAULT_TOPIC_INITIALIZED, false, false)
    if (hasInitialized) {
      return
    }

    try {
      // 创建"版本日志"主题
      const defaultTopic = await topicStore.createTopic({
        topicName: '版本日志(右键删除)',
        description: '欢迎使用豆流便签！这里记录版本更新和功能介绍。',
      })

      // 创建功能介绍日志
      if (defaultTopic.id) {
        await topicStore.createLog({
          topicId: defaultTopic.id,
          topicType: TopicEnums.TopicType.Topic,
          content: `# 欢迎使用豆流便签！

豆流便签（SuperOne）是一款集成多种实用工具的 uTools 插件，帮助你在 PC 端和手机端高效管理日常工作与思考。

## 📝 核心功能模块

### 1. 主题管理
- 使用 Markdown 记录思考与知识
- 支持时间线日志管理
- 快速记录想法，随时回顾

### 2. 检查清单
- 创建和管理检查清单
- 支持执行记录和进度跟踪
- 确保重要事项不遗漏

### 3. 任务计划
- 管理近期任务
- 支持任务创建、编辑、状态流转和删除
- 清晰掌握工作进度

### 4. 投资标的
- 管理股票信息
- 记录和跟踪投资思考
- 辅助投资决策

## 🔒 核心特性

- **字段级数据加密**：每个敏感字段独立加密，数据库无明文存储
- **跨平台同步**：uTools + 微信小程序无缝互通，一个账号全平台使用
- **微信登录**：无需注册，支持多设备同时使用

## 🚀 快速开始

1. 点击右上角「登录」按钮，使用微信扫码登录
2. 登录后，本地数据会自动同步到云端
3. 创建主题，使用 Markdown 记录想法
4. 在微信小程序中搜索「豆流便签」，随时查看和编辑

---

**提示**：未登录时，数据会保存在UTools存储。登录后会自动同步到云端，你可以在任何设备上访问你的数据。`,
        })

        // 标记已初始化
        CacheManager.set(CACHE_KEYS.DEFAULT_TOPIC_INITIALIZED, true, false)
      }
    } catch (error) {
      console.error('初始化默认主题失败:', error)
    }
  }
}

onMounted(async () => {
  await topicStore.loadTopics()
  // 初始化默认主题（如果需要）
  await initDefaultTopic()
  // 添加全局键盘事件监听
  document.addEventListener('keydown', handleEditorKeydown)
})

onUnmounted(() => {
  // 移除全局键盘事件监听
  document.removeEventListener('keydown', handleEditorKeydown)
})
</script>

<template>
  <div class="p-topic-list-wrap">
    <!-- 顶部：主题列表 -->
    <div class="p-topic-list-header">
      <div class="p-header-left">
        <CuModuleNav>
          <h2 class="p-page-title">主题日志</h2>
        </CuModuleNav>
      </div>
      <div class="p-header-actions">
        <el-button 
          v-if="!isLoggedIn"
          type="primary" 
          size="small"
          @click="handleLogin"
        >
          登录丨多端同步
        </el-button>
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
          {{ saving ? '保存中...' : '保存日志' }}
        </button>
      </div>
    </div>

    <!-- 中间：固定编辑器 -->
    <div ref="editorSectionRef" class="p-editor-section">
      <MarkdownEditor
        v-model="editorContent"
        :placeholder="selectedTopic ? `记录到「${selectedTopic.topicName}」...（Ctrl/Cmd + Enter 保存）` : '请先选择一个主题'"
        height="auto"
        :min-height="120"
        :max-height="300"
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
        <el-form-item label="主题描述" label-position="top">
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
        <el-form-item label="日志内容" required label-position="top">
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
