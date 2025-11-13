import { 
  ItemApi, 
  ApiResponse
} from '@/types/api'
import request from '@/utils/request'

// 物品管理相关API接口
// 与真实后端接口定义完全一致
export const itemApi = {
  // ==================== 物品管理接口 ====================

  /**
   * 获取物品列表
   * @param params 请求参数
   */
  async getItemList(params: ItemApi.GetItemListReq): Promise<ApiResponse<ItemApi.GetItemListResp>> {
    const response = await request.post('/api/so/item/list', params)
    return response.data
  },

  /**
   * 获取物品详情
   * @param params 请求参数
   */
  async getItemDetail(params: ItemApi.GetItemDetailReq): Promise<ApiResponse<ItemApi.GetItemDetailResp>> {
    const response = await request.get('/api/so/item/detail',  params )
    return response.data
  },

  /**
   * 创建物品
   * @param data 请求数据
   */
  async createItem(data: ItemApi.CreateItemReq): Promise<ApiResponse<ItemApi.CreateItemResp>> {
    const response = await request.post('/api/so/item/create', data)
    return response.data
  },

  /**
   * 更新物品
   * @param data 请求数据
   */
  async updateItem(data: ItemApi.UpdateItemReq): Promise<ApiResponse<ItemApi.UpdateItemResp>> {
    const response = await request.post('/api/so/item/update', data)
    return response.data
  },

  /**
   * 删除物品
   * @param data 请求数据
   */
  async deleteItem(data: ItemApi.DeleteItemReq): Promise<ApiResponse<ItemApi.DeleteItemResp>> {
    const response = await request.post('/api/so/item/delete', data)
    return response.data
  },

  /**
   * 更新物品状态
   * @param data 请求数据
   */
  async updateItemStatus(data: ItemApi.UpdateItemStatusReq): Promise<ApiResponse<ItemApi.UpdateItemStatusResp>> {
    const response = await request.post('/api/so/item/update_status', data)
    return response.data
  },

  // ==================== 物品分类接口 ====================

  /**
   * 获取物品分类列表
   * @param params 请求参数
   */
  async getItemCategoryList(params: ItemApi.GetItemCategoryListReq): Promise<ApiResponse<ItemApi.GetItemCategoryListResp>> {
    const response = await request.get('/api/so/item/category/list',  params )
    return response.data
  },

}
