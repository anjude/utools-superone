// 平台API类型声明
declare global {
  // 微信小程序
  interface WxLoginResult {
    code: string
    errMsg: string
  }

  interface WxLoginOptions {
    success?: (res: WxLoginResult) => void
    fail?: (err: any) => void
    complete?: () => void
  }

  // 支付宝小程序
  interface AlipayAuthResult {
    authCode: string
    errMsg: string
  }

  interface AlipayAuthOptions {
    scopes: string[]
    success?: (res: AlipayAuthResult) => void
    fail?: (err: any) => void
    complete?: () => void
  }

  // 百度小程序
  interface BaiduLoginResult {
    code: string
    errMsg: string
  }

  interface BaiduLoginOptions {
    success?: (res: BaiduLoginResult) => void
    fail?: (err: any) => void
    complete?: () => void
  }

  // 字节跳动小程序
  interface ToutiaoLoginResult {
    code: string
    errMsg: string
  }

  interface ToutiaoLoginOptions {
    success?: (res: ToutiaoLoginResult) => void
    fail?: (err: any) => void
    complete?: () => void
  }

  // 微信小程序重启选项
  interface WxRestartMiniProgramOptions {
    success?: () => void
    fail?: (err: any) => void
    complete?: () => void
  }

  // 微信小程序全局对象
  const wx: {
    login: (options: WxLoginOptions) => void
    restartMiniProgram?: (options: WxRestartMiniProgramOptions) => void
  }

  // 支付宝小程序全局对象
  const my: {
    getAuthCode: (options: AlipayAuthOptions) => void
  }

  // 百度小程序全局对象
  const swan: {
    login: (options: BaiduLoginOptions) => void
  }

  // 字节跳动小程序全局对象
  const tt: {
    login: (options: ToutiaoLoginOptions) => void
  }

  // 微信小程序配置
  const __wxConfig: {
    envVersion: string
  }
}

export {}
