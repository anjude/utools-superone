/**
 * Scroll View 高度计算工具
 * 根据全局导航栏信息和胶囊占用高度计算合适的 scroll view 高度
 */

import { app } from "@/stores/app";

/**
 * 获取系统信息
 */
const getSystemInfo = () => {
  try {
    return uni.getSystemInfoSync();
  } catch (error) {
    console.error("获取系统信息失败:", error);
    return {
      statusBarHeight: 0,
      windowHeight: 667,
      windowWidth: 375,
    };
  }
};

/**
 * 计算导航栏总高度
 * @returns 导航栏总高度（px）
 */
export const getNavigationBarHeight = (): number => {
  const sysInfo = getSystemInfo();

  // 微信小程序环境
  // #ifdef MP-WEIXIN
  const capsule =
    uni.getMenuButtonBoundingClientRect &&
    uni.getMenuButtonBoundingClientRect();
  if (capsule) {
    // 胶囊按钮高度 = (胶囊底部 + 胶囊顶部) - 状态栏高度
    return capsule.bottom + capsule.top - (sysInfo.statusBarHeight || 0);
  } else {
    // 没有胶囊按钮时，使用状态栏高度 + 50px
    return (sysInfo.statusBarHeight || 0) + 50;
  }
  // #endif

  // 非微信小程序环境
  // #ifndef MP-WEIXIN
  return (sysInfo.statusBarHeight || 0) + 50;
  // #endif
};

/**
 * 计算 Scroll View 可用高度
 * @param options 配置选项
 * @returns Scroll View 高度（px）
 */
export const getScrollViewHeight = (
  options: {
    /** 是否减去底部导航栏高度 */
    excludeTabBar?: boolean;
    /** 是否减去底部胶囊导航高度 */
    excludeCapsuleNav?: boolean;
    /** 额外的内边距 */
    extraPadding?: number;
    /** 其他固定元素高度 */
    fixedElementsHeight?: number;
  } = {}
): number => {
  const {
    excludeTabBar = true,
    excludeCapsuleNav = false,
    extraPadding = 0,
    fixedElementsHeight = 0,
  } = options;

  const sysInfo = getSystemInfo();
  const navHeight = getNavigationBarHeight();

  // 基础计算：屏幕高度 - 导航栏高度
  let availableHeight = sysInfo.windowHeight - navHeight;

  // 减去底部导航栏高度（统一为 50px，对应 100rpx）
  if (excludeTabBar) {
    availableHeight -= 50;
  }

  // 减去底部胶囊导航高度（统一为 50px，对应 100rpx）
  if (excludeCapsuleNav) {
    availableHeight -= 50;
  }

  // 减去其他固定元素高度
  availableHeight -= fixedElementsHeight;

  // 减去额外内边距
  availableHeight -= extraPadding;

  return Math.max(availableHeight, 200); // 最小高度 200px
};

/**
 * 计算 Scroll View 可用高度（rpx 单位）
 * @deprecated 推荐使用 getScrollViewHeight 获取 px 单位，避免 rpx 转换精度损失
 * @param options 配置选项
 * @returns Scroll View 高度（rpx）
 */
export const getScrollViewHeightRpx = (
  options: {
    /** 是否减去底部导航栏高度 */
    excludeTabBar?: boolean;
    /** 是否减去底部胶囊导航高度 */
    excludeCapsuleNav?: boolean;
    /** 额外的内边距 */
    extraPadding?: number;
    /** 其他固定元素高度 */
    fixedElementsHeight?: number;
  } = {}
): number => {
  const heightPx = getScrollViewHeight(options);
  const sysInfo = getSystemInfo();

  // 转换为 rpx：rpx = px * 750 / 屏幕宽度
  return Math.round((heightPx * 750) / sysInfo.windowWidth);
};

/**
 * 获取全局导航栏信息
 * @returns 导航栏信息对象
 */
export const getGlobalNavInfo = () => {
  return {
    statusBar: app.globalData.navInfo.StatusBar,
    customBar: app.globalData.navInfo.CustomBar,
    custom: app.globalData.navInfo.Custom,
  };
};

/**
 * 计算页面内容区域高度（包含导航栏）
 * @param options 配置选项
 * @returns 页面内容区域高度（px）
 */
export const getPageContentHeight = (
  options: {
    /** 是否减去底部导航栏高度 */
    excludeTabBar?: boolean;
    /** 是否减去底部胶囊导航高度 */
    excludeCapsuleNav?: boolean;
    /** 额外的内边距 */
    extraPadding?: number;
  } = {}
): number => {
  const sysInfo = getSystemInfo();
  const {
    excludeTabBar = true,
    excludeCapsuleNav = false,
    extraPadding = 0,
  } = options;

  let height = sysInfo.windowHeight;

  if (excludeTabBar) {
    height -= 50;
  }

  if (excludeCapsuleNav) {
    height -= 50;
  }

  height -= extraPadding;

  return Math.max(height, 300); // 最小高度 300px
};

/**
 * 计算页面内容区域高度（rpx 单位）
 * @deprecated 推荐使用 getPageContentHeight 获取 px 单位，避免 rpx 转换精度损失
 * @param options 配置选项
 * @returns 页面内容区域高度（rpx）
 */
export const getPageContentHeightRpx = (
  options: {
    /** 是否减去底部导航栏高度 */
    excludeTabBar?: boolean;
    /** 是否减去底部胶囊导航高度 */
    excludeCapsuleNav?: boolean;
    /** 额外的内边距 */
    extraPadding?: number;
  } = {}
): number => {
  const heightPx = getPageContentHeight(options);
  const sysInfo = getSystemInfo();

  return Math.round((heightPx * 750) / sysInfo.windowWidth);
};
