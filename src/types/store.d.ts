// 状态管理相关类型声明

// 用户信息接口
declare interface UserInfo {
  openid: string
  nickName: string
  avatarUrl: string
  admin: number
  token?: string
}

// 系统信息接口
declare interface SystemInfo {
  wbbb: number
  linkMenu: any[]
  version: string
}

// 应用配置接口
declare interface AppConfig {
  env: string
  baseURL: string
  appName: string
  shareProfile: string
}

// 主题类型
declare type ThemeType = 'light' | 'dark' | 'auto'

// 主题配置接口
declare interface ThemeConfig {
  primaryColor: string
  backgroundColor: string
  textColor: string
  borderColor: string
}

// 信息流项目接口
declare interface FlowItem {
  id: string
  title: string
  content: string
  type: 'info' | 'link' | 'comment'
  createTime: string
  updateTime: string
  likeCount: number
  commentCount: number
  isLiked?: boolean
  isCollected?: boolean
}

// 评论接口
declare interface Comment {
  id: string
  content: string
  userId: string
  userName: string
  userAvatar: string
  createTime: string
  likeCount: number
  isLiked?: boolean
  replies?: Comment[]
}

// 链接接口
declare interface Link {
  id: string
  title: string
  url: string
  description: string
  icon?: string
  category: string
  createTime: string
  clickCount: number
}

// 日程计划接口
declare interface SchedulePlan {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  category: string
  tags: string[]
  createTime: string
  updateTime: string
}

// 奖励接口
declare interface Reward {
  id: string
  name: string
  description: string
  points: number
  icon: string
  isUnlocked: boolean
  unlockTime?: string
}

// 用户日程信息接口
declare interface UserScheduleInfo {
  userId: string
  totalPoints: number
  level: number
  streakDays: number
  lastCheckinDate: string
}

// 登录结果接口
declare interface LoginResult {
  success: boolean
  error?: any
}

// 签到结果接口
declare interface CheckinResult {
  success: boolean
  points?: number
  streakDays?: number
  message?: string
}

// 分页参数接口
declare interface PaginationParams {
  page: number
  pageSize: number
}

// 分页结果接口
declare interface PaginationResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
