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
  SELECTED_PLAN_STATUS_FILTER: 'selected_plan_status_filter', // 当前选中的任务状态筛选
  SELECTED_PLAN_TASK_ID: 'selected_plan_task_id', // 当前选中的任务ID

  // 签到相关缓存
  DAILY_CHECKIN: 'daily_checkin', // 存储日期字符串 YYYY-MM-DD

  // 用户引导
  GUIDE_SHOWN: 'user_guide_shown', // 标识是否已展示过用户引导

  // 主题管理缓存
  SELECTED_TOPIC_ID: 'selected_topic_id', // 当前选中的主题ID
  LOCAL_TOPICS: 'local_topics', // 本地存储的 topics 数组
  LOCAL_TOPIC_LOGS: 'local_topic_logs', // 本地存储的 topic logs 数组

  // 标的管理缓存
  SELECTED_STOCK_ID: 'selected_stock_id', // 当前选中的标的ID

  // 清单管理缓存
  SELECTED_CHECKLIST_ID: 'selected_checklist_id', // 当前选中的清单ID
  CHECKLIST_EXECUTION_PROGRESS: 'checklist_execution_progress_', // 清单执行进度缓存前缀（后接checklistId）
} as const
