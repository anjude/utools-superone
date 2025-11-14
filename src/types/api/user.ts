// 用户相关接口类型定义
// 符合数据模型规范：统一时间字段、用户标识等

import type { BaseEntity } from '@/types/plan';
import { UserEnums } from '@/constants/enums';

// 用户API命名空间
export namespace UserApi {

  // 获取验证码请求
  export interface GetCodeReq {
    uniqueId: string
  }

  // 获取验证码响应
  export interface GetCodeResp {
    code: string
    qrCode: string
  }

  // 获取JWT请求
  export interface GetJwtReq {
    code: string
  }

  // 获取JWT响应
  export interface GetJwtResp {
    jwtToken: string
  }

  // 设置JWT请求
  export interface SetJwtReq {
    code: string
  }

  // 设置JWT响应
  export interface SetJwtResp {
    // 空响应
  }

  // 登录请求
  export interface LoginReq {
    loginType: UserEnums.LoginType
    mpCode?: string
    qrCodeParam?: string
    appId: string
  }

  // 登录响应
  export interface LoginResp {
    token: string
    openid: string
  }

  // 用户信息视图 - 继承基础实体
  export interface UserInfoView extends BaseEntity {
    admin: number
    nickName: string
    avatarUrl: string
    hasSub: boolean
    verified: UserEnums.VerifyType
    permission: UserEnums.UserPermission  // 权限标记位
    invitationCount: number  // 邀请人数
    inviterOpenid?: string  // 邀请人OpenID（可选）
  }

  // 获取用户信息响应
  export interface GetUserInfoResp extends UserInfoView {}

  // 获取用户列表请求
  export interface GetUserListReq {
    offset?: number
    size?: number
  }

  // 获取用户列表响应
  export interface GetUserListResp {
    offset: number
    size: number
    list: UserInfoView[]
    total: number
  }

  // 更新用户请求
  export interface UpdateUserReq {
    nickName?: string
    avatarUrl?: string
    inviterOpenid?: string  // 邀请人OpenID（可选）
  }

  // 根据OpenID获取用户请求
  export interface GetByOpenidReq {
    openid: string
  }

  // 根据OpenID获取用户响应
  export interface GetByOpenidResp extends UserInfoView {}

  // 获取订阅用户请求
  export interface GetSubUserReq {
    openid?: string
  }

  // 获取订阅用户响应
  export interface GetSubUserResp {
    list: UserSubView[]
    total: number
  }

  // 用户订阅视图
  export interface UserSubView {
    flowOpenid: string
    flowAvatarUrl: string
    flowNickName: string
  }

  // 添加订阅用户请求
  export interface AddSubUserReq {
    flowOpenid: string
  }

  // 删除订阅用户请求
  export interface DelSubUserReq {
    flowOpenid: string
  }

  // 订阅消息请求
  export interface SubscribeMsgReq {
    messageTmpId: string
    content: string
    msgType: UserEnums.SubscribeMsgType
  }
}
