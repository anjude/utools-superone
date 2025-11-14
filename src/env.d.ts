/// <reference types="vite/client" />

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
