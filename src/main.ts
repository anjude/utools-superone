import { createApp } from 'vue'
import { pinia } from './plugins/pinia'
import { i18n } from './plugins/i18n'
import router from './router'
import './styles/tailwind.css'
import './styles/main.scss'
import App from './App.vue'

createApp(App).use(pinia).use(i18n).use(router).mount('#app')
