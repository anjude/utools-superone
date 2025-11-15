type EnvType = 'debug' | 'develop' | 'trial' | 'release'

let CONFIG = {
  // env: Env.Release,
  version: '0.0.1',
  baseURL: 'https://api.beanflow.top',
  appName: 'AI无限',
  shareProfile: '信息流',
  cloudEnvId: 'prod-5g1lcxgoce0451d2',
  serviceName: 'golang-fkr4',
  ifAppid: 'wx7752b4b866490bdd',
  twAppid: 'wx9f8f3f1dbfb29cb1',
  // 'develop' | 'trial' | 'release'
  urlMap: {
    debug: 'http://so.proxy.beanflow.top:82',
    develop: 'https://api.beanflow.top:8080',
    trial: 'https://api.beanflow.top:8080',
    release: 'https://api.beanflow.top',
  },
  /**
   * 根据环境类型获取 baseURL
   */
  getBaseURLByEnv(env?: EnvType): string {
    // 优先使用传入的 env，否则从环境变量获取
    const envType = env || (import.meta.env.VITE_ENV as EnvType)
    
    if (envType && this.urlMap[envType]) {
      return this.urlMap[envType]
    }
    
    // 如果没有指定环境，根据 MODE 判断
    const mode = import.meta.env.MODE
    if (mode === 'development') {
      return this.urlMap.develop
    }
    
    // 默认返回 release
    return this.urlMap.release
  },
}

export default CONFIG
