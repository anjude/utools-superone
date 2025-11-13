// 基础API类型定义

// 通用响应格式
export interface ApiResponse<T = any> {
  errCode: number
  data: T
  msg: string
  detail: string
}

// 分页参数
export interface PaginationParams {
  offset: number
  size: number
}

// 分页响应数据
export interface PaginationData<T = any> {
  list: T[]
  total: number // 与后端int64保持一致，但TypeScript中仍使用number
  offset: number
  size: number
}
