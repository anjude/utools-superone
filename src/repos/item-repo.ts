import { logger } from '@/utils/logger'
import { itemApi } from '@/api/item'
import type { Item } from '@/types/item-management'
import { ItemManagementEnums } from '@/constants/enums'

/**
 * 物品仓储层 - 纯API调用，无本地缓存
 */
export class ItemRepo {
  /**
   * 获取所有物品
   */
  static async getAll(): Promise<Item[]> {
    try {
      const reqId = logger.logRequestStart('ItemRepo.getAll', 'GET')
      const response = await itemApi.getItemList({
        offset: 0,
        size: 1000, // 获取所有数据
      })

      if (response.errCode !== 0) {
        throw new Error(response.msg || '获取物品列表失败')
      }

      const items = (response.data?.list || []).map(item => ({
        ...item,
        top: item.top ?? 0,
        // 转换 price 字段：如果后端返回 string，转换为 number
        price:
          item.price !== undefined && item.price !== null
            ? typeof item.price === 'string'
              ? parseFloat(item.price)
              : item.price
            : undefined,
      }))
      logger.logRequestSuccess(reqId, 200, { count: items.length })
      return items
    } catch (error) {
      logger.logRequestError('ItemRepo.getAll', error)
      throw error
    }
  }

  /**
   * 根据ID获取物品
   */
  static async getById(id: number): Promise<Item | null> {
    try {
      const reqId = logger.logRequestStart(`ItemRepo.getById(${id})`, 'GET')
      const response = await itemApi.getItemDetail({ id })

      if (response.errCode !== 0) {
        if (response.errCode === 404) {
          logger.logRequestSuccess(reqId, 404, { found: false })
          return null
        }
        throw new Error(response.msg || '获取物品详情失败')
      }

      const item = response.data
      logger.logRequestSuccess(reqId, 200, { found: true })
      return item
        ? {
            ...item,
            top: item.top ?? 0,
            // 转换 price 字段：如果后端返回 string，转换为 number
            price:
              item.price !== undefined && item.price !== null
                ? typeof item.price === 'string'
                  ? parseFloat(item.price)
                  : item.price
                : undefined,
          }
        : null
    } catch (error) {
      logger.logRequestError(`ItemRepo.getById(${id})`, error)
      throw error
    }
  }

  /**
   * 创建物品
   */
  static async create(data: Omit<Item, 'id' | 'createTime' | 'updateTime'>): Promise<Item> {
    try {
      const reqId = logger.logRequestStart('ItemRepo.create', 'POST')

      // 确保 remindTime 为 number 类型，null 转换为 0
      const createData = {
        ...data,
        remindTime: data.remindTime || 0,
        remindContent: data.remindContent || '',
      }

      const response = await itemApi.createItem(createData)

      if (response.errCode !== 0) {
        throw new Error(response.msg || '创建物品失败')
      }

      const newItem = response.data
      logger.logRequestSuccess(reqId, 201, { id: newItem.id })
      return {
        ...newItem,
        top: newItem.top ?? 0,
        // 转换 price 字段：如果后端返回 string，转换为 number
        price:
          newItem.price !== undefined && newItem.price !== null
            ? typeof newItem.price === 'string'
              ? parseFloat(newItem.price)
              : newItem.price
            : undefined,
      }
    } catch (error) {
      logger.logRequestError('ItemRepo.create', error)
      throw error
    }
  }

  /**
   * 更新物品
   */
  static async update(id: number, data: Partial<Item>): Promise<Item> {
    try {
      const reqId = logger.logRequestStart(`ItemRepo.update(${id})`, 'PUT')

      // 直接传递 partial 对象给后端，后端支持部分更新
      const response = await itemApi.updateItem({ id, ...data })

      if (response.errCode !== 0) {
        throw new Error(response.msg || '更新物品失败')
      }

      const updatedItem = response.data
      logger.logRequestSuccess(reqId, 200, { id })
      return {
        ...updatedItem,
        top: updatedItem.top ?? 0,
        // 转换 price 字段：如果后端返回 string，转换为 number
        price:
          updatedItem.price !== undefined && updatedItem.price !== null
            ? typeof updatedItem.price === 'string'
              ? parseFloat(updatedItem.price)
              : updatedItem.price
            : undefined,
      }
    } catch (error) {
      logger.logRequestError(`ItemRepo.update(${id})`, error)
      throw error
    }
  }

  /**
   * 删除物品
   */
  static async delete(id: number): Promise<void> {
    try {
      const reqId = logger.logRequestStart(`ItemRepo.delete(${id})`, 'DELETE')
      const response = await itemApi.deleteItem({ id })

      if (response.errCode !== 0) {
        throw new Error(response.msg || '删除物品失败')
      }

      logger.logRequestSuccess(reqId, 200, { id })
    } catch (error) {
      logger.logRequestError(`ItemRepo.delete(${id})`, error)
      throw error
    }
  }

  /**
   * 更新物品状态
   */
  static async updateStatus(id: number, status: ItemManagementEnums.ItemStatus): Promise<Item> {
    try {
      const reqId = logger.logRequestStart(`ItemRepo.updateStatus(${id})`, 'PUT')
      const response = await itemApi.updateItemStatus({ id, status })

      if (response.errCode !== 0) {
        throw new Error(response.msg || '更新物品状态失败')
      }

      const updatedItem = response.data
      logger.logRequestSuccess(reqId, 200, { id, status })
      return {
        ...updatedItem,
        // 转换 price 字段：如果后端返回 string，转换为 number
        price:
          updatedItem.price !== undefined && updatedItem.price !== null
            ? typeof updatedItem.price === 'string'
              ? parseFloat(updatedItem.price)
              : updatedItem.price
            : undefined,
      }
    } catch (error) {
      logger.logRequestError(`ItemRepo.updateStatus(${id})`, error)
      throw error
    }
  }
}
