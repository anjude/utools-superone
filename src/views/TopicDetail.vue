<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MarkdownViewer } from '@/components'
import { TopicRepo } from '@/repos/topic-repo'
import { TopicLogRepo } from '@/repos/topic-log-repo'
import type { ITopic, TopicLogListItem } from '@/types/topic'
import { TopicEnums } from '@/constants/enums'
import { timestampToChineseDateTime } from '@/utils/time'

const route = useRoute()
const router = useRouter()

const topic = ref<ITopic | null>(null)
const loading = ref(false)
const error = ref<string>('')

const logs = ref<TopicLogListItem[]>([])
const logsLoading = ref(false)
const logsError = ref<string>('')

const topicId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? parseInt(id, 10) : Number(id)
})

const loadTopic = async () => {
  if (!topicId.value) return
  loading.value = true
  error.value = ''
  try {
    const data = await TopicRepo.getById(topicId.value)
    if (data) {
      topic.value = data
    } else {
      error.value = '主题不存在'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载主题失败'
    console.error('加载主题失败:', err)
  } finally {
    loading.value = false
  }
}

const loadLogs = async () => {
  if (!topicId.value) return
  logsLoading.value = true
  logsError.value = ''
  try {
    const data = await TopicLogRepo.getListItemsByTopicIdsAndTypes(
      [topicId.value],
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

onMounted(() => {
  loadTopic()
  loadLogs()
})
</script>

<template>
  <div class="p-topic-detail-wrap">
    <div class="cu-card cu-card--large p-topic-detail-header">
      <button class="cu-button cu-button--text" @click="router.back()">
        ← 返回
      </button>
      <h2>主题详情</h2>
    </div>

    <div v-if="loading" class="p-loading">加载中...</div>

    <div v-else-if="error" class="p-error">
      <p>{{ error }}</p>
      <button class="cu-button cu-button--primary" @click="loadTopic">
        重试
      </button>
    </div>

    <div v-else-if="topic" class="p-topic-detail-content">
      <div class="cu-card cu-card--large p-topic-info">
        <h3 class="p-topic-name">
          <span v-if="topic.top > 0" class="cu-tag cu-tag--danger cu-tag--small cu-tag--status">置顶</span>
          {{ topic.topicName }}
        </h3>
        <MarkdownViewer v-if="topic.description" :content="topic.description" class="p-topic-description" />
        <div class="p-topic-meta">
          <span class="p-topic-time">创建时间：{{ timestampToChineseDateTime(topic.createTime) }}</span>
          <span class="p-topic-time">更新时间：{{ timestampToChineseDateTime(topic.updateTime) }}</span>
        </div>
      </div>

      <div class="p-logs-section">
        <h4 class="p-logs-title">日志列表</h4>
        <div v-if="logsLoading" class="p-logs-loading">加载中...</div>
        <div v-else-if="logsError" class="p-logs-error">{{ logsError }}</div>
        <div v-else-if="logs.length === 0" class="p-logs-empty">暂无日志</div>
        <ul v-else class="p-logs-list">
          <li v-for="log in logs" :key="log.id" class="cu-card cu-card--large p-log-item">
            <MarkdownViewer :content="log.content" class="p-log-content" />
            <div class="p-log-meta">
              <span class="p-log-time">{{ timestampToChineseDateTime(log.createTime) }}</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

