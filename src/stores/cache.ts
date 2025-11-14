/**
 * 统一缓存键常量
 * 集中管理项目中所有缓存键，避免硬编码
 */
export const CACHE_KEYS = {
  // 应用级缓存
  SYSTEM_CONFIG: 'app_system_config',
  USER_INFO: 'app_user_info',
  TOKEN: 'token',

  // 业务缓存
  ITEMS_DATA: 'items_data',
  USER_OPENID: 'user_openid',
  NEED_REFRESH_ITEMS: 'need_refresh_items',

  // 清单执行缓存
  CHECKLIST_EXECUTION_DRAFT: 'checklist_execution_draft',
  HOME_ENTRY_CONFIG: 'home_entry_config',

  // 草稿数据
  CHECKLIST_DRAFT: 'checklist_draft_',

  // 计划管理缓存
  TASK_STATUS_FILTER: 'task_status_filter',

  // 签到相关缓存
  DAILY_CHECKIN: 'daily_checkin', // 存储日期字符串 YYYY-MM-DD

  // 用户引导
  GUIDE_SHOWN: 'user_guide_shown', // 标识是否已展示过用户引导
} as const
