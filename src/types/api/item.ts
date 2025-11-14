// 物品管理相关接口类型定义
// 与真实后端接口定义完全一致

import type { BaseEntity } from '@/types/base'
import type { PaginationData } from './base'
import type { Item, ItemCategory } from '@/types/item-management'
import type { ItemManagementEnums } from '@/constants/enums'

// 物品管理API命名空间
export namespace ItemApi {
  // 获取物品列表请求 - 与后端GetItemListReq一致
  export interface GetItemListReq {
    offset?: number // 偏移量
    size?: number // 每页数量
    keyword?: string // 关键词搜索
    category?: ItemManagementEnums.ItemCategory // 分类筛选
    status?: ItemManagementEnums.ItemStatus // 状态筛选
  }

  // 获取物品列表响应 - 与后端GetItemListResp一致
  export interface GetItemListResp {
    offset: number // 偏移量
    size: number // 每页数量
    total: number // 总数量
    list: Item[] // 物品列表
  }

  // 获取物品详情请求 - 与后端GetItemDetailReq一致
  export interface GetItemDetailReq {
    id: number // 物品ID
  }

  // 获取物品详情响应 - 与后端GetItemDetailResp一致
  export interface GetItemDetailResp extends Item {}

  // 创建物品请求 - 与后端CreateItemReq一致
  export interface CreateItemReq {
    name: string // 物品名称
    category: ItemManagementEnums.ItemCategory // 分类
    status: ItemManagementEnums.ItemStatus // 状态
    startTime: number // 开始时间
    description: string // 描述
    logo?: string // Logo
    price?: number // 价格
    remindTime: number // 提醒时间（0表示无提醒）
    remindContent: string // 提醒内容
  }

  // 创建物品响应 - 与后端CreateItemResp一致
  export interface CreateItemResp extends Item {}

  // 更新物品请求 - 与后端UpdateItemReq一致（支持部分更新）
  export interface UpdateItemReq {
    id: number // 物品ID
    name?: string // 物品名称
    category?: ItemManagementEnums.ItemCategory // 分类
    status?: ItemManagementEnums.ItemStatus // 状态
    startTime?: number // 开始时间
    description?: string // 描述
    logo?: string // Logo
    price?: number // 价格
    remindTime?: number // 提醒时间（0表示无提醒）
    remindContent?: string // 提醒内容
    top?: number // 置顶权重（0 表示不置顶）
  }

  // 更新物品响应 - 与后端UpdateItemResp一致
  export interface UpdateItemResp extends Item {}

  // 删除物品请求 - 与后端DeleteItemReq一致
  export interface DeleteItemReq {
    id: number // 物品ID
  }

  // 删除物品响应 - 与后端DeleteItemResp一致
  export interface DeleteItemResp {
    success: boolean // 是否成功
  }

  // 更新物品状态请求 - 与后端UpdateItemStatusReq一致
  export interface UpdateItemStatusReq {
    id: number // 物品ID
    status: ItemManagementEnums.ItemStatus // 新状态
  }

  // 更新物品状态响应 - 与后端UpdateItemStatusResp一致
  export interface UpdateItemStatusResp extends Item {}

  // 获取物品分类列表请求 - 与后端GetItemCategoryListReq一致
  export interface GetItemCategoryListReq {
    // 空请求参数
  }

  // 获取物品分类列表响应 - 与后端GetItemCategoryListResp一致
  export interface GetItemCategoryListResp {
    list: ItemCategory[] // 分类列表
  }
}
