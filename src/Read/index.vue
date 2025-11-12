<script lang="ts" setup>
import { ref, watch } from 'vue'
import type { PluginEnterAction } from '../types/utools'

interface FilesPayloadItem {
  path: string
}

const props = defineProps<{
  enterAction: PluginEnterAction
}>()

const filePath = ref<string>('')
const fileContent = ref<string>('')
const error = ref<string>('')

const readFileSafely = (targetPath: string) => {
  try {
    const content = window.services.readFile(targetPath)
    fileContent.value = content
    error.value = ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
    fileContent.value = ''
  }
}

const handleOpenDialog = () => {
  // 通过 uTools 的 api 打开文件选择窗口
  const files = window.utools.showOpenDialog({
    title: '选择文件',
    properties: ['openFile'],
  })
  if (!files || files.length === 0) return
  const selectedPath = files[0] as string
  filePath.value = selectedPath
  readFileSafely(selectedPath)
}

const isFilesEnterAction = (
  action: PluginEnterAction,
): action is PluginEnterAction<FilesPayloadItem[]> => {
  return action.type === 'files' && Array.isArray(action.payload)
}

watch(
  () => props.enterAction,
  (enterAction) => {
    if (!isFilesEnterAction(enterAction) || enterAction.payload.length === 0) {
      return
    }

    const targetFile = enterAction.payload[0]?.path
    if (!targetFile) {
      return
    }

    filePath.value = targetFile
    readFileSafely(targetFile)
  },
  {
    immediate: true,
  },
)
</script>

<template>
  <div class="read">
    <button @click="handleOpenDialog">选择文件</button>
    <div class="read-file">{{ filePath }}</div>
    <template v-if="!!fileContent">
      <pre>
        {{ fileContent }}
      </pre>
    </template>
    <template v-if="!!error">
      <div class="read-error">
        {{ error }}
      </div>
    </template>
  </div>
</template>

<style>
.read {
  padding: 20px;
  box-sizing: border-box;
}

.read>pre {
  background-color: #fff;
  width: 100%;
  overflow: hidden;
  padding: 20px;
  box-sizing: border-box;
  border-radius: 7px;
  margin-top: 20px;
  white-space: break-spaces;
}

.read-file {
  width: 100%;
  margin-top: 20px;
  font-weight: bold;
}

.read-error {
  color: red;
}

@media (prefers-color-scheme: dark) {
  .read>pre {
    background-color: #424242;
  }
}
</style>

