/**
 * Markdown工具类
 * 提供HTML和Markdown双向转换功能
 */

// 导入第三方库
import { marked } from 'marked'

/**
 * 转换选项接口
 */
export interface MarkdownOptions {
  // HTML到Markdown选项
  headingStyle?: 'atx' | 'setext'
  codeBlockStyle?: 'fenced' | 'indented'
  bulletListMarker?: '-' | '+' | '*'
  emDelimiter?: '*' | '_'
  strongDelimiter?: '**' | '__'

  // Markdown到HTML选项
  breaks?: boolean
  gfm?: boolean
}

/**
 * 处理缩进的通用函数
 * @param content 内容
 * @param indentLevel 缩进级别
 * @returns 处理后的内容
 */
function applyIndent(content: string, indentLevel: number): string {
  const indent = '  '.repeat(indentLevel)
  return content
    .split('\n')
    .map((line: string) => {
      const trimmedLine = line.trim()
      return trimmedLine ? `${indent}${trimmedLine}` : ''
    })
    .filter(line => line !== '')
    .join('\n')
}

/**
 * 提取缩进级别的通用函数
 * @param element HTML元素字符串
 * @returns 缩进级别，如果没有缩进则返回0
 */
function extractIndentLevel(element: string): number {
  // 检查Quill编辑器的缩进类
  const qlIndentMatch = element.match(/class="[^"]*ql-indent-(\d+)[^"]*"/)
  if (qlIndentMatch) {
    return parseInt(qlIndentMatch[1])
  }

  // 检查style中的text-indent
  const textIndentMatch = element.match(/style="[^"]*text-indent:\s*(\d+)(?:px|em|rem)?[^"]*"/)
  if (textIndentMatch) {
    return parseInt(textIndentMatch[1])
  }

  // 检查margin-left
  const marginLeftMatch = element.match(/style="[^"]*margin-left:\s*(\d+)(?:px|em|rem)?[^"]*"/)
  if (marginLeftMatch) {
    return parseInt(marginLeftMatch[1]) / 20 // 假设20px对应一个缩进级别
  }

  return 0
}

/**
 * HTML到Markdown转换函数
 * 使用自定义解析方法，确保缩进和特殊元素正确处理
 * @param html HTML字符串
 * @param options 转换选项
 * @returns 转换后的Markdown字符串
 */
