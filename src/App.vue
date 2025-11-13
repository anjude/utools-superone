<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import type { PluginEnterAction } from './types/utools'
import Login from './Login/index.vue'
import TopicList from './components/TopicList.vue'

type GenericEnterAction = PluginEnterAction<unknown, unknown>

const route = ref<string>('')
const enterAction = ref<GenericEnterAction | null>(null)

onMounted(() => {
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
