// 标的和思考记录相关接口类型定义
// 符合数据模型规范：统一时间字段、用户标识等

import type { PaginationData } from './base';
import type { IStock, IStockFormData, StockType } from '@/types/stock';

// 标的API命名空间
export namespace StockApi {

  // ==================== 标的管理接口 ====================

  // 获取标的列表请求
  export interface GetStockListReq {
    offset?: number
    size: number
    type?: StockType
    keyword?: string
  }

  // 获取标的列表响应
  export interface GetStockListResp {
    offset: number
    size: number
    list: IStock[]
    total: number
  }

  // 获取标的详情请求
  export interface GetStockDetailReq {
    stockId: number
  }

  // 获取标的详情响应
  export interface GetStockDetailResp {
    stock: IStock
  }

  // 创建标的请求
  export interface CreateStockReq extends IStockFormData {}

  // 创建标的响应
  export interface CreateStockResp {
    stockId: number
  }

  // 更新标的请求（部分更新，只有传递的字段才更新）
  export interface UpdateStockReq {
    stockId: number
    name?: string
    code?: string
    type?: StockType
    pe?: number
    pb?: number
    dividendYield?: number
    currentPrice?: number
    watchPrice?: number
    top?: number
  }

  // 更新标的响应
  export interface UpdateStockResp {
    success: boolean
  }

  // 删除标的请求
  export interface DeleteStockReq {
    stockId: number
  }

  // 删除标的响应
  export interface DeleteStockResp {
    success: boolean
  }

}