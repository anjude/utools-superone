<script lang="ts" setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { PluginEnterAction } from './types/utools'
import { useUserStore } from './stores'
import { useTheme } from './composables/useTheme'

type GenericEnterAction = PluginEnterAction<unknown, unknown>

const router = useRouter()
const userStore = useUserStore()

// 初始化主题
useTheme()

// 存储 enterAction 供组件使用
let currentEnterAction: GenericEnterAction | null = null

// 将 enterAction 挂载到 window 上，供组件访问
if (typeof window !== 'undefined') {
  ;(window as any).__utoolsEnterAction = null
}

onMounted(() => {
  // 初始化用户 store（加载缓存数据）
  userStore.init()

  // 监听 uTools 插件进入事件
  window.utools.onPluginEnter(action => {
    currentEnterAction = action as GenericEnterAction
    ;(window as any).__utoolsEnterAction = currentEnterAction

    // 根据 action.code 路由到对应页面
    if (action.code === 'login') {
      router.push({ name: 'Login' })
    } else {
      router.push({ name: 'TopicList' })
    }
  })

  // 监听 uTools 插件退出事件
  window.utools.onPluginOut(() => {
    currentEnterAction = null
    ;(window as any).__utoolsEnterAction = null
    router.push({ name: 'TopicList' })
  })
})
</script>

<template>
  <router-view />
</template>

<style scoped>
.basic-wrap {
  padding: 16px;
}
</style>
