import type { BaseEntity, BaseFormData } from '@/types/base'
import { TopicEnums } from '@/constants/enums'

/**
 * 主题类型枚举
 */
export type TopicType = TopicEnums.TopicType

/**
 * 主题日志标记位类型
 */
export type TopicLogMark = TopicEnums.TopicLogMark

/**
 * 主题实体接口 - 符合数据模型规范
 */
export interface ITopic extends BaseEntity {
  /** 主题名称 */
  topicName: string
  /** 主题描述（可选，支持 Markdown 格式） */
  description?: string
  /** 置顶权重，越大越靠前（0 表示未置顶） */
  top: number
}

/**
 * 主题日志扩展数据接口
 */
export interface TopicLogExtraData {
  /** 反馈答案 */
  feedbackAnswer?: string
}

/**
 * 主题日志接口 - 与主题实体1:N关系，符合数据模型规范
 */
export interface ITopicLog extends BaseEntity {
  /** 主题类型 */
  topicType: TopicType
  /** 用户ID */
  openid: string
  /** 主题ID */
  topicId: number
  /** 日志内容（Markdown格式） */
  content: string
  /** 扩展数据 */
  extraData?: TopicLogExtraData
  /** 标记位（默认值为 0） */
  mark: TopicLogMark
}

/**
 * 主题创建/更新数据接口 - 符合数据模型规范
 */
export interface ITopicFormData extends BaseFormData {
  /** 主题名称 */
  topicName?: string // 改为可选，支持部分更新
  /** 主题描述（可选，支持 Markdown 格式） */
  description?: string
  /** 置顶权重，仅用于部分更新 */
  top?: number
}

/**
 * 主题日志创建/更新数据接口 - 符合数据模型规范
 */
export interface ITopicLogFormData extends BaseFormData {
  /** 主题类型 */
  topicType: TopicType
  /** 主题ID */
  topicId: number
  /** 日志内容 */
  content: string
  /** 扩展数据 */
  extraData?: TopicLogExtraData
  /** 标记位（可选，创建时可不传，后端使用默认值 0） */
  mark?: TopicLogMark
}

/**
 * 辅助类型定义
 */
export interface TopicListItem {
  id: number
  openid?: string // 用户标识，用于权限判断
  topicName: string
  description: string
  createTime: number // 新增：创建时间戳
  updateTime: number // 新增：更新时间戳
  top: number
}

export interface TopicLogListItem {
  id: number
  topicType: TopicType
  topicId: number
  content: string
  createTime: number
  updateTime: number
  preview: string
  extraData?: TopicLogExtraData
  openid?: string // 用户标识，用于权限判断
  mark: TopicLogMark // 标记位（默认值为 0）
}

/**
 * 类型守卫函数
 */
export const isTopic = (obj: any): obj is ITopic => {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.openid === 'string' &&
    typeof obj.topicName === 'string' &&
    (obj.description === undefined || typeof obj.description === 'string') &&
    typeof obj.top === 'number' &&
    typeof obj.createTime === 'number' &&
    typeof obj.updateTime === 'number'
  )
}

export const isTopicLog = (obj: any): obj is ITopicLog => {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.openid === 'string' &&
    typeof obj.topicType === 'number' &&
    typeof obj.topicId === 'number' &&
    typeof obj.content === 'string' &&
    typeof obj.createTime === 'number' &&
    typeof obj.updateTime === 'number' &&
    typeof obj.mark === 'number' &&
    (obj.extraData === undefined || (typeof obj.extraData === 'object' && obj.extraData !== null))
  )
}

export const isTopicFormData = (obj: any): obj is ITopicFormData => {
  return (
    obj &&
    typeof obj.topicName === 'string' &&
    (obj.description === undefined || typeof obj.description === 'string')
  )
}

export const isTopicLogFormData = (obj: any): obj is ITopicLogFormData => {
  return (
    obj &&
    typeof obj.topicType === 'number' &&
    typeof obj.topicId === 'number' &&
    typeof obj.content === 'string'
  )
}

/**
 * 数据验证函数
 */
export const validateTopic = (data: ITopicFormData): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (Object.prototype.hasOwnProperty.call(data, 'topicName')) {
    if (!data.topicName?.trim()) {
      errors.push('主题名称不能为空')
    }
    if (data.topicName && data.topicName.length > 50) {
      errors.push('主题名称不能超过50个字符')
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(data, 'description') &&
    data.description &&
    data.description.length > 2000
  ) {
    errors.push('主题描述不能超过2000个字符')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * 主题日志数据验证函数
 */
export const validateTopicLog = (data: ITopicLogFormData): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!data.topicType || !Object.values(TopicEnums.TopicType).includes(data.topicType)) {
    errors.push('主题类型无效')
  }

  if (!data.topicId || data.topicId <= 0) {
    errors.push('主题ID无效')
  }

  if (!data.content?.trim()) {
    errors.push('日志内容不能为空')
  }

  return { valid: errors.length === 0, errors }
}
