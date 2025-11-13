// 清单功能相关类型定义
// 遵循 data-model 规范：时间字段统一为秒级时间戳，包含 openid

import type { BaseEntity } from '@/types/plan'

// 清单检查项实体
export interface ChecklistItemEntity {
  id: number
  contentMd: string
}

// 清单实体
export interface ChecklistEntity extends BaseEntity {
  title: string
  items: ChecklistItemEntity[]
  top: number // 置顶权重
}

// 执行模式枚举 - 与 ChecklistEnums.ExecutionMode 保持一致
export enum ExecutionMode {
  Overview = 1,  // 执行
  Step = 2       // 分步执行
}

// 清单执行步骤实体
export interface ChecklistExecutionStepEntity {
  itemId: number
  summaryMd: string
  confirmTime?: number // 秒
  isSkipped?: boolean // 是否为跳过状态，默认为 false（完成状态）
}

// 清单执行记录实体
export interface ChecklistExecutionRecordEntity extends BaseEntity {
  checklistId: number
  mode: ExecutionMode
  overallSummaryMd?: string
  stepSummaries?: ChecklistExecutionStepEntity[]
  startTime: number // 秒
  finishTime?: number // 秒
  status: ChecklistExecutionStatus
}

// 清单执行状态枚举 - 与 ChecklistEnums.ExecutionStatus 保持一致
export enum ChecklistExecutionStatus {
  InProgress = 1,  // 进行中
  Completed = 2    // 已完成
}

// 清单编辑表单数据
export interface ChecklistEditForm {
  title: string
  items: ChecklistItemEntity[]
  top?: number // 置顶权重
}

// 清单执行表单数据
export interface ChecklistExecutionForm {
  checklistId: number
  mode: ExecutionMode
  overallSummaryMd?: string
  stepSummaries?: ChecklistExecutionStepEntity[]
  startTime: number
  finishTime?: number
  status: ChecklistExecutionStatus
}

// 清单搜索筛选条件
export interface ChecklistSearchFilter {
  keyword?: string
  dateRange?: {
    start: number
    end: number
  }
  executionMode?: ExecutionMode
}

// 清单模板
export interface ChecklistTemplate {
  id: string
  name: string
  description: string
  category: string
  items: ChecklistItemEntity[]
  tags: string[]
}

// 本地执行草稿数据
export interface ChecklistExecutionDraft {
  checklistId: number
  mode: ExecutionMode
  startTime: number
  completedSteps: number[]
  skippedSteps: number[]
  stepSummaries: { itemId: number; summary: string }[]
  overallSummary: string
}

