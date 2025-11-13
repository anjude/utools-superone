/**
 * 组件相关类型定义
 */

/**
 * 步骤项组件 Props
 */
export interface StepItemProps {
  /** 步骤索引 */
  index: number
  /** 步骤内容 */
  content: string
  /** 步骤总结 */
  summary?: string
  /** 是否已完成 */
  isCompleted: boolean
  /** 是否已跳过 */
  isSkipped?: boolean
}

/**
 * 步骤项组件 Emits
 */
export interface StepItemEmits {
  /** 状态变更事件 */
  statusChange: [status: 'completed' | 'skipped' | 'pending']
  /** 点击事件 */
  click: [index: number]
}
