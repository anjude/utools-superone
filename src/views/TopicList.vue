<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { TopicRepo } from '@/repos/topic-repo'
import type { ITopic } from '@/types/topic'
import { timestampToChineseDateTime } from '@/utils/time'

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
    error.value = err instanceof Error ? err.message : '加载主题列表失败'
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
  <div class="topic-list-wrap">
    <div class="topic-list-header">
      <h2>主题列表</h2>
      <button @click="loadTopics" :disabled="loading">
        {{ loading ? '加载中...' : '刷新' }}
      </button>
    </div>

    <div v-if="loading && topics.length === 0" class="loading">
      加载中...
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="loadTopics">重试</button>
    </div>

    <div v-else-if="topics.length === 0" class="empty">
      暂无主题
    </div>

    <ul v-else class="topic-list">
      <li v-for="topic in topics" :key="topic.id" class="topic-item">
        <div class="topic-header">
          <h3 class="topic-name">
            <span v-if="topic.top > 0" class="top-badge">置顶</span>
            {{ topic.topicName }}
          </h3>
          <span class="topic-time">
            {{ timestampToChineseDateTime(topic.createTime) }}
          </span>
        </div>
        <p v-if="topic.description" class="topic-description">
          {{ topic.description }}
        </p>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.topic-list-wrap {
  padding: 16px;
}

.topic-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.topic-list-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.loading,
.error,
.empty {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.error {
  color: #f56c6c;
}

.error button {
  margin-top: 12px;
}

.topic-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.topic-item {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.topic-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.topic-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.topic-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.top-badge {
  display: inline-block;
  background: #f56c6c;
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: normal;
}

.topic-time {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  margin-left: 12px;
}

.topic-description {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

@media (prefers-color-scheme: dark) {
  .topic-item {
    background: #2d2d2d;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .topic-item:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  }

  .topic-name {
    color: #fff;
  }

  .topic-description {
    color: #ccc;
  }

  .topic-time {
    color: #999;
  }
}
</style>

