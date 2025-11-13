// 流程相关接口类型定义
// 符合数据模型规范：统一时间字段、用户标识等

import type { BaseEntity } from '@/types/plan';
import { FlowEnums } from '@/types/enums';

// 流程API命名空间
export namespace FlowApi {

  // 信息视图 - 继承基础实体
  export interface InfoView extends BaseEntity {
    linkId: number
    link: string
    content: string
    isPublic: number
    infoType: FlowEnums.InfoType
    imgList: string[]
    likeNum: number
    viewNum: number
    infoScore: number
    liked: boolean
    avatarUrl: string
    nickName: string
    top: number
    detail: string
  }

  // 评论视图 - 继承基础实体
  export interface CommentView extends BaseEntity {
    content: string
    infoId: number
    nickName: string
    verified: FlowEnums.FlowVerifyType
  }

  // 链接视图 - 继承基础实体
  export interface LinkView extends BaseEntity {
    link: string
    linkTitle: string
    desc: string
  }

  // 清单视图 - 继承基础实体
  export interface ChecklistView extends BaseEntity {
    title: string
    content: string
    top: number
  }

  // 创建信息请求
  export interface CreateInfoReq {
    infoType: FlowEnums.InfoType
    linkId?: number
    isPublic: number
    content: string
    openid?: string
    imgList?: string[]
    detail?: string
  }

  // 创建信息响应
  export interface CreateInfoResp {
    infoId: number
  }

  // 获取信息请求
  export interface GetInfoReq {
    infoId: number
  }

  // 获取信息响应
  export interface GetInfoResp extends InfoView {}

  // 获取信息列表请求
  export interface GetInfoListReq {
    offset?: number
    size?: number
    startTime?: number
    infoType?: FlowEnums.InfoType
    openid?: string
    sortBy?: FlowEnums.SortBy
    isPublic?: number
  }

  // 获取信息列表响应
  export interface GetInfoListResp {
    offset: number
    size: number
    list: InfoView[]
    total: number
  }

  // 删除信息请求
  export interface DelInfoReq {
    infoId: number
  }

  // 更新信息请求
  export interface UpdateInfoReq {
    infoId: number
    linkId?: number
    isPublic?: number
    likeAction?: FlowEnums.LikeAction
    detail?: string
    content?: string
  }

  // 置顶信息请求
  export interface TopInfoReq {
    infoId: number
    top: boolean
  }

  // 更新信息草稿请求
  export interface UpdateInfoDraftReq {
    draftContent: string
  }

  // 获取信息草稿响应
  export interface GetInfoDraftResp {
    draftContent: string
  }

  // 创建评论请求
  export interface CreateCommentReq {
    infoId: number
    content: string
    openid?: string
  }

  // 创建评论响应
  export interface CreateCommentResp {
    commentId: number
  }

  // 获取评论列表请求
  export interface GetCommentListReq {
    offset?: number
    size?: number
    infoId: number
  }

  // 获取评论列表响应
  export interface GetCommentListResp {
    offset: number
    size: number
    list: CommentView[]
    total: number
  }

  // 删除评论请求
  export interface DelCommentReq {
    commentId: number
  }

  // 获取链接请求
  export interface GetLinkReq {
    linkId: number
  }

  // 获取链接响应
  export interface GetLinkResp extends LinkView {}

  // 创建链接请求
  export interface CreateLinkReq {
    link: string
    linkTitle?: string
    desc?: string
  }

  // 创建链接响应
  export interface CreateLinkResp {
    linkId: number
  }

  // 更新链接请求
  export interface UpdateLinkReq {
    id: number
    link: string
    linkTitle?: string
    desc?: string
  }

  // 删除链接请求
  export interface DelLinkReq {
    linkId: number
  }

  // 获取链接列表请求
  export interface ListLinkReq {
    offset?: number
    size?: number
  }

  // 获取链接列表响应
  export interface ListLinkResp {
    offset: number
    size: number
    list: LinkView[]
    total: number
  }

  // 获取清单请求
  export interface GetChecklistReq {
    id: number
  }

  // 获取清单响应
  export interface GetChecklistResp extends ChecklistView {}

  // 创建清单请求
  export interface CreateChecklistReq {
    title: string
    content: string
  }

  // 创建清单响应
  export interface CreateChecklistResp {}

  // 获取清单列表请求
  export interface GetChecklistListReq {
    offset?: number
    size?: number
  }

  // 获取清单列表响应
  export interface GetChecklistListResp {
    offset: number
    size: number
    list: ChecklistView[]
    total: number
  }

  // 更新清单请求
  export interface UpdateChecklistReq {
    id: number
    title?: string
    content?: string
  }

  // 更新清单响应
  export interface UpdateChecklistResp {}

  // 删除清单请求
  export interface DelChecklistReq {
    id: number
  }

  // 删除清单响应
  export interface DelChecklistResp {}

  // 置顶清单请求
  export interface TopChecklistReq {
    id: number
    top: boolean
  }
}
