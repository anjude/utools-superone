import { createApp } from 'vue'
import { pinia } from './plugins/pinia'
import { i18n } from './plugins/i18n'
import router from './router'
import './styles/tailwind.css'
import './styles/main.scss'
// 全局引入 Vditor 样式
import './styles/vditor/index.css'
// 引入 Element Plus Notification 样式
import 'element-plus/theme-chalk/src/notification.scss'
import App from './App.vue'

createApp(App).use(pinia).use(i18n).use(router).mount('#app')
