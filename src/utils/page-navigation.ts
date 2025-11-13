/**
 * 页面导航工具函数
 * 提供统一的页面导航和返回逻辑
 */

import { logger } from '@/utils/logger'

/**
 * 安全返回上一页
 * 如果页面栈中有上一页则返回，否则导航到指定页面
 * @param fallbackUrl 当没有上一页时的备用页面URL
 */
export const safeNavigateBack = (fallbackUrl: string = '/pages/plan/index'): void => {
  try {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      uni.navigateBack()
      logger.info('返回上一页')
    } else {
      uni.navigateTo({
        url: fallbackUrl,
        success: () => {
          logger.info('导航到备用页面', { url: fallbackUrl })
        },
        fail: (error) => {
          logger.error('导航到备用页面失败', { error, url: fallbackUrl })
        }
      })
    }
  } catch (error) {
    logger.error('页面导航失败', { error })
    uni.showToast({
      title: '页面跳转失败',
      icon: 'none',
      duration: 2000,
    })
  }
}

/**
 * 导航到编辑页面
 * @param baseUrl 基础URL路径
 * @param params 查询参数
 */
export const navigateToEdit = (baseUrl: string, params?: Record<string, any>): void => {
  try {
    let url = baseUrl
    if (params) {
      const queryString = Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
        .join('&')
      
      if (queryString) {
        url += `?${queryString}`
      }
    }

    uni.navigateTo({
      url,
      success: () => {
        logger.info('导航到编辑页面成功', { url })
      },
      fail: (error) => {
        logger.error('导航到编辑页面失败', { error, url })
        uni.showToast({
          title: '页面跳转失败',
          icon: 'none',
          duration: 2000,
        })
      },
    })
  } catch (error) {
    logger.error('导航到编辑页面失败', { error })
  }
}
