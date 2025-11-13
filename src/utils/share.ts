import { logger } from '@/utils/logger'
import type { 
  ShareContent, 
  ShareOptions, 
  ShareResult, 
  ShareMethod, 
  SharePlatform
} from '@/types/share'

/**
 * 分享工具类
 * 支持微信分享和保存图片
 */
class ShareUtils {
  /**
   * 获取可用的分享平台
   */
  getAvailablePlatforms(): SharePlatform[] {
    return [
      {
        name: '微信',
        icon: 'weixin',
        available: true,
        method: 'wechat'
      },
      {
        name: '生成图片',
        icon: 'image',
        available: true,
        method: 'save-image'
      }
    ]
  }

  /**
   * 执行分享
   */
  async share(options: ShareOptions): Promise<ShareResult> {
    const { content, method } = options

    try {
      logger.info('开始分享', { 
        type: content.type, 
        method, 
        title: content.title 
      })

      // 验证分享内容
      this.validateShareContent(content)

      let result: ShareResult

      switch (method) {
        case 'wechat':
          result = await this.shareToWechat(content)
          break
        case 'save-image':
          result = await this.saveImage(content)
          break
        default:
          throw new Error(`不支持的分享方式: ${method}`)
      }

      logger.info('分享完成', { 
        success: result.success, 
        method: result.method 
      })

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '分享失败'
      logger.error('分享失败', { error: errorMessage, method, content })
      
      return {
        success: false,
        method,
        error: errorMessage
      }
    }
  }

  /**
   * 验证分享内容
   */
  private validateShareContent(content: ShareContent): void {
    if (!content.title?.trim()) {
      throw new Error('分享标题不能为空')
    }
  }

  /**
   * 微信分享
   */
  private async shareToWechat(content: ShareContent): Promise<ShareResult> {
    return {
      success: true,
      method: 'wechat',
      message: '请使用右上角分享按钮'
    }
  }


  /**
   * 保存图片
   */
  private async saveImage(content: ShareContent): Promise<ShareResult> {
    if (!content.imageUrl) {
      return {
        success: false,
        method: 'save-image',
        error: '缺少图片地址'
      }
    }

    return new Promise((resolve) => {
      // 下载图片到本地临时文件
      uni.downloadFile({
        url: content.imageUrl!,
        success: (downloadRes) => {
          if (downloadRes.statusCode === 200) {
            // 保存到相册
            uni.saveImageToPhotosAlbum({
              filePath: downloadRes.tempFilePath,
              success: () => {
                uni.showToast({
                  title: '图片已保存',
                  icon: 'success'
                })
                resolve({
                  success: true,
                  method: 'save-image',
                  message: '图片已保存到相册'
                })
              },
              fail: (error: any) => {
                logger.error('保存图片到相册失败', { error })
                uni.showToast({
                  title: '保存失败',
                  icon: 'error'
                })
                resolve({
                  success: false,
                  method: 'save-image',
                  error: '保存失败，请检查相册权限'
                })
              }
            })
          } else {
            resolve({
              success: false,
              method: 'save-image',
              error: '图片下载失败'
            })
          }
        },
        fail: (error: any) => {
          logger.error('下载图片失败', { error })
          resolve({
            success: false,
            method: 'save-image',
            error: '图片下载失败'
          })
        }
      })
    })
  }


}

// 导出单例实例
export const shareUtils = new ShareUtils()

// 保持向后兼容，导出类
export { ShareUtils }
