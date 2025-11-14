import { PlanApi, ApiResponse, PaginationData } from '@/types/api'
import request from '@/utils/request'

/**
 * 计划管理API接口
 * 提供近期任务和统一目标（年度/季度OKR）的CRUD操作
 * 对齐后端接口规范
 */
export const planApi = {
  // ==================== 近期任务接口 ====================

  /**
   * 获取近期任务列表
   * @param params 请求参数
   */
  async getRecentTaskList(
    params: PlanApi.GetRecentTaskListReq
  ): Promise<ApiResponse<PlanApi.GetRecentTaskListResp>> {
    const response = await request.post('/api/so/plan/recent_task/list', params)
    return response.data
  },

  /**
   * 获取近期任务详情
   * @param params 请求参数
   */
  async getRecentTaskDetail(
    params: PlanApi.GetRecentTaskDetailReq
  ): Promise<ApiResponse<PlanApi.GetRecentTaskDetailResp>> {
    const response = await request.get('/api/so/plan/recent_task/detail', params)
    return response.data
  },

  /**
   * 创建近期任务
   * @param data 请求数据
   */
  async createRecentTask(
    data: PlanApi.CreateRecentTaskReq
  ): Promise<ApiResponse<PlanApi.CreateRecentTaskResp>> {
    const response = await request.post('/api/so/plan/recent_task/create', data)
    return response.data
  },

  /**
   * 更新近期任务
   * @param data 请求数据
   */
  async updateRecentTask(
    data: PlanApi.UpdateRecentTaskReq
  ): Promise<ApiResponse<PlanApi.UpdateRecentTaskResp>> {
    const response = await request.post('/api/so/plan/recent_task/update', data)
    return response.data
  },

  /**
   * 删除近期任务
   * @param data 请求数据
   */
  async deleteRecentTask(
    data: PlanApi.DeleteRecentTaskReq
  ): Promise<ApiResponse<PlanApi.DeleteRecentTaskResp>> {
    const response = await request.post('/api/so/plan/recent_task/delete', data)
    return response.data
  },

  // ==================== 统一目标接口 ====================

  /**
   * 获取目标列表
   * @param params 请求参数
   */
  async getGoalList(params: PlanApi.GetGoalListReq): Promise<ApiResponse<PlanApi.GetGoalListResp>> {
    const response = await request.post('/api/so/plan/goal/list', params)
    return response.data
  },

  /**
   * 获取目标详情
   * @param params 请求参数
   */
  async getGoalDetail(
    params: PlanApi.GetGoalDetailReq
  ): Promise<ApiResponse<PlanApi.GetGoalDetailResp>> {
    const response = await request.get('/api/so/plan/goal/detail', params)
    return response.data
  },

  /**
   * 创建目标
   * @param data 请求数据
   */
  async createGoal(data: PlanApi.CreateGoalReq): Promise<ApiResponse<PlanApi.CreateGoalResp>> {
    const response = await request.post('/api/so/plan/goal/create', data)
    return response.data
  },

  /**
   * 更新目标
   * @param data 请求数据
   */
  async updateGoal(data: PlanApi.UpdateGoalReq): Promise<ApiResponse<PlanApi.UpdateGoalResp>> {
    const response = await request.post('/api/so/plan/goal/update', data)
    return response.data
  },

  /**
   * 删除目标
   * @param data 请求数据
   */
  async deleteGoal(data: PlanApi.DeleteGoalReq): Promise<ApiResponse<PlanApi.DeleteGoalResp>> {
    const response = await request.post('/api/so/plan/goal/delete', data)
    return response.data
  },
}
