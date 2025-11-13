// 通用接口类型定义

// 通用API命名空间
export namespace CommonApi {
  // 热门数据平台
  export enum HotDataPlatform {
    ZhiHu = 1,    // 知乎
    WeiBo = 2,    // 微博
    BaiDu = 3,    // 百度
    XueQiu = 4    // 雪球
  }

  // 微信相关接口类型
  export interface WxAutoReplyReq {
    toUserName: string
    fromUserName: string
    createTime: number
    msgType: string
    event?: string
    eventKey?: string
    ticket?: string
    content?: string
    msgId?: number
    msgDataId?: number
    idx?: number
    picUrl?: string
    mediaId?: string
    format?: string
    thumbMediaId?: string
    locationX?: string
    locationY?: string
    scale?: string
    label?: string
    title?: string
    description?: string
    url?: string
  }

  export interface WxAutoReplyResp {
    toUserName: string
    fromUserName: string
    createTime: number
    msgType: string
    content: string
  }

  export interface WxUploadResp {
    url: string
  }

  export interface MpQrcodeReq {
    path: string
    scene: string
    checkPath?: boolean
    envVersion: string
  }

  export interface MpQrcodeResp {
    baseCode: string
  }

  export interface GetAccessTokenByIdSecretReq {
    appId: string
    appSecret: string
  }

  export interface GetAccessTokenByIdSecretResp {
    errcode: number
    errmsg: string
    accessToken: string
    expiresIn: number
  }

  export interface ClearQuotaReq {
    // 空请求
  }

  export interface ClearQuotaResp {
    // 空响应
  }

  // 系统相关接口类型
  export interface LinkMenu {
    name: string
    url: string
  }

  export interface SystemInfoView {
    linkMenu: LinkMenu[]
    redEnvelope: string
    wbbb?: number
    ivIntroduceLink: string
  }

  export interface UpdateSystemInfoReq {
    wbbb?: number
    linkMenuIndex?: number
    linkMenuName?: string
    linkMenuUrl?: string
  }

  // CSDN相关接口类型
  export interface CsdnCommentReq {
    prompt?: string
    userName?: string
    userToken?: string
    commentSuffix?: string
    openid?: string
    articleNum?: number
  }

  export interface GetCsdnConfigReq {
    // 空请求
  }

  export interface GetCsdnConfigResp {
    userName: string
    userToken: string
    commentPrompt: string
    commentSuffix: string
    hotArticleNum: number
  }

  export interface UpdateCsdnConfigReq {
    userName: string
    userToken: string
  }

  export interface TriggerCommentReq {
    // 空请求
  }

  // AI相关接口类型
  export interface AiReplyReq {
    question: string
    target?: number
    userId: string
  }

  export interface AiReplyResp {
    answer: string
  }

  export interface AiReplyMemoryErasureReq {
    userId: string
  }

  export interface AiReplyMemoryErasureResp {
    // 空响应
  }

  export interface AiWechatArticleReq {
    url: string
  }

  export interface AiWechatArticleResp {
    answer: string
    title: string
    originContent: string
  }

  // 网页解析相关接口类型
  export interface ParseWebViewReq {
    url: string
  }

  export interface ParseWebViewResp {
    url: string
    title: string
    content: string
  }

  // 热门数据相关接口类型
  export interface GetHotDataReq {
    lastXDay?: number
  }

  export interface HotDataView {
    platform: HotDataPlatform
    category: string
    title: string
    url: string
    description: string
    rank: number
    createTime: number
  }

  export interface GetHotDataResp {
    list: HotDataView[]
  }

  // Redis相关接口类型
  export interface GetFeRedisReq {
    redisKey: string
  }

  export interface GetFeRedisResp {
    redisKey: string
    redisValue: string
  }

  export interface SetFeRedisReq {
    redisKey: string
    redisValue: string
  }

  export interface DelFeRedisReq {
    redisKey: string
  }

  // 全局ID生成器
  export interface GenerateGlobalIdReq {
    /** 服务维度，如: account, order */
    service: string
    /** 功能模块维度，如: stats, item */
    module: string
    /** 实体名称维度，如: user, task */
    entity: string
    /** 可选，批量生成数量，默认为1 */
    count?: number
  }

  export interface GenerateGlobalIdResp {
    /** 单个ID（当 count 未提供或为1 时返回） */
    id?: number
    /** 批量ID列表（当 count > 1 时返回） */
    ids?: number[]
  }
}
