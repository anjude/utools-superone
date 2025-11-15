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
    path: '/checklist',
    name: 'ChecklistList',
    component: () => import('@/views/ChecklistList.vue'),
    meta: {
      title: '检查清单',
    },
  },
  {
    path: '/checklist/:id',
    name: 'ChecklistDetail',
    component: () => import('@/views/ChecklistDetail.vue'),
    meta: {
      title: '清单详情',
    },
  },
  {
    path: '/plan',
    name: 'PlanList',
    component: () => import('@/views/PlanList.vue'),
    meta: {
      title: '近期任务',
    },
  },
  {
    path: '/stock',
    name: 'StockList',
    component: () => import('@/views/StockList.vue'),
    meta: {
      title: '投资标的',
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
