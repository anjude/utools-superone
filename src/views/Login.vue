<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { userApi } from '@/api/user'
import { idGenerator } from '@/utils/id-generator'
import { CacheManager } from '@/utils/cache-manager'
import { CACHE_KEYS } from '@/stores/cache'

const { t } = useI18n()

const imageUrl = ref('')
const isLoggingIn = ref(false)
const loginStatus = ref<'idle' | 'scanning' | 'success' | 'error'>('idle')
const errorMessage = ref('')
let jwtInterval: any = null

// 打开外部链接（二维码）
const openExternal = (url: string) => {
  if (window.utools && typeof window.utools.shellOpenExternal === 'function') {
    window.utools.shellOpenExternal(url)
    return
  }
  if (typeof window !== 'undefined' && typeof window.open === 'function') {
    window.open(url, '_blank')
    return
  }
}

// 显示通知
const showNotification = (title: string, type: 'success' | 'warning' | 'info' | 'error' = 'info') => {
  ElNotification({
    message: title,
    type,
    duration: 2000,
    position: 'bottom-right'
  })
}

// 获取二维码并开始轮询
const fetchQrCode = async () => {
  if (isLoggingIn.value) {
    return
  }

  try {
    isLoggingIn.value = true
    loginStatus.value = 'scanning'
    errorMessage.value = ''

    const uniqueId = String(idGenerator.generateId())
    const res = await userApi.getCode({ uniqueId })

    if (res.errCode === 0 && res.data) {
      // 显示二维码
      if (res.data.qrCode) {
        imageUrl.value = 'data:image/png;base64,' + res.data.qrCode
        openExternal(res.data.qrCode)
        showNotification('请扫描二维码完成登录')
      }

      // 二维码获取成功，重置 isLoggingIn 状态，允许刷新
      isLoggingIn.value = false

      // 定时获取token
      jwtInterval = setInterval(() => {
        getTokenAndNavigate(res.data.code)
      }, 3000) // 每隔3秒调用一次
    } else {
      loginStatus.value = 'error'
      errorMessage.value = res.msg || t('login.loginFailed')
      isLoggingIn.value = false
    }
  } catch (error) {
    loginStatus.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : t('login.loginFailed')
    isLoggingIn.value = false
    console.error('获取二维码失败:', error)
  }
}

// 获取token并跳转
const getTokenAndNavigate = async (code: string) => {
  try {
    const tokenRes = await userApi.getJwt({ code })
    if (tokenRes.errCode === 0 && tokenRes.data && tokenRes.data.jwtToken) {
      // 保存token
      CacheManager.set(CACHE_KEYS.TOKEN, tokenRes.data.jwtToken)
      
      // 清除定时器
      if (jwtInterval) {
        clearInterval(jwtInterval)
        jwtInterval = null
      }

      loginStatus.value = 'success'
      isLoggingIn.value = false

      // 登录成功，跳转回主页面
      setTimeout(() => {
        if (window.utools && typeof window.utools.redirect === 'function') {
          window.utools.redirect('', { type: 'text', data: '' })
        } else if ((window as any).__router) {
          ;(window as any).__router.push({ name: 'TopicList' })
        }
      }, 1000)
    }
  } catch (error) {
    console.error('获取token失败:', error)
  }
}

// 刷新二维码
const refreshQrCode = () => {
  // 清除定时器
  if (jwtInterval) {
    clearInterval(jwtInterval)
    jwtInterval = null
  }
  // 重置状态，确保可以重新获取二维码
  isLoggingIn.value = false
  loginStatus.value = 'idle'
  errorMessage.value = ''
  imageUrl.value = ''
  // 重新获取二维码
  fetchQrCode()
}

// 组件挂载时获取二维码
onMounted(() => {
  fetchQrCode()
})

// 组件卸载时清除定时器
onUnmounted(() => {
  if (jwtInterval) {
    clearInterval(jwtInterval)
    jwtInterval = null
  }
})
</script>

<template>
  <div class="p-login-container">
    <div class="p-login-content">
      <h1 class="p-login-title">{{ t('login.title') }}</h1>

      <div v-if="loginStatus === 'scanning'" class="p-login-status">
        <p>{{ t('login.scanning') }}</p>
        <img v-if="imageUrl" :src="imageUrl" alt="二维码" class="p-qrcode-image" />
      </div>

      <div v-if="loginStatus === 'success'" class="p-login-success">
        <p class="p-success-message">{{ t('login.loginSuccess') }}</p>
        <p class="p-success-tip">{{ t('login.redirecting') }}</p>
      </div>

      <div v-if="loginStatus === 'error'" class="p-login-error">
        <p class="p-error-message">{{ errorMessage }}</p>
        <button 
          class="cu-button cu-button--primary cu-button--block" 
          @click="refreshQrCode" 
          :disabled="isLoggingIn"
          :class="{ 'cu-button--loading': isLoggingIn }"
        >
          {{ isLoggingIn ? t('login.loggingIn') : t('login.retry') }}
        </button>
      </div>

      <button
        v-if="loginStatus === 'scanning'"
        class="cu-button cu-button--primary cu-button--block"
        @click="refreshQrCode"
        :disabled="isLoggingIn"
      >
        刷新二维码
      </button>
    </div>
  </div>
</template>

