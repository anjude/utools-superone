/**
 * 计划管理相关类型定义
 * 符合数据模型规范：统一时间字段、用户标识等
 */

import { ScheduleEnums } from '@/constants/enums';

// 基础实体接口 - 包含通用字段
export interface BaseEntity {
  id: number
  openid: string
  createTime: number // 创建时间，Unix时间戳
  updateTime: number // 更新时间，Unix时间戳
}

// 基础目标接口 - 继承基础实体
export interface BaseGoal extends BaseEntity {
  title: string
  description: string
}

// 统一目标接口 - 对齐后端GoalDetail
export interface Goal extends BaseEntity {
  title: string
  description: string
  year: number
  quarter?: ScheduleEnums.Quarter // 季度（年度目标时省略）
  status: OKREnums.Status
  priority: OKREnums.Priority
  type: OKREnums.Type
  deadline?: number // 截止日期，Unix时间戳
  keyResults: KeyResult[] // 关键结果
  top: number // 置顶权重
}

// 类型守卫函数
export function isAnnualGoal(goal: Goal): goal is Goal & { type: OKREnums.Type.Annual } {
  return goal.type === OKREnums.Type.Annual
}

export function isQuarterlyGoal(goal: Goal): goal is Goal & { quarter: ScheduleEnums.Quarter } {
  return goal.type === OKREnums.Type.Quarterly && goal.quarter !== undefined
}


// 任务优先级枚举 - 对齐后端常量
export namespace TaskEnums {
  export enum Priority {
    Low = 1,      // 低优先级
    Medium = 2,   // 中优先级
    High = 3      // 高优先级
  }

  export enum Status {
    Pending = 1,      // 待处理
    InProgress = 2,   // 进行中
    Completed = 3,    // 已完成
    Cancelled = 4     // 已取消
  }
}

// 基础任务接口 - 继承基础实体
export interface BaseTask extends BaseEntity {
  title: string
  description: string
  priority: TaskEnums.Priority
  status: TaskEnums.Status
  completed: boolean
}

// 近期任务 - 对齐后端RecentTaskDetail
export interface RecentTask extends BaseEntity {
  title: string
  description: string
  status: TaskEnums.Status
  priority: TaskEnums.Priority
  deadline?: number // 截止日期，Unix时间戳
  completed: boolean // 是否已完成
  top: number // 置顶权重
}


// 统一目标表单数据 - 对齐后端CreateGoalReq
export interface GoalForm {
  title: string
  description: string
  year: number
  quarter: ScheduleEnums.Quarter // 使用枚举值，Annual=0表示年度目标
  priority: OKREnums.Priority // 优先级
  keyResults: KeyResultForm[] // 关键结果
  deadline?: number // 截止日期，Unix时间戳
  top?: number // 置顶权重
}


export interface RecentTaskForm {
  title: string
  description: string
  priority: TaskEnums.Priority
  deadline?: number // 截止日期，Unix时间戳
  year?: number // 年份（可选，用于创建时的默认值）
  top?: number // 置顶权重
}

// API响应类型
export interface PlanApiResponse<T> {
  code: number
  message: string
  data: T
}

// 分页参数
export interface PaginationParams {
  offset: number
  size: number
}

// 分页响应
export interface PaginatedResponse<T> {
  list: T[]
  total: number
  offset: number
  size: number
}

// OKR相关类型定义

// 目标相关枚举 - 对齐后端常量
export namespace OKREnums {
  export enum Status {
    NotStarted = 1,    // 未开始
    InProgress = 2,    // 进行中
    Completed = 3,     // 已完成
    AtRisk = 4         // 有风险
  }

  export enum Priority {
    Low = 1,      // 低优先级
    Medium = 2,   // 中优先级
    High = 3      // 高优先级
  }

  export enum Type {
    Quarterly = 1,  // 季度目标
    Annual = 2      // 年度目标
  }
}

// Key Result（关键结果）- 对齐后端KeyResultDetail
export interface KeyResult {
  title: string
  description: string
  status: OKREnums.Status
  progress: number // 进度百分比 0-100
}

// KeyResult表单数据 - 对齐后端KeyResultForm
export interface KeyResultForm {
  title: string
  description: string
  status: OKREnums.Status
  progress: number // 进度百分比 0-100
}
