/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_URL?: string
  readonly VITE_ENV?: 'debug' | 'develop' | 'trial' | 'release'
  readonly MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

type UToolsApi = typeof utools

interface WindowServices {
  readFile(file: string): string
  readFileBuffer(file: string): string
  writeTextFile(text: string): string
  writeImageFile(base64Url: string): string | undefined
}

declare global {
  interface Window {
    utools: UToolsApi
    services: WindowServices
  }
}

export {}
