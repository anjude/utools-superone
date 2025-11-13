/**
 * 基础实体接口
 * 所有业务数据实体必须继承此接口
 */
export interface BaseEntity {
  /** 主键ID，使用 src/utils/id-generator.ts 生成 */
  id: number
  /** 用户标识，所有业务数据必须有此字段 */
  openid: string
  /** 创建时间（秒级时间戳，UTC时间） */
  createTime: number
  /** 更新时间（秒级时间戳，UTC时间） */
  updateTime: number
}

/**
 * 基础表单数据接口
 * 用于创建/更新操作，不包含系统字段
 */
export interface BaseFormData {
  // 子接口可以扩展具体字段
}

/**
 * 数据验证结果接口
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean
  /** 错误信息列表 */
  errors: string[]
}

/**
 * 分页查询参数接口
 */
export interface PaginationParams {
  /** 偏移量 */
  offset: number
  /** 每页大小 */
  size: number
}

/**
 * 分页响应数据接口
 */
export interface PaginationData<T = any> {
  /** 数据列表 */
  list: T[]
  /** 总数量 */
  total: number
  /** 偏移量 */
  offset: number
  /** 每页大小 */
  size: number
}
