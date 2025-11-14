import { StockApi, ApiResponse, PaginationData } from '@/types/api'
import request from '@/utils/request'

// 标的和思考记录相关API接口
export const stockApi = {
  // ==================== 标的管理接口 ====================

  /**
   * 获取标的列表
   * @param params 请求参数
   */
  async getStockList(
    params: StockApi.GetStockListReq
  ): Promise<ApiResponse<StockApi.GetStockListResp>> {
    const response = await request.post('/api/so/stock/list', params)
    return response.data
  },

  /**
   * 获取标的详情
   * @param params 请求参数
   */
  async getStockDetail(
    params: StockApi.GetStockDetailReq
  ): Promise<ApiResponse<StockApi.GetStockDetailResp>> {
    const response = await request.post('/api/so/stock/detail', params)
    return response.data
  },

  /**
   * 创建标的
   * @param data 请求数据
   */
  async createStock(data: StockApi.CreateStockReq): Promise<ApiResponse<StockApi.CreateStockResp>> {
    const response = await request.post('/api/so/stock/create', data)
    return response.data
  },

  /**
   * 更新标的
   * @param data 请求数据
   */
  async updateStock(data: StockApi.UpdateStockReq): Promise<ApiResponse<StockApi.UpdateStockResp>> {
    const response = await request.post('/api/so/stock/update', data)
    return response.data
  },

  /**
   * 删除标的
   * @param data 请求数据
   */
  async deleteStock(data: StockApi.DeleteStockReq): Promise<ApiResponse<StockApi.DeleteStockResp>> {
    const response = await request.post('/api/so/stock/delete', data)
    return response.data
  },
}
