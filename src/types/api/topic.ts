// 主题相关接口类型定义
// 符合数据模型规范：统一时间字段、用户标识等

import type { BaseEntity } from '@/types/base'
import type { PaginationData } from './base'
import type {
  ITopic,
  ITopicLog,
  ITopicFormData,
  ITopicLogFormData,
  TopicListItem,
  TopicLogListItem,
  TopicType,
  TopicLogExtraData,
  TopicLogMark,
} from '@/types/topic'

// 主题API命名空间
export namespace TopicApi {
  // 获取主题列表请求
  export interface GetTopicListReq {
    offset?: number
    size?: number
    keyword?: string
  }

  // 获取主题列表响应
  export interface GetTopicListResp extends PaginationData<TopicListItem> {}

  // 获取主题详情请求
  export interface GetTopicDetailReq {
    id: number
  }

  // 获取主题详情响应
  export interface GetTopicDetailResp extends ITopic {}

  // 创建主题请求
  export interface CreateTopicReq extends ITopicFormData {}

  // 创建主题响应
  export interface CreateTopicResp extends ITopic {}

  // 更新主题请求
  export interface UpdateTopicReq extends ITopicFormData {
    id: number
  }

  // 更新主题响应
  export interface UpdateTopicResp extends ITopic {}

  // 删除主题请求
  export interface DeleteTopicReq {
    id: number
  }

  // 删除主题响应
  export interface DeleteTopicResp {
    // 空响应
  }

  // 获取主题日志列表请求
  export interface GetTopicLogListReq {
    topicIds: number[] // 必填，至少1个
    topicTypes: TopicType[] // 必填，至少1个
    offset?: number
    size?: number
  }

  // 获取主题日志列表响应
  export interface GetTopicLogListResp extends PaginationData<TopicLogListItem> {}

  // 获取主题日志详情请求
  export interface GetTopicLogDetailReq {
    id: number
  }

  // 获取主题日志详情响应
  export interface GetTopicLogDetailResp extends ITopicLog {}

  // 创建主题日志请求
  export interface CreateTopicLogReq extends ITopicLogFormData {}

  // 创建主题日志响应
  export interface CreateTopicLogResp extends ITopicLog {}

  // 更新主题日志请求（部分更新，只有传递的字段才更新）
  export interface UpdateTopicLogReq {
    id: number
    content?: string
    extraData?: TopicLogExtraData
    mark?: TopicLogMark
  }

  // 更新主题日志响应
  export interface UpdateTopicLogResp extends ITopicLog {}

  // 删除主题日志请求
  export interface DeleteTopicLogReq {
    id: number
  }

  // 删除主题日志响应
  export interface DeleteTopicLogResp {
    // 空响应
  }
}
