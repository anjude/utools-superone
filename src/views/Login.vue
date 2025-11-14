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
  <div class="login-container">
    <div class="login-content">
      <h1 class="login-title">{{ t('login.title') }}</h1>

      <div v-if="loginStatus === 'idle' || loginStatus === 'scanning'" class="login-status">
        <div v-if="loginStatus === 'scanning'" class="loading-spinner"></div>
        <p v-if="loginStatus === 'scanning'">{{ t('login.scanning') }}</p>
        <p v-else>{{ t('login.clickToLogin') }}</p>
      </div>

      <div v-if="loginStatus === 'success'" class="login-success">
        <p class="success-message">✓ {{ t('login.loginSuccess') }}</p>
        <p class="success-tip">{{ t('login.redirecting') }}</p>
      </div>

      <div v-if="loginStatus === 'error'" class="login-error">
        <p class="error-message">✗ {{ errorMessage }}</p>
        <button class="retry-button" @click="handleLogin" :disabled="isLoggingIn">
          {{ isLoggingIn ? t('login.loggingIn') : t('login.retry') }}
        </button>
      </div>

      <button
        v-if="loginStatus === 'idle'"
        class="login-button"
        @click="handleLogin"
        :disabled="isLoggingIn"
      >
        {{ isLoggingIn ? t('login.loggingIn') : t('login.startLogin') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background: #f5f5f5;
}

.login-content {
  background: white;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
  text-align: center;
}

.login-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 30px;
  color: #333;
}

.login-status {
  margin: 20px 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.login-success {
  margin: 20px 0;
}

.success-message {
  color: #27ae60;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
}

.success-tip {
  color: #666;
  font-size: 14px;
}

.login-error {
  margin: 20px 0;
}

.error-message {
  color: #e74c3c;
  font-size: 16px;
  margin-bottom: 20px;
}

.login-button,
.retry-button {
  width: 100%;
  padding: 12px 24px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.login-button:hover:not(:disabled),
.retry-button:hover:not(:disabled) {
  background: #2980b9;
}

.login-button:disabled,
.retry-button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}
</style>
