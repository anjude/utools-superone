import { ref, watch, onMounted, onUnmounted } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'auto'

/**
 * 主题管理 Composable
 * 支持手动切换和自动跟随系统主题
 */
export function useTheme() {
  const theme = ref<ThemeMode>('auto')
  const isDark = ref(false)

  // 从 localStorage 读取保存的主题设置
  const loadTheme = () => {
    const saved = localStorage.getItem('theme') as ThemeMode | null
    if (saved && ['light', 'dark', 'auto'].includes(saved)) {
      theme.value = saved
    } else {
      theme.value = 'auto'
    }
    updateTheme()
  }

  // 检测系统主题
  const getSystemTheme = (): boolean => {
    if (typeof window === 'undefined') return false
    
    // 优先使用 uTools 的 API 检测主题
    if (window.utools && typeof window.utools.isDarkColors === 'function') {
      return window.utools.isDarkColors()
    }
    
    // 降级到浏览器 API
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  // 更新主题
  const updateTheme = () => {
    let shouldBeDark = false

    if (theme.value === 'auto') {
      shouldBeDark = getSystemTheme()
    } else {
      shouldBeDark = theme.value === 'dark'
    }

    isDark.value = shouldBeDark

    // 更新 HTML 元素的 data-theme 属性
    if (typeof document !== 'undefined') {
      const html = document.documentElement
      if (shouldBeDark) {
        html.setAttribute('data-theme', 'dark')
        html.classList.add('dark')
        html.classList.remove('light')
      } else {
        html.setAttribute('data-theme', 'light')
        html.classList.add('light')
        html.classList.remove('dark')
      }
    }
  }

  // 设置主题
  const setTheme = (newTheme: ThemeMode) => {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    updateTheme()
  }

  // 切换主题（在 light 和 dark 之间切换，跳过 auto）
  const toggleTheme = () => {
    if (theme.value === 'light') {
      setTheme('dark')
    } else if (theme.value === 'dark') {
      setTheme('light')
    } else {
      // 如果当前是 auto，根据当前实际主题切换
      setTheme(isDark.value ? 'light' : 'dark')
    }
  }

  // 监听系统主题变化（仅在 auto 模式下）
  let mediaQuery: MediaQueryList | null = null
  let themeCheckInterval: number | null = null
  
  const handleSystemThemeChange = (e?: MediaQueryListEvent) => {
    if (theme.value === 'auto') {
      const newIsDark = getSystemTheme()
      if (newIsDark !== isDark.value) {
        isDark.value = newIsDark
        updateTheme()
      }
    }
  }

  onMounted(() => {
    loadTheme()
    
    // 在 uTools 环境中，定期检查主题变化（因为 uTools 可能没有提供事件监听）
    if (typeof window !== 'undefined' && window.utools && typeof window.utools.isDarkColors === 'function') {
      // 每 500ms 检查一次主题变化
      themeCheckInterval = window.setInterval(() => {
        handleSystemThemeChange()
      }, 500)
    } else {
      // 在浏览器环境中，使用 MediaQuery 监听
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleSystemThemeChange)
      } else {
        // 兼容旧版浏览器
        mediaQuery.addListener(handleSystemThemeChange)
      }
    }
  })

  onUnmounted(() => {
    // 清除 uTools 环境中的定时器
    if (themeCheckInterval !== null) {
      clearInterval(themeCheckInterval)
      themeCheckInterval = null
    }
    
    // 清除浏览器环境中的监听器
    if (mediaQuery) {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange)
      } else {
        // 兼容旧版浏览器
        mediaQuery.removeListener(handleSystemThemeChange)
      }
    }
  })

  // 监听主题变化
  watch(theme, () => {
    updateTheme()
  })

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme
  }
}

