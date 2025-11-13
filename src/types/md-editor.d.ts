/**
 * Markdown编辑器组件类型定义
 */

export interface EditorFormats {
  /** 标题级别 */
  header?: number;
  /** 是否粗体 */
  bold?: boolean;
  /** 是否斜体 */
  italic?: boolean;
  /** 背景颜色 */
  backgroundColor?: string;
  /** 列表类型 */
  list?: 'ordered' | 'bullet' | 'check';
  /** 缩进级别 */
  indent?: string;
  /** 图片 */
  image?: boolean;
}

export interface EditorEvent {
  /** 事件详情 */
  detail: {
    /** 文本内容 */
    text?: string;
    /** 格式信息 */
    formats?: EditorFormats;
  };
}

export interface CuMdEditorProps {
  /** 初始HTML内容 */
  htmlContent?: string;
  /** 占位符文本 */
  placeholder?: string;
  /** 编辑器高度 */
  height?: string | number;
  /** 是否禁用 */
  disabled?: boolean;
}

export interface CuMdEditorEmits {
  /** 输入事件 */
  (event: 'input', value: string): void;
  /** 内容变化事件 */
  (event: 'change', value: string): void;
  /** 失焦事件 */
  (event: 'blur', value: string): void;
  /** 错误事件 */
  (event: 'error', error: string): void;
}

export interface CuMdEditorInstance {
  /** 获取内容 */
  getContent(): string;
  /** 设置内容 */
  setContent(content: string): void;
  /** 清空内容 */
  clear(): void;
  /** 聚焦 */
  focus(): void;
  /** 失焦 */
  blur(): void;
  /** 撤销 */
  undo(): void;
  /** 重做 */
  redo(): void;
  /** 重置内容 */
  resetContent(): void;
  /** 移除格式 */
  removeFormat(): void;
}
