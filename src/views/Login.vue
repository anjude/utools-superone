<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ElNotification } from 'element-plus'
import { userApi } from '@/api/user'
import { idGenerator } from '@/utils/id-generator'
import { CacheManager } from '@/utils/cache-manager'
import { CACHE_KEYS } from '@/stores/cache'
import { useUserStore } from '@/stores'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

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
      // 保存token到缓存并同步更新 userStore
      userStore.setToken(tokenRes.data.jwtToken)
      
      // 获取用户信息，确保 isLoggedIn 变为 true
      try {
        await userStore.fetchUserInfo()
      } catch (error) {
        console.error('获取用户信息失败:', error)
        // 即使获取用户信息失败，也继续登录流程
      }
      
      // 清除定时器
      if (jwtInterval) {
        clearInterval(jwtInterval)
        jwtInterval = null
      }

      loginStatus.value = 'success'
      isLoggingIn.value = false

      // 登录成功，跳转回原页面
      setTimeout(() => {
        // 优先从 query 参数获取 redirect，其次从 sessionStorage 获取
        let redirect = route.query.redirect as string | undefined
        if (!redirect && typeof sessionStorage !== 'undefined') {
          redirect = sessionStorage.getItem('login_redirect') || undefined
          if (redirect) {
            sessionStorage.removeItem('login_redirect')
          }
        }
        
        if (redirect && redirect !== '/login') {
          // 跳转到保存的页面，使用 replace 避免在历史记录中留下登录页
          router.replace(redirect)
        } else {
          // 尝试返回上一页，如果没有历史记录则跳转到默认页面
          if (window.history.length > 1) {
            router.back()
          } else {
            router.replace({ name: 'TopicList' })
          }
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

// 组件挂载时检查登录状态
onMounted(() => {
  // 如果已经登录，直接跳转回原页面
  const token = CacheManager.get<string>(CACHE_KEYS.TOKEN)
  if (token) {
    // 同步更新 userStore
    userStore.setToken(token)
    
    // 获取 redirect 并跳转
    let redirect = route.query.redirect as string | undefined
    if (!redirect && typeof sessionStorage !== 'undefined') {
      redirect = sessionStorage.getItem('login_redirect') || undefined
      if (redirect) {
        sessionStorage.removeItem('login_redirect')
      }
    }
    
    if (redirect && redirect !== '/login') {
      router.replace(redirect)
    } else {
      router.replace({ name: 'TopicList' })
    }
    return
  }
  
  // 未登录，获取二维码
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
        <img v-if="imageUrl" :src="imageUrl" alt="二维码" class="p-qrcode-image" />
        <p class="p-scan-tip">{{ t('login.wechatScanTip') }}</p>
        <button 
          class="cu-button cu-button--primary cu-button--block p-refresh-button" 
          @click="refreshQrCode" 
          :disabled="isLoggingIn"
        >
          {{ t('login.refreshQrCode') }}
        </button>
      </div>

      <div v-else-if="loginStatus === 'idle'" class="p-login-status">
        <div class="p-loading-spinner"></div>
        <p>{{ t('login.scanning') }}</p>
      </div>

      <div v-else-if="loginStatus === 'success'" class="p-login-status">
        <p class="p-success-message">{{ t('login.loginSuccess') }}</p>
      </div>

      <div v-else-if="loginStatus === 'error'" class="p-login-status">
        <p class="p-error-message">{{ errorMessage }}</p>
        <button 
          class="cu-button cu-button--primary cu-button--block p-retry-button" 
          @click="refreshQrCode" 
          :disabled="isLoggingIn"
        >
          {{ t('login.retry') }}
        </button>
      </div>
    </div>
  </div>
</template>

