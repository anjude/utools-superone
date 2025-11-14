import { UserApi, ApiResponse, PaginationData } from '@/types/api'
import request, { Response } from '@/utils/request'

// 用户相关API接口
export const userApi = {
  /**
   * 获取验证码
   * @param params 请求参数
   */
  async getCode(params: UserApi.GetCodeReq): Promise<ApiResponse<UserApi.GetCodeResp>> {
    const response = await request.get('/api/so/user/code', params)
    return response.data
  },

  /**
   * 设置JWT
   * @param data 请求数据
   */
  async setJwt(data: UserApi.SetJwtReq): Promise<ApiResponse<UserApi.SetJwtResp>> {
    const response = await request.post('/api/so/user/set_jwt', data)
    return response.data
  },

  /**
   * 获取JWT
   * @param params 请求参数
   */
  async getJwt(params: UserApi.GetJwtReq): Promise<ApiResponse<UserApi.GetJwtResp>> {
    const response = await request.get('/api/so/user/get_jwt', params)
    return response.data
  },

  /**
   * 用户登录
   * @param params 请求参数
   */
  async login(params: UserApi.LoginReq): Promise<ApiResponse<UserApi.LoginResp>> {
    const response = await request.get('/api/so/user/login', params)
    return response.data
  },

  /**
   * 获取当前用户信息
   */
  async getUser(): Promise<ApiResponse<UserApi.GetUserInfoResp>> {
    const response = await request.get('/api/so/user/get')
    return response.data
  },

  /**
   * 根据OpenID获取用户信息
   * @param params 请求参数
   */
  async getUserByOpenid(
    params: UserApi.GetByOpenidReq
  ): Promise<ApiResponse<UserApi.GetByOpenidResp>> {
    const response = await request.get('/api/so/user/get_by_openid', params)
    return response.data
  },

  /**
   * 获取用户列表
   * @param params 请求参数
   */
  async getUserList(params: UserApi.GetUserListReq): Promise<ApiResponse<UserApi.GetUserListResp>> {
    const response = await request.get('/api/so/user/list', params)
    return response.data
  },

  /**
   * 更新用户信息
   * @param data 请求数据
   */
  async updateUser(data: UserApi.UpdateUserReq): Promise<ApiResponse<any>> {
    const response = await request.post('/api/so/user/update', data)
    return response.data
  },

  /**
   * 获取订阅用户
   * @param params 请求参数
   */
  async getSubUser(params: UserApi.GetSubUserReq): Promise<ApiResponse<UserApi.GetSubUserResp>> {
    const response = await request.get('/api/so/user/sub/get', params)
    return response.data
  },

  /**
   * 添加订阅用户
   * @param data 请求数据
   */
  async addSubUser(data: UserApi.AddSubUserReq): Promise<ApiResponse<any>> {
    const response = await request.post('/api/so/user/sub/add', data)
    return response.data
  },

  /**
   * 删除订阅用户
   * @param data 请求数据
   */
  async delSubUser(data: UserApi.DelSubUserReq): Promise<ApiResponse<any>> {
    const response = await request.post('/api/so/user/sub/del', data)
    return response.data
  },

  /**
   * 订阅消息
   * @param data 请求数据
   */
  async subscribeMessage(data: UserApi.SubscribeMsgReq): Promise<ApiResponse<any>> {
    const response = await request.post('/api/so/user/message/sub', data)
    return response.data
  },
}
