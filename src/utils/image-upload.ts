import { logger } from '@/utils/logger'
import { commonApi } from '@/api/common'

/**
 * 图片上传工具类
 */
export class ImageUploadUtils {
  /**
   * 上传图片到服务器
   * @param filePath 文件路径
   * @returns 图片URL
   */
  static async uploadImage(filePath: string): Promise<string> {
    try {
      if (window.utools && typeof window.utools.showNotification === 'function') {
        window.utools.showNotification('上传中...')
      }
      
      const imageUrl = await commonApi.uploadImg(filePath)
      
      if (window.utools && typeof window.utools.showNotification === 'function') {
        window.utools.showNotification('上传成功')
      }
      
      return imageUrl
    } catch (error) {
      logger.error('图片上传失败', { error })
      
      if (window.utools && typeof window.utools.showNotification === 'function') {
        window.utools.showNotification('上传失败')
      }
      
      throw error
    }
  }

  /**
   * 选择并上传图片
   * @returns 图片URL
   */
  static async chooseAndUploadImage(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!window.utools || typeof window.utools.showOpenDialog !== 'function') {
        const error = new Error('uTools API 不可用')
        logger.error('选择图片失败', { error })
        reject(error)
        return
      }

      try {
        const filePaths = window.utools.showOpenDialog({
          title: '选择图片',
          filters: [
            { name: '图片', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] }
          ],
          properties: ['openFile'],
          defaultPath: window.utools.getPath('pictures')
        })

        if (!filePaths || filePaths.length === 0) {
          reject(new Error('未选择文件'))
          return
        }

        const filePath = filePaths[0]
        this.uploadImage(filePath)
          .then(resolve)
          .catch(reject)
      } catch (error) {
        logger.error('选择图片失败', { error })
        reject(error)
      }
    })
  }
}
