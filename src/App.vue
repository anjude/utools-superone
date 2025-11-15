<script lang="ts" setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { PluginEnterAction } from './types/utools'
import { useUserStore } from './stores'
import { useTheme } from './composables/useTheme'
import CONFIG from './constants/config'

type GenericEnterAction = PluginEnterAction<unknown, unknown>

const router = useRouter()
const userStore = useUserStore()

// 初始化主题
useTheme()

// 存储 enterAction 供组件使用
let currentEnterAction: GenericEnterAction | null = null

// 将 enterAction 和 router 挂载到 window 上，供组件和工具类访问
if (typeof window !== 'undefined') {
  ;(window as any).__utoolsEnterAction = null
}

onMounted(() => {

  console.log('App mounted')

  // 将 router 和 userStore 挂载到 window 上，供 request-client 等工具类使用
  if (typeof window !== 'undefined') {
    ;(window as any).__router = router
    ;(window as any).__userStore = userStore
  }

  // 根据环境变量设置 baseURL
  // 优先使用 VITE_BASE_URL，如果没有则根据 VITE_ENV 或 MODE 从 urlMap 中选择
  const baseURL = import.meta.env.VITE_BASE_URL
  if (baseURL) {
    CONFIG.baseURL = baseURL
  } else {
    CONFIG.baseURL = CONFIG.getBaseURLByEnv()
  }
  
  console.log('BaseURL:', CONFIG.baseURL, 'Env:', import.meta.env.VITE_ENV || import.meta.env.MODE)

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
