<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch, computed, nextTick } from 'vue'
import Vditor from 'vditor'
import '@/styles/vditor/index.css'

interface Props {
  /** markdown 源码 */
  modelValue: string
  /** 占位符 */
  placeholder?: string
  /** 编辑器高度 */
  height?: string | number
  /** 是否禁用 */
  disabled?: boolean
  /** 工具栏配置 */
  toolbars?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  height: '200px',
  disabled: false,
  toolbars: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
}>()

const vditor = ref<Vditor | null>(null)
const containerRef = ref<HTMLElement | null>(null)
// 使用静态 ID 前缀 + 时间戳，确保唯一性同时保持稳定
let editorContainerId: string
// 存储事件监听器，用于清理
const clickHandlers: Array<{ element: HTMLElement; handler: (e: Event) => void }> = []

const editorContent = ref(props.modelValue)

const editorHeight = computed(() => {
  if (typeof props.height === 'number') {
    return `${props.height}px`
  }
  return props.height
})

// 监听外部传入的 modelValue 变化
watch(
  () => props.modelValue,
  newVal => {
    if (vditor.value && newVal !== editorContent.value) {
      editorContent.value = newVal
      let mdContent = newVal as string
      // 如果是 HTML 开头，转换为 Markdown
      if (newVal?.startsWith('<')) {
        mdContent = vditor.value.html2md(newVal) as string
      }
      vditor.value.setValue(mdContent)
    }
  }
)

// 监听禁用状态
watch(
  () => props.disabled,
  disabled => {
    if (vditor.value) {
      // 使用 nextTick 确保 DOM 更新完成
      nextTick(() => {
        if (vditor.value) {
          if (disabled) {
            vditor.value.disabled()
          } else {
            vditor.value.enable()
            // 启用后尝试聚焦，让用户可以直接输入
            setTimeout(() => {
              if (vditor.value && !props.disabled) {
                try {
                  vditor.value.focus()
                } catch (e) {
                  // 聚焦失败不影响使用
                }
              }
            }, 50)
          }
        }
      })
    }
  },
  { immediate: false }
)