export function htmlToMarkdown(html: string, options: MarkdownOptions = {}): string {
  if (!html || html.trim() === '') {
    return ''
  }

  try {
    // 默认配置
    const defaultOptions: Required<MarkdownOptions> = {
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
      emDelimiter: '*',
      strongDelimiter: '**',
      breaks: false,
      gfm: true,
    }

    const config = { ...defaultOptions, ...options }
    let markdown = html

    // 1. 处理多级标题 (h1-h6)
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
    markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')

    // 2. 处理粗体 (strong, b)
    markdown = markdown.replace(
      /<strong[^>]*>(.*?)<\/strong>/gi,
      `${config.strongDelimiter}$1${config.strongDelimiter}`
    )
    markdown = markdown.replace(
      /<b[^>]*>(.*?)<\/b>/gi,
      `${config.strongDelimiter}$1${config.strongDelimiter}`
    )

    // 3. 处理高亮 (mark标签和背景色)
    markdown = markdown.replace(/<mark[^>]*>(.*?)<\/mark>/gi, '==$1==')
    // 处理带有背景色的span标签
    markdown = markdown.replace(
      /<span[^>]*style="[^"]*background-color:[^"]*"[^>]*>(.*?)<\/span>/gi,
      '==$1=='
    )

    // 4. 处理有序列表 (ol)
    markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match: string, content: string) => {
      let index = 1
      return (
        content.replace(/<li[^>]*>(.*?)<\/li>/gi, (liMatch: string, liContent: string) => {
          // 检查是否有缩进类
          const indentMatch = liMatch.match(/class="[^"]*ql-indent-(\d+)[^"]*"/)
          if (indentMatch) {
            const level = parseInt(indentMatch[1])
            const indent = '  '.repeat(level)
            // 不同等级使用不同的编号格式
            const markers = ['1', 'a', 'i', 'A', 'I']
            const marker = markers[Math.min(level, markers.length - 1)]
            return `${indent}${marker}. ${liContent.trim()}\n`
          }
          return `${index++}. ${liContent.trim()}\n`
        }) + '\n'
      )
    })

    // 5. 处理无序列表 (ul)
    markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match: string, content: string) => {
      return (
        content.replace(/<li[^>]*>(.*?)<\/li>/gi, (liMatch: string, liContent: string) => {
          // 检查是否有缩进类
          const indentMatch = liMatch.match(/class="[^"]*ql-indent-(\d+)[^"]*"/)
          if (indentMatch) {
            const level = parseInt(indentMatch[1])
            const indent = '  '.repeat(level)
            // 不同等级使用不同的符号
            const markers = ['-', '+', '*', '•', '◦']
            const marker = markers[Math.min(level, markers.length - 1)]
            return `${indent}${marker} ${liContent.trim()}\n`
          }
          return `${config.bulletListMarker} ${liContent.trim()}\n`
        }) + '\n'
      )
    })

    // 6. 处理复选框 (input type="checkbox")
    markdown = markdown.replace(/<input[^>]*type="checkbox"[^>]*checked[^>]*>/gi, '- [x] ')
    markdown = markdown.replace(/<input[^>]*type="checkbox"[^>]*>/gi, '- [ ] ')

    // 7. 处理分割线 (hr)
    markdown = markdown.replace(/<hr[^>]*>/gi, '---\n\n')

    // 8. 处理图片 (img)
    markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)')
    markdown = markdown.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*>/gi, '![$1]($2)')
    markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)')

    // 处理其他常用元素

    // 斜体 (em, i)
    markdown = markdown.replace(
      /<em[^>]*>(.*?)<\/em>/gi,
      `${config.emDelimiter}$1${config.emDelimiter}`
    )
    markdown = markdown.replace(
      /<i[^>]*>(.*?)<\/i>/gi,
      `${config.emDelimiter}$1${config.emDelimiter}`
    )

    // 删除线 (del, s)
    markdown = markdown.replace(/<del[^>]*>(.*?)<\/del>/gi, '~~$1~~')
    markdown = markdown.replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~')

    // 代码 (code)
    markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')

    // 代码块 (pre > code)
    markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```\n\n')

    // 引用 (blockquote)
    markdown = markdown.replace(
      /<blockquote[^>]*>(.*?)<\/blockquote>/gis,
      (match: string, content: string) => {
        return (
          content
            .split('\n')
            .map((line: string) => `> ${line}`)
            .join('\n') + '\n\n'
        )
      }
    )

    // 链接 (a)
    markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')

    // 段落 (p)
    markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')

    // 换行 (br)
    markdown = markdown.replace(/<br[^>]*>/gi, '\n')

    // 处理缩进元素
    // 处理带有ql-indent类的元素
    const indentRegex = /<([^>]+)class="[^"]*ql-indent-(\d+)[^"]*"[^>]*>(.*?)<\/\1>/gis
    markdown = markdown.replace(
      indentRegex,
      (match: string, tagName: string, indentLevel: string, content: string) => {
        const level = parseInt(indentLevel)
        const processedContent = content.trim()

        // 根据标签类型处理
        if (tagName.match(/^h[1-6]$/i)) {
          const headingLevel = tagName.charAt(1)
          const headingMark = '#'.repeat(parseInt(headingLevel))
          return `${applyIndent(`${headingMark} ${processedContent}`, level)}\n\n`
        } else if (tagName === 'p') {
          return `${applyIndent(processedContent, level)}\n\n`
        } else if (tagName === 'div') {
          return `${applyIndent(processedContent, level)}\n\n`
        } else if (tagName === 'span') {
          return `${applyIndent(processedContent, level)}`
        } else {
          return `${applyIndent(processedContent, level)}\n\n`
        }
      }
    )

    // 处理style缩进
    const styleIndentRegex =
      /<([^>]+)style="[^"]*(?:text-indent|margin-left):[^"]*"[^>]*>(.*?)<\/\1>/gis
    markdown = markdown.replace(
      styleIndentRegex,
      (match: string, tagName: string, content: string) => {
        const level = extractIndentLevel(match)
        const processedContent = content.trim()

        if (tagName.match(/^h[1-6]$/i)) {
          const headingLevel = tagName.charAt(1)
          const headingMark = '#'.repeat(parseInt(headingLevel))
          return `${applyIndent(`${headingMark} ${processedContent}`, level)}\n\n`
        } else if (tagName === 'p') {
          return `${applyIndent(processedContent, level)}\n\n`
        } else if (tagName === 'div') {
          return `${applyIndent(processedContent, level)}\n\n`
        } else if (tagName === 'span') {
          return `${applyIndent(processedContent, level)}`
        } else {
          return `${applyIndent(processedContent, level)}\n\n`
        }
      }
    )

    // 清理多余的HTML标签
    markdown = markdown.replace(/<[^>]*>/g, '')

    // 清理多余的空行
    markdown = markdown.replace(/\n\s*\n\s*\n/g, '\n\n')

    // 清理开头和结尾的空行
    markdown = markdown.replace(/^\s*\n+/, '')
    markdown = markdown.replace(/\n+\s*$/, '')

    return markdown
  } catch (error) {
    console.error('HTML转Markdown失败:', error)
    return html // 转换失败时返回原HTML
  }
}

/**
 * Markdown到HTML转换函数
 * 使用marked库进行转换
 * @param markdown Markdown字符串
 * @param options 转换选项
 * @returns 转换后的HTML字符串
 */
export function markdownToHtml(markdown: string, options: MarkdownOptions = {}): string {
  if (!markdown || markdown.trim() === '') {
    return ''
  }

  try {
    // 配置marked选项
    marked.setOptions({
      breaks: options.breaks || false,
      gfm: options.gfm || true,
    })

    // 使用同步版本的marked.parse
    return marked.parse(markdown) as string
  } catch (error) {
    console.error('Markdown转HTML失败:', error)
    return markdown // 转换失败时返回原Markdown
  }
}
