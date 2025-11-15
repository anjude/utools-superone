<script lang="ts" setup>
import { computed } from 'vue'
import { marked } from 'marked'

interface Props {
  /** markdown 源码 */
  content: string
  /** 是否启用代码高亮 */
  highlight?: boolean
  /** 自定义样式类名 */
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  highlight: false,
  class: '',
})

// 配置 marked 选项
// marked 默认会转义 HTML，提供基本的安全防护
marked.setOptions({
  breaks: true,
  gfm: true,
  // 禁用 HTML 标签（更安全，但会限制功能）
  // 如果需要支持 HTML，可以考虑使用 DOMPurify
  // sanitize: false, // marked 新版本已移除 sanitize，需要手动处理
})

// 简单的 HTML 清理函数（移除 script 和危险属性）
function sanitizeHtml(html: string): string {
  // 移除 script 标签
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  // 移除 on* 事件处理器
  html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
  html = html.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
  // 移除 javascript: 协议
  html = html.replace(/javascript:/gi, '')
  return html
}

// 将 markdown 转换为 HTML
const htmlContent = computed(() => {
  if (!props.content || !props.content.trim()) {
    return ''
  }

  try {
    // 使用 marked 解析 markdown
    const html = marked.parse(props.content) as string
    // 进行基本的 HTML 清理
    return sanitizeHtml(html)
  } catch (error) {
    console.error('Markdown 解析失败:', error)
    return props.content
  }
})
</script>

<template>
  <div 
    class="markdown-viewer" 
    :class="[props.class]"
    v-html="htmlContent"
  />
</template>

<style lang="scss" scoped>
.markdown-viewer {
  line-height: 1.6;
  color: var(--text-color, #333);

  // 标题样式
  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin-top: 1em;
    margin-bottom: 0.5em;
    font-weight: 600;
    line-height: 1.25;
  }

  :deep(h1) {
    font-size: 2em;
    border-bottom: 1px solid var(--border-color, #eaecef);
    padding-bottom: 0.3em;
  }

  :deep(h2) {
    font-size: 1.5em;
    border-bottom: 1px solid var(--border-color, #eaecef);
    padding-bottom: 0.3em;
  }

  :deep(h3) {
    font-size: 1.25em;
  }

  :deep(h4) {
    font-size: 1em;
  }

  :deep(h5) {
    font-size: 0.875em;
  }

  :deep(h6) {
    font-size: 0.85em;
    color: var(--text-color-secondary, #666);
  }

  // 段落
  :deep(p) {
    margin: 0.5em 0;
  }

  // 列表
  :deep(ul),
  :deep(ol) {
    margin: 0.5em 0;
    padding-left: 2em;
  }

  // 有序列表：确保显示编号
  :deep(ol) {
    list-style-type: decimal;
    list-style-position: outside;
  }

  // 嵌套有序列表使用不同样式
  :deep(ol ol) {
    list-style-type: lower-alpha;
  }

  :deep(ol ol ol) {
    list-style-type: lower-roman;
  }

  // 无序列表：确保显示项目符号
  :deep(ul) {
    list-style-type: disc;
    list-style-position: outside;
  }

  :deep(ul ul) {
    list-style-type: circle;
  }

  :deep(ul ul ul) {
    list-style-type: square;
  }

  :deep(li) {
    margin: 0.25em 0;
    display: list-item; // 确保 li 作为列表项显示
  }

  // 复选框列表项：不显示编号或项目符号
  // 使用 :has() 选择器（现代浏览器支持）
  :deep(li:has(input[type="checkbox"])) {
    list-style: none;
    margin-left: 0;
    // 保持适当的缩进，但不显示列表标记
    padding-left: 0;
  }

  // 复选框列表的父容器也不显示列表样式，但保持缩进
  :deep(ul:has(li input[type="checkbox"])),
  :deep(ol:has(li input[type="checkbox"])) {
    list-style: none;
    // 复选框列表仍然需要一些左边距以保持视觉层次
    padding-left: 1.5em;
  }

  // 复选框样式
  :deep(input[type="checkbox"]) {
    margin-right: 0.5em;
    cursor: pointer;
    vertical-align: middle;
  }

  // 代码
  :deep(code) {
    padding: 0.2em 0.4em;
    margin: 0;
    font-size: 0.85em;
    background-color: var(--code-bg, rgba(175, 184, 193, 0.2));
    border-radius: 3px;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  }

  :deep(pre) {
    padding: 1em;
    overflow: auto;
    background-color: var(--code-block-bg, #f6f8fa);
    border-radius: 6px;
    line-height: 1.45;

    code {
      display: inline;
      padding: 0;
      margin: 0;
      overflow: visible;
      line-height: inherit;
      word-wrap: normal;
      background-color: transparent;
      border: 0;
    }
  }

  // 引用
  :deep(blockquote) {
    padding: 0 1em;
    color: var(--text-color-secondary, #6a737d);
    border-left: 0.25em solid var(--border-color, #dfe2e5);
    margin: 0.5em 0;
  }

  // 链接
  :deep(a) {
    color: var(--link-color, #0366d6);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  // 图片
  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
  }

  // 表格
  :deep(table) {
    border-collapse: collapse;
    margin: 0.5em 0;
    width: 100%;

    th,
    td {
      padding: 0.5em 1em;
      border: 1px solid var(--border-color, #dfe2e5);
    }

    th {
      background-color: var(--table-header-bg, #f6f8fa);
      font-weight: 600;
    }
  }

  // 分割线
  :deep(hr) {
    height: 0.25em;
    padding: 0;
    margin: 1.5em 0;
    background-color: var(--border-color, #e1e4e8);
    border: 0;
  }

  // 强调
  :deep(strong) {
    font-weight: 600;
  }

  :deep(em) {
    font-style: italic;
  }

  :deep(del) {
    text-decoration: line-through;
  }
}
</style>
