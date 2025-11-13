import { 
  TopicApi, 
  ApiResponse, 
  PaginationData 
} from '@/types/api'
import request from '@/utils/request'

// 主题相关API接口
export const topicApi = {
  /**
   * 获取主题列表
   * @param params 请求参数
   */
  async getTopicList(params: TopicApi.GetTopicListReq): Promise<ApiResponse<TopicApi.GetTopicListResp>> {
    const response = await request.post('/api/so/topic/list', params)
    return response.data
  },

  /**
   * 获取主题详情
   * @param params 请求参数
   */
  async getTopicDetail(params: TopicApi.GetTopicDetailReq): Promise<ApiResponse<TopicApi.GetTopicDetailResp>> {
    const response = await request.get('/api/so/topic/detail', params)
    return response.data
  },

  /**
   * 创建主题
   * @param data 请求数据
   */
  async createTopic(data: TopicApi.CreateTopicReq): Promise<ApiResponse<TopicApi.CreateTopicResp>> {
    const response = await request.post('/api/so/topic/create', data)
    return response.data
  },

  /**
   * 更新主题
   * @param data 请求数据
   */
  async updateTopic(data: TopicApi.UpdateTopicReq): Promise<ApiResponse<TopicApi.UpdateTopicResp>> {
    const response = await request.post('/api/so/topic/update', data)
    return response.data
  },

  /**
   * 删除主题
   * @param data 请求数据
   */
  async deleteTopic(data: TopicApi.DeleteTopicReq): Promise<ApiResponse<TopicApi.DeleteTopicResp>> {
    const response = await request.post('/api/so/topic/delete', data)
    return response.data
  },

  /**
   * 获取主题日志列表
   * @param params 请求参数
   */
  async getTopicLogList(params: TopicApi.GetTopicLogListReq): Promise<ApiResponse<TopicApi.GetTopicLogListResp>> {
    const response = await request.post('/api/so/topic/log/list', params)
    return response.data
  },

  /**
   * 获取主题日志详情
   * @param params 请求参数
   */
  async getTopicLogDetail(params: TopicApi.GetTopicLogDetailReq): Promise<ApiResponse<TopicApi.GetTopicLogDetailResp>> {
    const response = await request.get('/api/so/topic/log/detail', params)
    return response.data
  },

  /**
   * 创建主题日志
   * @param data 请求数据
   */
  async createTopicLog(data: TopicApi.CreateTopicLogReq): Promise<ApiResponse<TopicApi.CreateTopicLogResp>> {
    const response = await request.post('/api/so/topic/log/create', data)
    return response.data
  },

  /**
   * 更新主题日志
   * @param data 请求数据
   */
  async updateTopicLog(data: TopicApi.UpdateTopicLogReq): Promise<ApiResponse<TopicApi.UpdateTopicLogResp>> {
    const response = await request.post('/api/so/topic/log/update', data)
    return response.data
  },

  /**
   * 删除主题日志
   * @param data 请求数据
   */
  async deleteTopicLog(data: TopicApi.DeleteTopicLogReq): Promise<ApiResponse<TopicApi.DeleteTopicLogResp>> {
    const response = await request.post('/api/so/topic/log/delete', data)
    return response.data
  }
}
