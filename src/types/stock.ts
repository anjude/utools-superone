import type { BaseEntity, BaseFormData } from '@/types/base'
import { StockEnums } from '@/constants/enums'

/**
 * 标的类型枚举（使用数字枚举）
 */
export type StockType = StockEnums.StockType

/**
 * 标的基础信息接口 - 符合数据模型规范
 */
export interface IStock extends BaseEntity {
  /** 标的名称 */
  name: string
  /** 标的代码 */
  code: string
  /** 标的类型 */
  type: StockType
  /** 市盈率 PE */
  pe?: number
  /** 市净率 PB */
  pb?: number
  /** 股息率 */
  dividendYield?: number
  /** 当前价格 */
  currentPrice?: number
  /** 关注价格（用户设定的关注价格） */
  watchPrice?: number
  /** 置顶权重，越大越靠前（0 表示未置顶） */
  top: number
}

/**
 * 标的创建/更新数据接口 - 符合数据模型规范
 */
export interface IStockFormData extends BaseFormData {
  /** 标的名称 */
  name: string
  /** 标的代码 */
  code: string
  /** 标的类型 */
  type: StockType
  /** 市盈率 PE */
  pe?: number
  /** 市净率 PB */
  pb?: number
  /** 股息率 */
  dividendYield?: number
  /** 当前价格 */
  currentPrice?: number
  /** 关注价格 */
  watchPrice?: number
  /** 置顶权重，越大越靠前（0 表示未置顶） */
  top: number
}

/**
 * 辅助类型定义
 */
export interface StockListItem {
  id: number
  openid?: string // 用户标识，用于权限判断
  name: string
  code: string
  type: StockType
  currentPrice?: number
  watchPrice?: number
  top: number
}

export interface StockMetrics {
  pe?: number
  pb?: number
  dividendYield?: number
  currentPrice?: number
  watchPrice?: number
  /** 置顶权重 */
  top?: number
}

/**
 * 类型守卫函数
 */
export const isStock = (obj: any): obj is IStock => {
  return obj && 
    typeof obj.id === 'number' &&
    typeof obj.openid === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.code === 'string' &&
    typeof obj.type === 'number' &&
    typeof obj.createTime === 'number' &&
    typeof obj.updateTime === 'number'
}

export const isStockFormData = (obj: any): obj is IStockFormData => {
  return obj &&
    typeof obj.name === 'string' &&
    typeof obj.code === 'string' &&
    typeof obj.type === 'number'
}

/**
 * 数据验证函数
 */
interface ValidateStockOptions {
  /**
   * 是否为部分字段验证
   * - `false`（默认）: 验证所有必填字段（用于创建场景）
   * - `true`: 仅验证提供的字段（用于更新/局部修改）
   */
  partial?: boolean
}

export function validateStock(data: IStockFormData): { valid: boolean; errors: string[] }
export function validateStock(
  data: Partial<IStockFormData>,
  options: ValidateStockOptions
): { valid: boolean; errors: string[] }
export function validateStock(
  data: Partial<IStockFormData>,
  options: ValidateStockOptions = {}
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const isPartial = options.partial ?? false

  if (!isPartial || 'name' in data) {
    if (!data.name?.trim()) {
      errors.push('标的名称不能为空')
    }
  }
  
  if (!isPartial || 'code' in data) {
    if (!data.code?.trim()) {
      errors.push('标的代码不能为空')
    }
  }
  
  if (!isPartial || 'type' in data) {
    if (data.type === undefined || !Object.values(StockEnums.StockType).includes(data.type)) {
      errors.push('标的类型无效')
    }
  }
  
  if (data.pe !== undefined && data.pe < 0) {
    errors.push('市盈率不能为负数')
  }
  
  if (data.pb !== undefined && data.pb < 0) {
    errors.push('市净率不能为负数')
  }
  
  if (data.dividendYield !== undefined && data.dividendYield < 0) {
    errors.push('股息率不能为负数')
  }
  
  if (data.currentPrice !== undefined && data.currentPrice <= 0) {
    errors.push('当前价格必须大于0')
  }
  
  if (data.watchPrice !== undefined && data.watchPrice <= 0) {
    errors.push('关注价格必须大于0')
  }
  
  return { valid: errors.length === 0, errors }
}
