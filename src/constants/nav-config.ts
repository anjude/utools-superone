/**
 * 模块导航配置
 * 统一管理各模块的导航项信息
 */

export interface NavItem {
  /** 路由名称 */
  name: string
  /** 显示标签 */
  label: string
  /** 图标类名 */
  icon: string
  /** 模块代码（对应 plugin.json 中的 code） */
  code: string
}

/**
 * 导航项配置列表
 */
export const navItems: readonly NavItem[] = [
  {
    name: 'TopicList',
    label: '主题日志',
    icon: 'iconfont icon-Checklist',
    code: 'topic',
  },
  {
    name: 'ChecklistList',
    label: '检查清单',
    icon: 'iconfont icon-task',
    code: 'checklist',
  },
  {
    name: 'PlanList',
    label: '近期任务',
    icon: 'iconfont icon-task',
    code: 'plan',
  },
  {
    name: 'StockList',
    label: '投资标的',
    icon: 'iconfont icon-pencil-fill',
    code: 'stock',
  },
] as const

/**
 * 根据路由名称获取导航项
 */
export function getNavItemByRouteName(routeName: string): NavItem | undefined {
  return navItems.find(item => item.name === routeName)
}

/**
 * 根据模块代码获取导航项
 */
export function getNavItemByCode(code: string): NavItem | undefined {
  return navItems.find(item => item.code === code)
}

