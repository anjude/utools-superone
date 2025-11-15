<script lang="ts" setup>
import { onMounted, ref, computed, watch } from 'vue'
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

// 选中的主题ID（用于编辑器和日志列表）
const selectedTopicId = ref<number | null>(null)
const editorContent = ref('')
const saving = ref(false)

// 日志相关状态
const logs = ref<TopicLogListItem[]>([])
const logsLoading = ref(false)
const logsError = ref<string>('')

// 当前选中的主题
const selectedTopic = computed(() => {
  return topics.value.find(t => t.id === selectedTopicId.value) || null
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
    // 如果有主题且没有选中，默认选中第一个
    if (topics.value.length > 0 && !selectedTopicId.value) {
      selectedTopicId.value = topics.value[0].id
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

onMounted(() => {
  loadTopics()
})
</script>

<template>
  <div class="p-topic-list-wrap">
    <!-- 顶部：主题列表 -->
    <div class="p-topic-list-header">
      <h2 class="p-page-title">主题日志</h2>
      <button 
        class="cu-button cu-button--text cu-button--small" 
        @click="loadTopics" 
        :disabled="loading"
      >
        {{ loading ? '加载中' : '刷新' }}
      </button>
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

    <div v-else class="p-topics-selector">
      <div 
        v-for="topic in topics" 
        :key="topic.id" 
        class="p-topic-tag"
        :class="{ 'p-topic-tag--active': selectedTopicId === topic.id }"
        @click="handleTopicSelect(topic)"
      >
        <span class="p-topic-tag-name">{{ topic.topicName }}</span>
      </div>
    </div>

    <!-- 中间：固定编辑器 -->
    <div class="p-editor-section">
      <div class="p-editor-wrapper">
        <MdEditor
          v-model="editorContent"
          :preview="true"
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
            '=',
            'pageFullscreen',
            'fullscreen',
            'preview',
            'catalog'
          ]"
          :placeholder="selectedTopic ? `记录到「${selectedTopic.topicName}」...` : '请先选择一个主题'"
          language="zh-CN"
          :style="{ height: '200px' }"
          :disabled="!selectedTopicId"
        />
        <div class="p-editor-save-btn">
          <button 
            class="cu-button cu-button--primary cu-button--small"
            @click="handleSaveLog"
            :disabled="!selectedTopicId || !editorContent.trim() || saving"
          >
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
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
          <div class="p-log-content" v-html="markdownToHtml(log.content)"></div>
          <div class="p-log-meta">
            <span class="p-log-time">{{ timestampToChineseDateTime(log.createTime) }}</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
