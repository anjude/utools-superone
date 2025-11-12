<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import type { PluginEnterAction } from './types/utools'
import Hello from './Hello/index.vue'
import Read from './Read/index.vue'
import Write from './Write/index.vue'

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
  <template v-if="route === 'hello' && enterAction">
    <Hello :enterAction="enterAction!" />
  </template>
  <template v-if="route === 'read' && enterAction">
    <Read :enterAction="enterAction!" />
  </template>
  <template v-if="route === 'write' && enterAction">
    <Write :enterAction="enterAction!" />
  </template>
</template>
