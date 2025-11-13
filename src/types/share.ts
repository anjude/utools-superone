// 分享功能类型定义

export interface ShareContent {
  /** 分享标题 */
  title: string
  /** 分享描述 */
  description?: string
  /** 分享链接 */
  url?: string
  /** 分享图片URL */
  imageUrl?: string
  /** 分享类型 */
  type: ShareType
}

export interface ShareOptions {
  /** 分享内容 */
  content: ShareContent
  /** 分享方式 */
  method: ShareMethod
  /** 是否显示分享弹窗 */
  showPopup?: boolean
}

export type ShareType = 
  | 'checklist-summary'  // 清单总结
  | 'checklist-execution' // 清单执行
  | 'checklist-template' // 清单模板
  | 'general' // 通用分享

export type ShareMethod = 
  | 'wechat' // 微信分享
  | 'copy-link' // 复制链接
  | 'save-image' // 保存图片
  | 'system' // 系统分享

export interface ShareResult {
  success: boolean
  method: ShareMethod
  message?: string
  error?: string
}

export interface SharePlatform {
  /** 平台名称 */
  name: string
  /** 平台图标 */
  icon: string
  /** 是否可用 */
  available: boolean
  /** 分享方法 */
  method: ShareMethod
}

export interface ShareImageOptions {
  /** 图片宽度 */
  width: number
  /** 图片高度 */
  height: number
  /** 背景色 */
  backgroundColor?: string
  /** 文字颜色 */
  textColor?: string
  /** 是否包含二维码 */
  includeQRCode?: boolean
}
