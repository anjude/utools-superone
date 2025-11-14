<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PluginEnterAction } from '@/types/utools'
import { LoginManager } from '@/utils/request/login-manager'
import request from '@/utils/request'

const { t } = useI18n()

// 从 window 获取 enterAction，如果没有则使用空对象作为默认值
const enterAction = computed<PluginEnterAction>(() => {
  return (
    (window as any).__utoolsEnterAction ||
    ({
      code: 'login',
      type: 'text',
      payload: '',
    } as PluginEnterAction)
  )
})

const loginManager = new LoginManager(request)
const isLoggingIn = ref(false)
const loginStatus = ref<'idle' | 'scanning' | 'success' | 'error'>('idle')
const errorMessage = ref('')

const handleLogin = async () => {
  if (isLoggingIn.value) {
    return
  }

  try {
    isLoggingIn.value = true
    loginStatus.value = 'scanning'
    errorMessage.value = ''

    const result = await loginManager.qrLogin()

    if (result.errCode === 0) {
      loginStatus.value = 'success'
      // 登录成功，可以跳转回主页面
      if (window.utools && typeof window.utools.redirect === 'function') {
        // 尝试跳转回主页面，如果没有主页面则保持当前页面
        setTimeout(() => {
          if (window.utools && typeof window.utools.redirect === 'function') {
            window.utools.redirect('', { type: 'text', data: '' })
          }
        }, 1000)
      }
    } else {
      loginStatus.value = 'error'
      errorMessage.value = result.msg || t('login.loginFailed')
    }
  } catch (error) {
    loginStatus.value = 'error'
      errorMessage.value = error instanceof Error ? error.message : t('login.loginFailed')
  } finally {
    isLoggingIn.value = false
  }
}

onMounted(() => {
  // 页面加载时自动开始登录流程
  handleLogin()
})
</script>

<template>
  <div class="p-login-container">
    <div class="p-login-content">
      <h1 class="p-login-title">{{ t('login.title') }}</h1>

      <div v-if="loginStatus === 'idle' || loginStatus === 'scanning'" class="p-login-status">
        <div v-if="loginStatus === 'scanning'" class="p-loading-spinner"></div>
        <p v-if="loginStatus === 'scanning'">{{ t('login.scanning') }}</p>
        <p v-else>{{ t('login.clickToLogin') }}</p>
      </div>

      <div v-if="loginStatus === 'success'" class="p-login-success">
        <p class="p-success-message">{{ t('login.loginSuccess') }}</p>
        <p class="p-success-tip">{{ t('login.redirecting') }}</p>
      </div>

      <div v-if="loginStatus === 'error'" class="p-login-error">
        <p class="p-error-message">{{ errorMessage }}</p>
        <button class="p-retry-button" @click="handleLogin" :disabled="isLoggingIn">
          {{ isLoggingIn ? t('login.loggingIn') : t('login.retry') }}
        </button>
      </div>

      <button
        v-if="loginStatus === 'idle'"
        class="p-login-button"
        @click="handleLogin"
        :disabled="isLoggingIn"
      >
        {{ isLoggingIn ? t('login.loggingIn') : t('login.startLogin') }}
      </button>
    </div>
  </div>
</template>
