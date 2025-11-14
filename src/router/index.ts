import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'TopicList',
    component: () => import('@/views/TopicList.vue'),
    meta: {
      title: '主题列表',
    },
  },
  {
    path: '/topic/:id',
    name: 'TopicDetail',
    component: () => import('@/views/TopicDetail.vue'),
    meta: {
      title: '主题详情',
    },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      title: '登录',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
