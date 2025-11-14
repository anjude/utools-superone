// 兼容入口：保持原有导入路径不变
import request from './request/index'
export default request
export { request }
export { Request, LoginManager, ParamConverter } from './request/index'
export type { BusinessResponse, RequestConfig, Response, Interceptors } from './request/index'
