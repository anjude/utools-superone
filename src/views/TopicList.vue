<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { MdEditor } from 'md-editor-v3'
import { TopicRepo } from '@/repos/topic-repo'
import { TopicLogRepo } from '@/repos/topic-log-repo'
import type { ITopic, TopicLogListItem } from '@/types/topic'
import { TopicEnums } from '@/constants/enums'
import { timestampToChineseDateTime } from '@/utils/time'
import { markdownToHtml } from '@/utils/markdown'

const { t } = useI18n()
const router = useRouter()

const topics = ref<ITopic[]>([])
const loading = ref(false)
const error = ref<string>('')

// 编辑相关状态
const editingTopicId = ref<number | null>(null)
const editorContent = ref('')
const saving = ref(false)

// 日志相关状态
const logs = ref<TopicLogListItem[]>([])
const logsLoading = ref(false)
const logsError = ref<string>('')

// 当前编辑的主题
const editingTopic = computed(() => {
  return topics.value.find(t => t.id === editingTopicId.value) || null
})

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
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('topic.loadFailed')
    console.error('加载主题列表失败:', err)
  } finally {
    loading.value = false
  }
}

const loadLogs = async (topicId: number) => {
  if (!topicId) return
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

const handleTopicClick = (topic: ITopic, event: MouseEvent) => {
  // 如果点击的是编辑按钮或其子元素，不跳转
  const target = event.target as HTMLElement
  if (
    target.closest('.p-topic-edit-btn') ||
    target.closest('.p-topic-editor-section') ||
    target.closest('.p-editor-wrapper') ||
    target.closest('.p-editor-actions') ||
    target.closest('.p-logs-section') ||
    target.closest('.md-editor')
  ) {
    return
  }
  // 跳转到主题详情页
  router.push({ name: 'TopicDetail', params: { id: topic.id } })
}

const handleEditClick = (topic: ITopic, event: MouseEvent) => {
  event.stopPropagation()
  if (editingTopicId.value === topic.id) {
    // 如果已经在编辑这个主题，取消编辑
    editingTopicId.value = null
    editorContent.value = ''
    logs.value = []
  } else {
    // 开始编辑新主题
    editingTopicId.value = topic.id
    editorContent.value = ''
    loadLogs(topic.id)
  }
}

const handleSaveLog = async () => {
  if (!editingTopicId.value || !editorContent.value.trim()) {
    return
  }

  saving.value = true
  try {
    await TopicLogRepo.create({
      topicId: editingTopicId.value,
      topicType: TopicEnums.TopicType.Topic,
      content: editorContent.value.trim(),
    })
    // 清空编辑器
    editorContent.value = ''
    // 重新加载日志列表
    await loadLogs(editingTopicId.value)
  } catch (err) {
    console.error('保存日志失败:', err)
    alert(err instanceof Error ? err.message : '保存日志失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadTopics()
})
</script>

<template>
  <div class="p-topic-list-wrap">
    <div class="p-topic-list-header">
      <h2>主题日志</h2>
      <button 
        class="cu-button cu-button--secondary" 
        @click="loadTopics" 
        :disabled="loading"
        :class="{ 'cu-button--loading': loading }"
      >
        {{ loading ? '加载中' : '刷新' }}
      </button>
    </div>

    <div v-if="loading && topics.length === 0" class="p-loading">
      加载中...
    </div>

    <div v-else-if="error" class="p-error">
      <p>{{ error }}</p>
      <button 
        class="cu-button cu-button--primary" 
        @click="loadTopics"
      >
        重试
      </button>
    </div>

    <div v-else-if="topics.length === 0" class="p-empty">
      暂无主题
    </div>

    <div v-else class="p-topic-list">
      <div 
        v-for="topic in topics" 
        :key="topic.id" 
        class="p-topic-item"
        @click="handleTopicClick(topic, $event)"
      >
        <div class="p-topic-header">
          <h3 class="p-topic-name">
            <span v-if="topic.top > 0" class="cu-tag cu-tag--danger cu-tag--small cu-tag--status">置顶</span>
            {{ topic.topicName }}
          </h3>
          <div class="p-topic-actions">
            <button 
              class="p-topic-edit-btn cu-button cu-button--text"
              @click="handleEditClick(topic, $event)"
            >
              {{ editingTopicId === topic.id ? '取消' : '编辑' }}
            </button>
            <span class="p-topic-time">
              {{ timestampToChineseDateTime(topic.createTime) }}
            </span>
          </div>
        </div>
        <p v-if="topic.description" class="p-topic-description">
          {{ topic.description }}
        </p>

        <!-- 编辑器区域 -->
        <div 
          v-if="editingTopicId === topic.id" 
          class="p-topic-editor-section"
          @click.stop
        >
          <div class="p-editor-wrapper">
            <MdEditor
              v-model="editorContent"
              :preview="false"
              :toolbars="[
                'bold',
                'underline',
                'italic',
                'strikeThrough',
                '-',
                'title',
                'sub',
                'sup',
                'quote',
                'unorderedList',
                'orderedList',
                'task',
                '-',
                'codeRow',
                'code',
                'link',
                'table',
                '-',
                'revoke',
                'next',
                'save',
                '=',
                'pageFullscreen',
                'fullscreen',
                'preview',
                'catalog'
              ]"
              :placeholder="`记录到「${topic.topicName}」...`"
              language="zh-CN"
              :style="{ height: '300px' }"
            />
          </div>
          <div class="p-editor-actions">
            <button 
              class="cu-button cu-button--primary"
              @click.stop="handleSaveLog"
              :disabled="!editorContent.trim() || saving"
            >
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>

          <!-- 日志列表 -->
          <div class="p-logs-section">
            <h4 class="p-logs-title">日志列表</h4>
            <div v-if="logsLoading" class="p-logs-loading">加载中...</div>
            <div v-else-if="logsError" class="p-logs-error">{{ logsError }}</div>
            <div v-else-if="logs.length === 0" class="p-logs-empty">暂无日志</div>
            <ul v-else class="p-logs-list">
              <li v-for="log in logs" :key="log.id" class="p-log-item">
                <div class="p-log-content" v-html="markdownToHtml(log.content)"></div>
                <div class="p-log-meta">
                  <span class="p-log-time">{{ timestampToChineseDateTime(log.createTime) }}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
