import { createApp } from 'vue'
import { pinia } from './plugins/pinia'
import { i18n } from './plugins/i18n'
import router from './router'
import './styles/tailwind.css'
import './styles/main.scss'
// 全局引入 md-editor-v3 样式
import 'md-editor-v3/lib/style.css'
import App from './App.vue'

createApp(App).use(pinia).use(i18n).use(router).mount('#app')
