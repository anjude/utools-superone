// 计划相关接口类型定义
// 符合数据模型规范：统一时间字段、用户标识等

import type { BaseEntity } from '@/types/plan';
import { ScheduleEnums } from '@/types/enums';

// 计划API命名空间
export namespace ScheduleApi {

  // 计划信息 - 继承基础实体
  export interface ScheduleInfo extends BaseEntity {
    title: string
    description: string
    scheduleType: ScheduleEnums.ScheduleType
    status: ScheduleEnums.ScheduleStatus
    startDate: number
    endDate: number
    targetValue: number
    currentValue: number
    unit: string
  }

  // 用户计划信息 - 继承基础实体
  export interface UserScheduleInfo extends BaseEntity {
    scheduleId: number
    progress: number
    lastCheckinTime: number
    checkinCount: number
    totalCheckinDays: number
    streakDays: number
    maxStreakDays: number
  }

  // 签到记录 - 继承基础实体
  export interface CheckinRecord extends BaseEntity {
    scheduleId: number
    checkinDate: number
    checkinTime: number
    status: ScheduleEnums.CheckinStatus
    points: number
    remark: string
  }

  // 奖励信息 - 继承基础实体
  export interface RewardInfo extends BaseEntity {
    scheduleId: number
    name: string
    description: string
    rewardType: ScheduleEnums.RewardType
    rewardValue: number
    condition: number
    isClaimed: boolean
    claimTime?: number
  }

  // 奖励历史 - 继承基础实体
  export interface RewardHistory extends BaseEntity {
    scheduleId: number
    rewardId: number
    rewardName: string
    rewardType: ScheduleEnums.RewardType
    rewardValue: number
    claimTime: number
  }

  // 获取计划列表请求
  export interface GetScheduleListReq {
    offset?: number
    size?: number
    userId?: string
    status?: ScheduleEnums.ScheduleStatus
    scheduleType?: ScheduleEnums.ScheduleType
    keyword?: string
  }

  // 获取计划列表响应
  export interface GetScheduleListResp {
    list: ScheduleInfo[]
    total: number
  }

  // 获取计划详情请求
  export interface GetScheduleDetailReq {
    id: number
  }

  // 获取计划详情响应
  export interface GetScheduleDetailResp {
    schedule: ScheduleInfo
    userInfo?: UserScheduleInfo
  }

  // 创建计划请求
  export interface CreateScheduleReq {
    title: string
    description: string
    scheduleType: ScheduleEnums.ScheduleType
    startDate: number
    endDate: number
    targetValue: number
    unit: string
  }

  // 创建计划响应
  export interface CreateScheduleResp {
    id: number
  }

  // 更新计划请求
  export interface UpdateScheduleReq {
    id: number
    title?: string
    description?: string
    status?: ScheduleEnums.ScheduleStatus
    endDate?: number
    targetValue?: number
    unit?: string
  }

  // 删除计划请求
  export interface DeleteScheduleReq {
    id: number
  }

  // 获取用户计划信息请求
  export interface GetUserScheduleInfoReq {
    scheduleId: number
  }

  // 获取用户计划信息响应
  export interface GetUserScheduleInfoResp {
    userInfo: UserScheduleInfo
  }

  // 用户签到请求
  export interface UserCheckinReq {
    scheduleId: number
    remark?: string
  }

  // 用户签到响应
  export interface UserCheckinResp {
    checkinId: number
    points: number
    streakDays: number
    message: string
  }

  // 获取签到记录请求
  export interface GetCheckinRecordsReq {
    offset?: number
    size?: number
    scheduleId: number
    userId?: string
    startDate?: number
    endDate?: number
  }

  // 获取签到记录响应
  export interface GetCheckinRecordsResp {
    list: CheckinRecord[]
    total: number
  }

  // 获取奖励列表请求
  export interface GetRewardListReq {
    offset?: number
    size?: number
    scheduleId: number
    isClaimed?: boolean
  }

  // 获取奖励列表响应
  export interface GetRewardListResp {
    list: RewardInfo[]
    total: number
  }

  // 获取奖励历史请求
  export interface GetRewardHistoryReq {
    offset?: number
    size?: number
    scheduleId?: number
    userId?: string
    rewardType?: ScheduleEnums.RewardType
  }

  // 获取奖励历史响应
  export interface GetRewardHistoryResp {
    list: RewardHistory[]
    total: number
  }

  // 领取奖励请求
  export interface ClaimRewardReq {
    rewardId: number
  }

  // 领取奖励响应
  export interface ClaimRewardResp {
    rewardId: number
    message: string
  }

  // 获取周签到统计请求
  export interface GetWeeklyCheckinStatsReq {
    year: number
    week: number
    userId?: string
  }

  // 获取周签到统计响应
  export interface GetWeeklyCheckinStatsResp {
    year: number
    week: number
    totalCheckins: number
    totalUsers: number
    topUsers: Array<{
      userId: string
      nickName: string
      checkinCount: number
      streakDays: number
    }>
  }
}
