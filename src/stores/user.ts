import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserApi } from '@/types/api'
import { userApi } from '@/api/user'
import { CacheManager } from '@/utils/cache-manager'
import { CACHE_KEYS } from './cache'
import { logger } from '@/utils/logger'

/**
 * 用户状态管理 Store
 * 管理用户信息、登录状态、token 等全局状态
 */
export const useUserStore = defineStore('user', () => {
  // 状态
  const userInfo = ref<UserApi.UserInfoView | null>(null)
  const token = ref<string | null>(null)
  const isLoggedIn = computed(() => !!token.value && !!userInfo.value)

  // 初始化：从缓存加载 token
  const initToken = () => {
    const cachedToken = CacheManager.get<string>(CACHE_KEYS.TOKEN)
    if (cachedToken) {
      token.value = cachedToken
    }
  }

  // 初始化：从缓存加载用户信息
  const initUserInfo = () => {
    const cachedUserInfo = CacheManager.get<UserApi.UserInfoView>(CACHE_KEYS.USER_INFO)
    if (cachedUserInfo) {
      userInfo.value = cachedUserInfo
    }
  }

  // 设置 token
  const setToken = (newToken: string) => {
    token.value = newToken
    CacheManager.set(CACHE_KEYS.TOKEN, newToken)
    logger.info('Token 已更新', { hasToken: !!newToken })
  }

  // 设置用户信息
  const setUserInfo = (info: UserApi.UserInfoView | null) => {
    userInfo.value = info
    if (info) {
      CacheManager.set(CACHE_KEYS.USER_INFO, info)
      CacheManager.set(CACHE_KEYS.USER_OPENID, info.openid)
      logger.info('用户信息已更新', { openid: info.openid, nickName: info.nickName })
    } else {
      CacheManager.remove(CACHE_KEYS.USER_INFO)
      CacheManager.remove(CACHE_KEYS.USER_OPENID)
      logger.info('用户信息已清除')
    }
  }

  // 获取当前用户信息
  const fetchUserInfo = async (): Promise<void> => {
    try {
      const response = await userApi.getUser()
      if (response.errCode === 0 && response.data) {
        setUserInfo(response.data)
      } else {
        logger.error('获取用户信息失败', { errCode: response.errCode, msg: response.msg })
        throw new Error(response.msg || '获取用户信息失败')
      }
    } catch (error) {
      logger.error('获取用户信息异常', { error })
      throw error
    }
  }

  // 登录
  const login = async (params: UserApi.LoginReq): Promise<void> => {
    try {
      const response = await userApi.login(params)
      if (response.errCode === 0 && response.data) {
        setToken(response.data.token)
        // 登录成功后获取用户信息
        await fetchUserInfo()
        logger.info('登录成功', { openid: response.data.openid })
      } else {
        logger.error('登录失败', { errCode: response.errCode, msg: response.msg })
        throw new Error(response.msg || '登录失败')
      }
    } catch (error) {
      logger.error('登录异常', { error })
      throw error
    }
  }

  // 登出
  const logout = () => {
    token.value = null
    userInfo.value = null
    CacheManager.remove(CACHE_KEYS.TOKEN)
    CacheManager.remove(CACHE_KEYS.USER_INFO)
    CacheManager.remove(CACHE_KEYS.USER_OPENID)
    logger.info('用户已登出')
  }

  // 更新用户信息
  const updateUserInfo = async (data: UserApi.UpdateUserReq): Promise<void> => {
    try {
      const response = await userApi.updateUser(data)
      if (response.errCode === 0) {
        // 更新成功后重新获取用户信息
        await fetchUserInfo()
        logger.info('用户信息更新成功')
      } else {
        logger.error('更新用户信息失败', { errCode: response.errCode, msg: response.msg })
        throw new Error(response.msg || '更新用户信息失败')
      }
    } catch (error) {
      logger.error('更新用户信息异常', { error })
      throw error
    }
  }

  // 初始化：加载缓存数据
  const init = () => {
    initToken()
    initUserInfo()
  }

  return {
    // 状态
    userInfo,
    token,
    isLoggedIn,
    // 方法
    init,
    setToken,
    setUserInfo,
    fetchUserInfo,
    login,
    logout,
    updateUserInfo
  }
})

