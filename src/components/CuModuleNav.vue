<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { navItems, type NavItem } from '@/constants/nav-config'

const route = useRoute()
const router = useRouter()

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
</script>

<template>
  <el-dropdown
    trigger="click"
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
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

