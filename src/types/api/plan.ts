// 计划管理相关接口类型定义
// 符合数据模型规范：统一时间字段、用户标识等

import type { BaseEntity } from '@/types/base';
import type { PaginationData } from './base';
import type { 
  RecentTask, 
  Goal, 
  KeyResult,
  RecentTaskForm,
  KeyResultForm,
  GoalForm
} from '@/types/plan';
import type { TaskEnums, OKREnums } from '@/types/plan';
import type { ScheduleEnums } from '@/types/enums';

// 计划API命名空间
export namespace PlanApi {

  // ==================== 近期任务接口 ====================

  // 获取近期任务列表请求 - 对齐后端GetRecentTaskListReq
  export interface GetRecentTaskListReq {
    keyword?: string
    offset?: number
    size?: number
    statusList?: TaskEnums.Status[]
    priority?: TaskEnums.Priority
  }

  // 获取近期任务列表响应
  export interface GetRecentTaskListResp extends PaginationData<RecentTask> {}

  // 获取近期任务详情请求
  export interface GetRecentTaskDetailReq {
    id: number
  }

  // 获取近期任务详情响应
  export interface GetRecentTaskDetailResp extends RecentTask {}

  // 创建近期任务请求 - 对齐后端CreateRecentTaskReq
  export interface CreateRecentTaskReq {
    title: string
    description: string
    priority: TaskEnums.Priority
    deadline?: number
  }

  // 创建近期任务响应
  export interface CreateRecentTaskResp extends RecentTask {}

  // 更新近期任务请求 - 对齐后端UpdateRecentTaskReq
  export interface UpdateRecentTaskReq {
    id: number
    title?: string
    description?: string
    status?: TaskEnums.Status
    priority?: TaskEnums.Priority
    deadline?: number
    top?: number
  }

  // 更新近期任务响应
  export interface UpdateRecentTaskResp extends RecentTask {}

  // 删除近期任务请求
  export interface DeleteRecentTaskReq {
    id: number
  }

  // 删除近期任务响应
  export interface DeleteRecentTaskResp {
    success: boolean
  }

  // ==================== 统一目标接口 ====================

  // 获取目标列表请求 - 对齐后端GetGoalListReq
  export interface GetGoalListReq {
    keyword?: string
    offset?: number
    size?: number
    year?: number
    quarter?: ScheduleEnums.Quarter // 使用枚举值，Annual=0表示年度目标，Q1-Q4表示季度目标
    type?: OKREnums.Type
    status?: OKREnums.Status
    priority?: OKREnums.Priority
  }

  // 获取目标列表响应
  export interface GetGoalListResp extends PaginationData<Goal> {}

  // 获取目标详情请求
  export interface GetGoalDetailReq {
    id: number
  }

  // 获取目标详情响应
  export interface GetGoalDetailResp extends Goal {}

  // 创建目标请求 - 对齐后端CreateGoalReq
  export interface CreateGoalReq {
    title: string
    description: string
    year: number
    quarter: ScheduleEnums.Quarter
    priority: OKREnums.Priority
    keyResults: KeyResultForm[]
    deadline?: number
  }

  // 创建目标响应
  export interface CreateGoalResp extends Goal {}

  // 更新目标请求 - 对齐后端UpdateGoalReq
  export interface UpdateGoalReq {
    id: number
    title?: string
    description?: string
    year?: number
    quarter?: ScheduleEnums.Quarter
    priority?: OKREnums.Priority
    keyResults?: KeyResultForm[]
    deadline?: number
    top?: number
  }

  // 更新目标响应
  export interface UpdateGoalResp extends Goal {}

  // 删除目标请求
  export interface DeleteGoalReq {
    id: number
  }

  // 删除目标响应
  export interface DeleteGoalResp {
    success: boolean
  }


}
