<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import type { PluginEnterAction } from './types/utools'
import { useUserStore } from './stores'
import Login from './views/Login.vue'
import TopicList from './views/TopicList.vue'

type GenericEnterAction = PluginEnterAction<unknown, unknown>

const route = ref<string>('')
const enterAction = ref<GenericEnterAction | null>(null)
const userStore = useUserStore()

onMounted(() => {
  // 初始化用户 store（加载缓存数据）
  userStore.init()

  window.utools.onPluginEnter((action) => {
    route.value = action.code
    enterAction.value = action as GenericEnterAction
  })
  window.utools.onPluginOut(() => {
    route.value = ''
    enterAction.value = null
  })
})
</script>

<template>
  <template v-if="route === 'login' && enterAction">
    <Login :enterAction="enterAction!" />
  </template>
  <template v-else>
    <TopicList />
  </template>
</template>

<style scoped>
.basic-wrap { padding: 16px; }
</style>
