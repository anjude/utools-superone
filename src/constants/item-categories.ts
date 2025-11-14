/**
 * 物品分类常量配置
 * 系统写死的分类配置，不支持动态管理
 */

export interface ItemCategory {
  id: number
  name: string
  icon: string
  color: string
}

/**
 * 系统预定义的物品分类
 */
export const ITEM_CATEGORIES: readonly ItemCategory[] = [
  {
    id: 0,
    name: '默认分类',
    icon: 'cuIcon-tag',
    color: '#999999',
  },
  {
    id: 1,
    name: '电子产品',
    icon: 'cuIcon-mobile',
    color: '#007AFF',
  },
  {
    id: 2,
    name: '服装配饰',
    icon: 'cuIcon-clothes',
    color: '#34C759',
  },
  {
    id: 3,
    name: '家居用品',
    icon: 'cuIcon-home',
    color: '#FF9500',
  },
  {
    id: 4,
    name: '美妆护肤',
    icon: 'cuIcon-beauty',
    color: '#FF3B30',
  },
  {
    id: 5,
    name: '食品饮料',
    icon: 'cuIcon-food',
    color: '#AF52DE',
  },
  {
    id: 6,
    name: '运动健身',
    icon: 'cuIcon-sport',
    color: '#FF2D92',
  },
  {
    id: 7,
    name: '图书文具',
    icon: 'cuIcon-book',
    color: '#5AC8FA',
  },
  {
    id: 8,
    name: '汽车用品',
    icon: 'cuIcon-car',
    color: '#FFCC00',
  },
  {
    id: 9,
    name: '礼品玩具',
    icon: 'cuIcon-gift',
    color: '#FF6B6B',
  },
  {
    id: 10,
    name: '其他',
    icon: 'cuIcon-tag',
    color: '#4ECDC4',
  },
] as const

/**
 * 根据ID获取分类信息
 */
export function getCategoryById(id: number): ItemCategory | null {
  return ITEM_CATEGORIES.find(category => category.id === id) || null
}

/**
 * 根据名称获取分类信息
 */
export function getCategoryByName(name: string): ItemCategory | null {
  return ITEM_CATEGORIES.find(category => category.name === name) || null
}

/**
 * 获取所有分类列表
 */
export function getAllCategories(): readonly ItemCategory[] {
  return ITEM_CATEGORIES
}

/**
 * 获取分类选项（用于选择器）
 */
export function getCategoryOptions(): Array<{ label: string; value: number }> {
  return ITEM_CATEGORIES.map(category => ({
    label: category.name,
    value: category.id,
  }))
}
