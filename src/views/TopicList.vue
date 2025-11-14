<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { TopicRepo } from '@/repos/topic-repo'
import type { ITopic } from '@/types/topic'
import { timestampToChineseDateTime } from '@/utils/time'

const { t } = useI18n()

const topics = ref<ITopic[]>([])
const loading = ref(false)
const error = ref<string>('')

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

onMounted(() => {
  loadTopics()
})
</script>

<template>
  <div class="p-topic-list-wrap">
    <div class="p-topic-list-header">
      <h2>{{ t('topic.title') }}</h2>
      <button 
        class="cu-button cu-button--secondary" 
        @click="loadTopics" 
        :disabled="loading"
        :class="{ 'cu-button--loading': loading }"
      >
        {{ loading ? t('common.loading') : t('topic.refresh') }}
      </button>
    </div>

    <div v-if="loading && topics.length === 0" class="p-loading">
      {{ t('common.loading') }}
    </div>

    <div v-else-if="error" class="p-error">
      <p>{{ error }}</p>
      <button 
        class="cu-button cu-button--primary" 
        @click="loadTopics"
      >
        {{ t('login.retry') }}
      </button>
    </div>

    <div v-else-if="topics.length === 0" class="p-empty">
      {{ t('topic.empty') }}
    </div>

    <ul v-else class="p-topic-list">
      <li v-for="topic in topics" :key="topic.id" class="p-topic-item">
        <div class="p-topic-header">
          <h3 class="p-topic-name">
            <span v-if="topic.top > 0" class="p-top-badge">{{ t('topic.top') }}</span>
            {{ topic.topicName }}
          </h3>
          <span class="p-topic-time">
            {{ timestampToChineseDateTime(topic.createTime) }}
          </span>
        </div>
        <p v-if="topic.description" class="p-topic-description">
          {{ topic.description }}
        </p>
      </li>
    </ul>
  </div>
</template>
