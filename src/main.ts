import { createApp } from 'vue'
import { pinia } from './plugins/pinia'
import './styles/index.scss'
import App from './App.vue'

createApp(App)
  .use(pinia)
  .mount('#app')

