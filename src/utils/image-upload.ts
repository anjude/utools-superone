import { logger } from '@/utils/logger'
import { commonApi } from '@/apis/common'

/**
 * 图片上传工具类
 */
export class ImageUploadUtils {
  /**
   * 上传图片到服务器
   * @param tempFilePath 临时文件路径
   * @returns 图片URL
   */
  static async uploadImage(tempFilePath: string): Promise<string> {
    uni.showLoading({
      title: '上传中...',
      mask: true
    })
    
    try {
      const imageUrl = await commonApi.uploadImg(tempFilePath)
      uni.hideLoading()
      uni.showToast({
        title: '上传成功',
        icon: 'success',
        duration: 2000
      })
      return imageUrl
    } catch (error) {
      uni.hideLoading()
      logger.error('图片上传失败', { error })
      uni.showToast({
        title: '上传失败',
        icon: 'none',
        duration: 1500
      })
      throw error
    }
  }

  /**
   * 选择并上传图片
   * @returns 图片URL
   */
  static async chooseAndUploadImage(): Promise<string> {
    return new Promise((resolve, reject) => {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
          try {
            const imageUrl = await this.uploadImage(res.tempFilePaths[0])
            resolve(imageUrl)
          } catch (error) {
            reject(error)
          }
        },
        fail: (error) => {
          logger.error('选择图片失败', { error })
          reject(error)
        }
      })
    })
  }
}
