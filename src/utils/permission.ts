/**
 * 用户权限相关工具函数
 */

import { UserEnums } from '@/types/enums'

/**
 * 检查用户是否具有免广告权限
 * @param permission 权限标记位
 * @returns 是否具有免广告权限
 */
export function hasAdFreePermission(permission: UserEnums.UserPermission): boolean {
  return (permission & UserEnums.UserPermission.AdFree) === UserEnums.UserPermission.AdFree
}

/**
 * 将后端返回的数字转换为权限枚举
 * @param permission 后端返回的权限数字（int64）
 * @returns 权限枚举值
 */
export function convertPermissionToEnum(permission: number): UserEnums.UserPermission {
  return permission as UserEnums.UserPermission
}

