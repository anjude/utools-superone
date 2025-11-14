// 请求与响应相关类型定义

export interface BusinessResponse<T = any> {
  errCode: number
  data: T
  msg: string
  detail: string
}

export interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  params?: any
  headers?: Record<string, string>
  timeout?: number
  showLoading?: boolean
  loadingText?: string
}

export interface Response<T = any> {
  data: T
  statusCode: number
  header: any
  cookies: string[]
}

export interface Interceptors {
  request: {
    use: (handler: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>) => void
  }
  response: {
    use: (handler: (response: Response) => Response | Promise<Response>) => void
  }
}
