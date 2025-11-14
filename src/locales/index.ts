import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'

export type Locale = 'zh-CN' | 'en-US'

const messages = {
  'zh-CN': zhCN,
  'en-US': enUS
}

// 从 localStorage 获取保存的语言设置，默认为中文
const getDefaultLocale = (): Locale => {
  const saved = localStorage.getItem('locale')
  if (saved && (saved === 'zh-CN' || saved === 'en-US')) {
    return saved as Locale
  }
  // 根据浏览器语言自动选择
  const browserLang = navigator.language || (navigator as any).userLanguage
  if (browserLang.startsWith('en')) {
    return 'en-US'
  }
  return 'zh-CN'
}

const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: getDefaultLocale(),
  fallbackLocale: 'zh-CN',
  messages
})

export default i18n

// 切换语言
export const setLocale = (locale: Locale) => {
  i18n.global.locale.value = locale
  localStorage.setItem('locale', locale)
}

// 获取当前语言
export const getLocale = (): Locale => {
  return i18n.global.locale.value as Locale
}

