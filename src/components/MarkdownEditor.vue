<script lang="ts" setup>
import { computed } from 'vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'

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
  toolbars: () => [
    'bold',
    'underline',
    'italic',
    'strikeThrough',
    '-',
    'title',
    'sub',
    'sup',
    'quote',
    'unorderedList',
    'orderedList',
    'task',
    '-',
    'codeRow',
    'code',
    'link',
    'table',
    '-',
    'revoke',
    'next',
    '=',
    'pageFullscreen',
    'fullscreen',
    'preview',
    'catalog',
  ],
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
}>()

const editorValue = computed({
  get: () => props.modelValue,
  set: (value: string) => {
    emit('update:modelValue', value)
    emit('change', value)
  },
})

const editorHeight = computed(() => {
  if (typeof props.height === 'number') {
    return `${props.height}px`
  }
  return props.height
})
</script>

<template>
  <div class="markdown-editor-wrapper">
    <MdEditor
      v-model="editorValue"
      :preview="true"
      :toolbars="toolbars"
      :placeholder="placeholder"
      language="zh-CN"
      :style="{ height: editorHeight }"
      :disabled="disabled"
    />
  </div>
</template>

<style lang="scss" scoped>
.markdown-editor-wrapper {
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-color);

  :deep(.md-editor) {
    background: var(--bg-color);
    border: none;

    .md-editor-content {
      min-height: 120px;
    }

    .md-editor-toolbar {
      position: relative;
    }
  }
}
</style>

