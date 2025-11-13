import { 
  ChecklistApi, 
  ApiResponse, 
  PaginationData 
} from '@/types/api'
import request from '@/utils/request'

// 清单相关API接口
export const checklistApi = {
  /**
   * 获取清单列表
   * @param params 请求参数
   */
  async getChecklistList(params: ChecklistApi.GetChecklistListReq): Promise<ApiResponse<ChecklistApi.GetChecklistListResp>> {
    const response = await request.post('/api/so/checklist/list', params)
    return response.data
  },

  /**
   * 获取清单详情
   * @param params 请求参数
   */
  async getChecklistDetail(params: ChecklistApi.GetChecklistDetailReq): Promise<ApiResponse<ChecklistApi.GetChecklistDetailResp>> {
    const response = await request.get('/api/so/checklist/detail', params)
    return response.data
  },

  /**
   * 创建清单
   * @param data 请求数据
   */
  async createChecklist(data: ChecklistApi.CreateChecklistReq): Promise<ApiResponse<ChecklistApi.CreateChecklistResp>> {
    const response = await request.post('/api/so/checklist/create', data)
    return response.data
  },

  /**
   * 更新清单
   * @param data 请求数据
   */
  async updateChecklist(data: ChecklistApi.UpdateChecklistReq): Promise<ApiResponse<ChecklistApi.UpdateChecklistResp>> {
    const response = await request.post('/api/so/checklist/update', data)
    return response.data
  },

  /**
   * 删除清单
   * @param data 请求数据
   */
  async deleteChecklist(data: ChecklistApi.DeleteChecklistReq): Promise<ApiResponse<ChecklistApi.DeleteChecklistResp>> {
    const response = await request.post('/api/so/checklist/delete', data)
    return response.data
  },

  /**
   * 获取清单执行记录列表
   * @param params 请求参数
   */
  async getExecutionList(params: ChecklistApi.GetExecutionListReq): Promise<ApiResponse<ChecklistApi.GetExecutionListResp>> {
    const response = await request.post('/api/so/checklist/execution/list', params)
    return response.data
  },

  /**
   * 获取清单执行记录详情
   * @param params 请求参数
   */
  async getExecutionDetail(params: ChecklistApi.GetExecutionDetailReq): Promise<ApiResponse<ChecklistApi.GetExecutionDetailResp>> {
    const response = await request.get('/api/so/checklist/execution/detail', params)
    return response.data
  },

  /**
   * 创建清单执行记录
   * @param data 请求数据
   */
  async createExecution(data: ChecklistApi.CreateExecutionReq): Promise<ApiResponse<ChecklistApi.CreateExecutionResp>> {
    const response = await request.post('/api/so/checklist/execution/create', data)
    return response.data
  },

  /**
   * 更新清单执行记录
   * @param data 请求数据
   */
  async updateExecution(data: ChecklistApi.UpdateExecutionReq): Promise<ApiResponse<ChecklistApi.UpdateExecutionResp>> {
    const response = await request.post('/api/so/checklist/execution/update', data)
    return response.data
  },

  /**
   * 删除清单执行记录
   * @param data 请求数据
   */
  async deleteExecution(data: ChecklistApi.DeleteExecutionReq): Promise<ApiResponse<ChecklistApi.DeleteExecutionResp>> {
    const response = await request.post('/api/so/checklist/execution/delete', data)
    return response.data
  },

  /**
   * 搜索清单
   * @param params 请求参数
   */
  async searchChecklists(params: ChecklistApi.SearchChecklistsReq): Promise<ApiResponse<ChecklistApi.SearchChecklistsResp>> {
    const response = await request.post('/api/so/checklist/search', params)
    return response.data
  },


  /**
   * 获取清单执行历史
   * @param params 请求参数
   */
  async getExecutionHistory(params: ChecklistApi.GetExecutionHistoryReq): Promise<ApiResponse<ChecklistApi.GetExecutionHistoryResp>> {
    const response = await request.post('/api/so/checklist/execution/history', params)
    return response.data
  },

}
