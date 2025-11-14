// 清单相关接口类型定义
// 符合数据模型规范：统一时间字段、用户标识等

import type { BaseEntity } from '@/types/base'
import type { PaginationData } from './base'
import type {
  ChecklistEntity,
  ChecklistItemEntity,
  ChecklistExecutionRecordEntity,
  ChecklistExecutionStepEntity,
  ChecklistEditForm,
  ChecklistExecutionForm,
  ChecklistSearchFilter,
  ExecutionMode,
} from '../checklist'

// 清单API命名空间
export namespace ChecklistApi {
  // 获取清单列表请求
  export interface GetChecklistListReq {
    offset?: number
    size?: number
    keyword?: string
  }

  // 获取清单列表响应
  export interface GetChecklistListResp extends PaginationData<ChecklistEntity> {}

  // 获取清单详情请求
  export interface GetChecklistDetailReq {
    id: number
  }

  // 获取清单详情响应
  export interface GetChecklistDetailResp extends ChecklistEntity {}

  // 创建清单请求
  export interface CreateChecklistReq extends ChecklistEditForm {}

  // 创建清单响应
  export interface CreateChecklistResp extends ChecklistEntity {}

  // 更新清单请求
  export interface UpdateChecklistReq extends ChecklistEditForm {
    id: number
    top?: number
  }

  // 更新清单响应
  export interface UpdateChecklistResp extends ChecklistEntity {}

  // 删除清单请求
  export interface DeleteChecklistReq {
    id: number
  }

  // 删除清单响应
  export interface DeleteChecklistResp {
    // 空响应
  }

  // 获取清单执行记录列表请求
  export interface GetExecutionListReq {
    checklistId?: number
    offset?: number
    size?: number
    status?: 0 | 1 // 0=in_progress,1=completed
  }

  // 获取清单执行记录列表响应
  export interface GetExecutionListResp extends PaginationData<ChecklistExecutionRecordEntity> {}

  // 获取清单执行记录详情请求
  export interface GetExecutionDetailReq {
    id: number
  }

  // 获取清单执行记录详情响应
  export interface GetExecutionDetailResp extends ChecklistExecutionRecordEntity {}

  // 创建清单执行记录请求
  export interface CreateExecutionReq extends ChecklistExecutionForm {}

  // 创建清单执行记录响应
  export interface CreateExecutionResp extends ChecklistExecutionRecordEntity {}

  // 更新清单执行记录请求
  export interface UpdateExecutionReq extends ChecklistExecutionForm {
    id: number
  }

  // 更新清单执行记录响应
  export interface UpdateExecutionResp extends ChecklistExecutionRecordEntity {}

  // 删除清单执行记录请求
  export interface DeleteExecutionReq {
    id: number
  }

  // 删除清单执行记录响应
  export interface DeleteExecutionResp {
    // 空响应
  }

  // 搜索清单请求
  export interface SearchChecklistsReq {
    keyword: string
    offset?: number
    size?: number
  }

  // 搜索清单响应
  export interface SearchChecklistsResp extends PaginationData<ChecklistEntity> {}

  // 获取清单执行历史请求
  export interface GetExecutionHistoryReq {
    checklistId: number
    offset?: number
    size?: number
    startTime?: number
    endTime?: number
  }

  // 获取清单执行历史响应
  export interface GetExecutionHistoryResp extends PaginationData<ChecklistExecutionRecordEntity> {}
}
