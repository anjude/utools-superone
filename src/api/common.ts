import { 
  CommonApi, 
  ApiResponse 
} from '@/types/api'
import request from '@/utils/request'
import CONFIG from '@/constants/config'
import { CacheManager } from '@/utils/cache-manager'
import { CACHE_KEYS } from '@/stores/cache'

// 通用相关API接口
export const commonApi = {
  // ==================== 微信相关接口 ====================
  
  /**
   * 微信自动回复
   * @param data 请求数据
   */
  async wxAutoReply(data: CommonApi.WxAutoReplyReq): Promise<ApiResponse<CommonApi.WxAutoReplyResp>> {
    const response = await request.post('/api/so/common/wx_auto_reply', data)
    return response.data
  },

  /**
   * 微信文件上传
   */
  async wxUpload(): Promise<ApiResponse<CommonApi.WxUploadResp>> {
    const response = await request.post('/api/so/common/wx_upload')
    return response.data
  },

  /**
   * 上传图片文件
   * @param filePath 文件路径
   */
  async uploadImg(filePath: string): Promise<string> {
    try {
      // 读取文件内容（base64）
      if (!window.services || typeof window.services.readFileBuffer !== 'function') {
        throw new Error('文件读取服务不可用')
      }

      const base64Data = window.services.readFileBuffer(filePath)
      
      // 获取文件扩展名，确定 MIME 类型
      const ext = filePath.split('.').pop()?.toLowerCase() || 'jpg'
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'bmp': 'image/bmp',
        'webp': 'image/webp'
      }
      const mimeType = mimeTypes[ext] || 'image/jpeg'

      // 将 base64 转换为 Blob
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: mimeType })

      // 创建 FormData
      const formData = new FormData()
      const fileName = filePath.split(/[/\\]/).pop() || `image.${ext}`
      formData.append('file', blob, fileName)

      // 准备请求头
      const token = CacheManager.get(CACHE_KEYS.TOKEN)
      const headers: Record<string, string> = {}
      
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      // 发送请求
      const response = await fetch(CONFIG.baseURL + '/api/so/common/wx_upload', {
        method: 'POST',
        headers,
        body: formData
      })

      if (!response.ok) {
        throw new Error(`上传失败: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.err_code === 0) {
        return data.data.url
      } else {
        throw new Error(data.msg || '上传失败')
      }
    } catch (error) {
      throw error
    }
  },

  /**
   * 获取微信访问令牌
   */
  async getWxAccessToken(): Promise<ApiResponse<any>> {
    const response = await request.get('/api/so/common/wx_access_token')
    return response.data
  },

  /**
   * 生成小程序二维码
   * @param data 请求数据
   */
  async generateMpQrcode(data: CommonApi.MpQrcodeReq): Promise<ApiResponse<CommonApi.MpQrcodeResp>> {
    const response = await request.post('/api/so/common/mp_qrcode', data)
    return response.data
  },

  /**
   * 生成小程序二维码(JSON格式)
   * @param data 请求数据
   */
  async generateMpQrcodeJson(data: CommonApi.MpQrcodeReq): Promise<ApiResponse<CommonApi.MpQrcodeResp>> {
    const response = await request.post('/api/so/common/mp_qrcode_json', data)
    return response.data
  },

  /**
   * 根据AppID和AppSecret获取访问令牌
   * @param params 请求参数
   */
  async getAccessTokenByIdSecret(params: CommonApi.GetAccessTokenByIdSecretReq): Promise<ApiResponse<CommonApi.GetAccessTokenByIdSecretResp>> {
    const response = await request.get('/api/so/common/get_access_token_by_id_secret', params)
    return response.data
  },

  /**
   * 清除配额
   */
  async clearQuota(): Promise<ApiResponse<CommonApi.ClearQuotaResp>> {
    const response = await request.get('/api/so/common/clear_quota')
    return response.data
  },

  // ==================== 系统相关接口 ====================
  
  /**
   * 获取系统信息
   */
  async getSystemInfo(): Promise<ApiResponse<CommonApi.SystemInfoView>> {
    const response = await request.get('/api/so/common/system/get')
    return response.data
  },

  /**
   * 更新系统信息
   * @param data 请求数据
   */
  async updateSystemInfo(data: CommonApi.UpdateSystemInfoReq): Promise<ApiResponse<any>> {
    const response = await request.post('/api/so/common/system/update', data)
    return response.data
  },

  // ==================== CSDN相关接口 ====================
  
  /**
   * CSDN热门文章评论
   * @param data 请求数据
   */
  async csdnHotArticleComment(data: CommonApi.CsdnCommentReq): Promise<ApiResponse<any>> {
    const response = await request.post('/api/so/common/csdn/hot_article_comment', data)
    return response.data
  },

  /**
   * 获取CSDN配置
   */
  async getCsdnConfig(): Promise<ApiResponse<CommonApi.GetCsdnConfigResp>> {
    const response = await request.get('/api/so/common/csdn/config/get')
    return response.data
  },

  /**
   * 更新CSDN配置
   * @param data 请求数据
   */
  async updateCsdnConfig(data: CommonApi.UpdateCsdnConfigReq): Promise<ApiResponse<any>> {
    const response = await request.post('/api/so/common/csdn/config/update', data)
    return response.data
  },

  /**
   * 触发CSDN评论
   */
  async triggerCsdnComment(): Promise<ApiResponse<any>> {
    const response = await request.post('/api/so/common/csdn/trigger_comment')
    return response.data
  },

  // ==================== AI相关接口 ====================
  
  /**
   * AI回复
   * @param data 请求数据
   */
  async getAiReply(data: CommonApi.AiReplyReq): Promise<ApiResponse<CommonApi.AiReplyResp>> {
    const response = await request.post('/api/so/common/ai/reply', data)
    return response.data
  },

  /**
   * AI回复记忆擦除
   * @param params 请求参数
   */
  async aiReplyMemoryErasure(params: CommonApi.AiReplyMemoryErasureReq): Promise<ApiResponse<CommonApi.AiReplyMemoryErasureResp>> {
    const response = await request.get('/api/so/common/ai/reply/memory_erasure', params)
    return response.data
  },

  /**
   * AI微信文章回复
   * @param data 请求数据
   */
  async getAiWechatArticleReply(data: CommonApi.AiWechatArticleReq): Promise<ApiResponse<CommonApi.AiWechatArticleResp>> {
    const response = await request.post('/api/so/common/ai/wechat_article', data)
    return response.data
  },

  /**
   * AI回复流式接口
   * @param data 请求数据
   */
  async getAiReplyStream(data: CommonApi.AiReplyReq): Promise<ApiResponse<any>> {
    const response = await request.get('/api/so/common/ai/reply/stream', data)
    return response.data
  },

  // ==================== 网页解析相关接口 ====================
  
  /**
   * 解析网页视图
   * @param params 请求参数
   */
  async parseWebView(params: CommonApi.ParseWebViewReq): Promise<ApiResponse<CommonApi.ParseWebViewResp>> {
    const response = await request.get('/api/so/common/web_view/parse', params)
    return response.data
  },

  // ==================== 热门数据相关接口 ====================
  
  /**
   * 获取热门数据
   * @param params 请求参数
   */
  async getHotData(params: CommonApi.GetHotDataReq): Promise<ApiResponse<CommonApi.GetHotDataResp>> {
    const response = await request.get('/api/so/common/hot_data/get', params)
    return response.data
  },

  // ==================== Redis相关接口 ====================
  
  /**
   * 获取前端Redis数据
   * @param params 请求参数
   */
  async getFeRedis(params: CommonApi.GetFeRedisReq): Promise<ApiResponse<CommonApi.GetFeRedisResp>> {
    const response = await request.get('/api/so/common/fe_redis/get', params)
    return response.data
  },

  /**
   * 设置前端Redis数据
   * @param data 请求数据
   */
  async setFeRedis(data: CommonApi.SetFeRedisReq): Promise<ApiResponse<any>> {
    const response = await request.post('/api/so/common/fe_redis/set', data)
    return response.data
  },

  /**
   * 删除前端Redis数据
   * @param data 请求数据
   */
  async delFeRedis(data: CommonApi.DelFeRedisReq): Promise<ApiResponse<any>> {
    const response = await request.post('/api/so/common/fe_redis/del', data)
    return response.data
  },

  // ==================== 全局ID生成器 ====================
  /**
   * 生成全局唯一ID（按 服务/模块/实体 维度）
   * @param data 请求数据
   */
  async generateGlobalId(data: CommonApi.GenerateGlobalIdReq): Promise<ApiResponse<CommonApi.GenerateGlobalIdResp>> {
    // 临时兼容，使用时间戳作为id，并减去一个较大的随机数
    const RANDOM_OFFSET = Math.floor(Math.random() * 1e8) + 1e8 // 生成一个 1e8~2e8 之间的随机数
    if (!data.count || data.count === 1) {
      // 单个ID，当前时间戳减去随机数
      return Promise.resolve({
        data: {
          id: Date.now() - RANDOM_OFFSET
        }
      } as ApiResponse<CommonApi.GenerateGlobalIdResp>)
    } else {
      // 批量ID，生成 count 个递增时间戳并减去随机数
      const now = Date.now() - RANDOM_OFFSET
      const ids = Array.from({ length: data.count }, (_, i) => now + i)
      return Promise.resolve({
        data: {
          ids
        }
      } as ApiResponse<CommonApi.GenerateGlobalIdResp>)
    }
    const response = await request.post('/api/so/common/global_id/generate', data)
    return response.data
  }
}
