import { createApp } from 'vue'
import { pinia } from './plugins/pinia'
import router from './router'
import './styles/tailwind.css'
import './styles/index.scss'
import App from './App.vue'

createApp(App).use(pinia).use(router).mount('#app')
