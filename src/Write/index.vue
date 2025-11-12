<script lang="ts" setup>
import { watch } from 'vue'
import type { PluginEnterAction } from '../types/utools'

type TextEnterAction = PluginEnterAction<string>
type ImageEnterAction = PluginEnterAction<string>

const props = defineProps<{
  enterAction: PluginEnterAction
}>()

const isTextEnterAction = (
  action: PluginEnterAction,
): action is TextEnterAction => action.type === 'over'

const isImageEnterAction = (
  action: PluginEnterAction,
): action is ImageEnterAction => action.type === 'img'

watch(
  () => props.enterAction,
  (enterAction) => {
    let outputPath: string | undefined

    try {
      if (isTextEnterAction(enterAction)) {
        outputPath = window.services.writeTextFile(enterAction.payload)
      } else if (isImageEnterAction(enterAction)) {
        outputPath = window.services.writeImageFile(enterAction.payload)
      }
    } catch (err) {
      window.utools.showNotification(
        (err instanceof Error ? err.message : undefined) ?? '文件保存出错了！',
      )
    }

    if (outputPath) {
      window.utools.shellShowItemInFolder(outputPath)
    }
  },
  {
    immediate: true,
  },
)
</script>

<template>
  <div></div>
</template>

