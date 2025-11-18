<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { navItems, type NavItem } from '@/constants/nav-config'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 获取当前路由对应的导航项
const currentNavItem = computed(() => {
  return navItems.find(item => item.name === route.name)
})

// 处理导航切换
const handleNavClick = (item: NavItem) => {
  if (item.name !== route.name) {
    router.push({ name: item.name })
  }
}

// 处理退出登录
const handleLogout = () => {
  userStore.logout()
  router.push({ name: 'Login' })
}
</script>

<template>
  <el-dropdown
    trigger="hover"
    placement="bottom-start"
    class="cu-module-nav"
  >
    <div class="cu-module-nav__trigger" title="切换模块">
      <i class="iconfont icon-more cu-module-nav__icon"></i>
      <slot />
    </div>
    <template #dropdown>
      <el-dropdown-menu class="cu-module-nav__menu">
        <el-dropdown-item
          v-for="item in navItems"
          :key="item.name"
          :class="{
            'cu-module-nav__item': true,
            'cu-module-nav__item--active': item.name === route.name
          }"
          @click="handleNavClick(item)"
        >
          <i :class="item.icon" class="cu-module-nav__item-icon"></i>
          <span class="cu-module-nav__item-label">{{ item.label }}</span>
        </el-dropdown-item>
        <el-dropdown-item divided class="cu-module-nav__item cu-module-nav__item--logout" @click="handleLogout">
          <i class="iconfont icon-reset cu-module-nav__item-icon"></i>
          <span class="cu-module-nav__item-label">退出登录</span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

