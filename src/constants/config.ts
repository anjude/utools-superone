let CONFIG = {
    // env: Env.Release,
    version: '0.0.1',
    baseURL: 'https://api.beanflow.top',
    appName: 'AI无限',
    shareProfile: '信息流',
    cloudEnvId: "prod-5g1lcxgoce0451d2",
    serviceName: "golang-fkr4",
    ifAppid: "wx7752b4b866490bdd",
    twAppid: "wx9f8f3f1dbfb29cb1",
    // 'develop' | 'trial' | 'release'
    urlMap: {
        debug: "http://so.proxy.beanflow.top:82",
        develop: "https://api.beanflow.top:8080",
        trial: "https://api.beanflow.top:8080",
        release: "https://api.beanflow.top"
    }
};

export default CONFIG;