onMounted(async () => {
  // 确保 DOM 元素已经准备好
  await nextTick()

  // 使用 ref 获取元素，如果没有则使用 ID
  if (!containerRef.value) {
    return
  }

  // 如果容器元素还没有 ID，为其分配一个
  if (!editorContainerId) {
    editorContainerId =
      containerRef.value.id ||
      `vditor-container-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    containerRef.value.id = editorContainerId
  }

  const heightValue = editorHeight.value

  try {
    vditor.value = new Vditor(editorContainerId, {
      cdn: './vditor',
      height: heightValue,
      placeholder: props.placeholder || '',
      toolbar:
        props.toolbars.length > 0
          ? props.toolbars
          : [
              'headings',
              'bold',
              'italic',
              'strike',
              'link',
              '|',
              'list',
              'ordered-list',
              'check',
              '|',
              'quote',
              'line',
              'code',
              '|',
              'upload',
              'table',
              '|',
              'fullscreen',
              'edit-mode',
              {
                name: 'more',
                toolbar: [
                  'undo',
                  'redo',
                  'inline-code',
                  'outdent',
                  'indent',
                  'emoji',
                  'both',
                  'code-theme',
                  'content-theme',
                  'export',
                  'outline',
                  'preview',
                  'devtools',
                  'info',
                  'help',
                  'insert-before',
                  'insert-after',
                  'record',
                ],
              },
            ],
      toolbarConfig: {
        hide: false,
        pin: true,
      },
      icon: 'ant',
      mode: 'wysiwyg', // 所见即所得模式
      after: () => {
        // 初始化内容
        if (vditor.value) {
          let mdContent = editorContent.value as string
          // 如果是 HTML 开头，转换为 Markdown
          if (editorContent.value?.startsWith('<')) {
            mdContent = vditor.value.html2md(editorContent.value) as string
          }
          vditor.value.setValue(mdContent)
          // 设置禁用状态
          if (props.disabled) {
            vditor.value.disabled()
          } else {
            // 确保编辑器可交互，如果没有禁用则启用
            vditor.value.enable()
            // 尝试聚焦编辑器（可能需要延迟）
            setTimeout(() => {
              if (vditor.value && !props.disabled) {
                try {
                  vditor.value.focus()
                } catch (e) {
                  // 聚焦失败不影响使用
                }
              }
            }, 100)
            
            // 添加点击事件处理，确保空白区域也可以点击聚焦
            nextTick(() => {
              if (containerRef.value && vditor.value) {
                const handleClick = (e: Event) => {
                  // 如果点击的是编辑区域，聚焦编辑器
                  if (vditor.value && !props.disabled) {
                    try {
                      vditor.value.focus()
                    } catch (err) {
                      // 聚焦失败不影响使用
                    }
                  }
                }
                
                // 获取所有可能的编辑区域元素
                const wysiwygElement = containerRef.value.querySelector('.vditor-wysiwyg') as HTMLElement
                const irElement = containerRef.value.querySelector('.vditor-ir') as HTMLElement
                const svElement = containerRef.value.querySelector('.vditor-sv') as HTMLElement
                const contentElement = containerRef.value.querySelector('.vditor-content') as HTMLElement
                
                // 为编辑区域添加点击事件，使用捕获阶段确保能捕获所有点击
                if (wysiwygElement) {
                  wysiwygElement.addEventListener('click', handleClick, true)
                  clickHandlers.push({ element: wysiwygElement, handler: handleClick })
                }
                if (irElement) {
                  irElement.addEventListener('click', handleClick, true)
                  clickHandlers.push({ element: irElement, handler: handleClick })
                }
                if (svElement) {
                  svElement.addEventListener('click', handleClick, true)
                  clickHandlers.push({ element: svElement, handler: handleClick })
                }
                // 为整个内容区域添加点击事件，确保点击空白区域也能聚焦
                if (contentElement) {
                  contentElement.addEventListener('click', handleClick, true)
                  clickHandlers.push({ element: contentElement, handler: handleClick })
                }
              }
            })
          }
        }
      },
      input: (value: string) => {
        // 输入时获取 Markdown 内容并 emit
        if (vditor.value) {
          const markdown = vditor.value.getValue()
          editorContent.value = markdown
          emit('update:modelValue', markdown)
          emit('change', markdown)
        }
      },
    })
  } catch (error) {
    console.error('Vditor initialization error:', error)
  }
})

// 组件卸载时清理 Vditor 实例和事件监听器
onUnmounted(() => {
  // 清理事件监听器
  clickHandlers.forEach(({ element, handler }) => {
    try {
      element.removeEventListener('click', handler, true)
    } catch (error) {
      // 忽略清理错误
    }
  })
  clickHandlers.length = 0
  
  if (vditor.value) {
    try {
      vditor.value.destroy()
      vditor.value = null
    } catch (error) {
      console.error('Vditor destroy error:', error)
    }
  }
})
</script>

<template>
  <div class="markdown-editor-wrapper">
    <div ref="containerRef" class="vditor-container"></div>
  </div>
</template>

<style lang="scss" scoped>
.markdown-editor-wrapper {
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;

  .vditor-container {
    border-radius: var(--radius-md);
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  :deep(.vditor) {
    background: var(--bg-color);
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 100%;
    overflow: hidden;

    .vditor-toolbar {
      background: var(--bg-color);
      border-bottom: 1px solid var(--border-color);
      flex-shrink: 0;
      position: sticky;
      top: 0;
      z-index: 2;
    }

    .vditor-content {
      background: var(--bg-color);
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      // 确保编辑器内容区域可交互
      pointer-events: auto;

      .vditor-wysiwyg {
        pointer-events: auto;
        cursor: text;
        min-height: 100%;
        padding: var(--spacing-md);
        box-sizing: border-box;

        // 确保编辑区域可以点击
        pre.vditor-reset {
          min-height: 100%;
          cursor: text;
          padding: var(--spacing-sm) var(--spacing-md);
          box-sizing: border-box;
          
          // 确保空白区域也可以点击
          &::after {
            cursor: text;
            pointer-events: auto;
          }
        }
      }

      .vditor-ir {
        pointer-events: auto;
        cursor: text;
        min-height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
      }

      .vditor-sv {
        pointer-events: auto;
        cursor: text;
        min-height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
      }
    }

    .vditor-preview {
      background: var(--bg-color);
    }

    // 确保整个编辑器容器可交互
    .vditor-ir__node,
    .vditor-wysiwyg__node,
    .vditor-sv__node {
      pointer-events: auto;
    }
  }
}
</style>
