/**
 * 物品管理和提醒模块数据模型类型定义
 * 符合数据模型规范：统一时间戳、用户标识、枚举类型
 */

import { ItemManagementEnums } from '@/constants/enums'

// 基础实体接口 - 符合数据模型规范
export interface BaseEntity {
  id: number // 主键ID
  openid: string // 用户openid，必须字段
  createTime: number // 创建时间，秒级时间戳
  updateTime: number // 更新时间，秒级时间戳
}

// 物品对象接口 - 核心模型1
export interface Item extends BaseEntity {
  name: string // 物品名称
  category: ItemManagementEnums.ItemCategory // 分类枚举
  status: ItemManagementEnums.ItemStatus // 物品状态
  startTime: number // 开始时间（秒级时间戳）
  description: string // 物品描述
  logo?: string // 物品logo/图片URL（可选）
  price?: number // 当前价格（可选）
  remindTime: number // 提醒时间（秒级时间戳，0表示无提醒）
  remindContent: string // 提醒内容
  top: number // 置顶权重（0 表示未置顶，越大越靠前）
}

// 物品分类接口 - 简化版本，只包含基础字段
export interface ItemCategory {
  id: number
  name: string
  icon: string
  color: string
}
