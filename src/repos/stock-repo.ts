import { logger } from '@/utils/logger'
import { stockApi } from '@/api/stock'
import type { IStock, IStockFormData, StockType } from '@/types/stock'
import { validateStock } from '@/types/stock'

/**
 * 标的仓储层
 */
export class StockRepo {
  /**
   * 获取所有标的
   */
  static async getAll(type?: StockType): Promise<IStock[]> {
    try {
      const reqId = logger.logRequestStart('StockRepo.getAll', 'GET')
      const response = await stockApi.getStockList({
        offset: 0,
        size: 1000, // 获取所有数据
        type // 传递类型参数到后端
      })
      
      if (response.errCode !== 0) {
        throw new Error(response.msg || '获取标的列表失败')
      }
      
      const stocks = (response.data?.list || []).map(stock => ({
        ...stock,
        top: stock.top ?? 0,
      }))
      logger.logRequestSuccess(reqId, 200, { count: stocks.length, type })
      return stocks
    } catch (error) {
      logger.logRequestError('StockRepo.getAll', error)
      throw error
    }
  }

  /**
   * 根据ID获取标的
   */
  static async getById(id: number): Promise<IStock | null> {
    try {
      const reqId = logger.logRequestStart(`StockRepo.getById(${id})`, 'GET')
      const response = await stockApi.getStockDetail({ stockId: id })
      
      if (response.errCode !== 0) {
        if (response.errCode === 404) {
          logger.logRequestSuccess(reqId, 404, { found: false })
          return null
        }
        throw new Error(response.msg || '获取标的详情失败')
      }
      
      const stock = response.data?.stock
      logger.logRequestSuccess(reqId, 200, { found: true })
      return stock ? { ...stock, top: stock.top ?? 0 } : null
    } catch (error) {
      logger.logRequestError(`StockRepo.getById(${id})`, error)
      throw error
    }
  }

  /**
   * 创建标的
   */
  static async create(data: IStockFormData): Promise<IStock> {
    try {
      const reqId = logger.logRequestStart('StockRepo.create', 'POST')
      
      // 数据验证
      const validation = validateStock(data)
      if (!validation.valid) {
        throw new Error(`数据验证失败: ${validation.errors.join(', ')}`)
      }
      
      const response = await stockApi.createStock(data)
      
      if (response.errCode !== 0) {
        throw new Error(response.msg || '创建标的失败')
      }
      
      const newStockId = response.data?.stockId
      logger.logRequestSuccess(reqId, 201, { id: newStockId })
      
      // 创建成功后需要重新获取完整的标的信息
      if (newStockId) {
        const newStock = await this.getById(newStockId)
        if (!newStock) {
          throw new Error('创建成功但无法获取标的详情')
        }
        return newStock
      }
      throw new Error('创建成功但未返回标的ID')
    } catch (error) {
      logger.logRequestError('StockRepo.create', error)
      throw error
    }
  }

  /**
   * 更新标的
   */
  static async update(id: number, data: Partial<IStockFormData>): Promise<IStock> {
    try {
      const reqId = logger.logRequestStart(`StockRepo.update(${id})`, 'PUT')
      
      // 数据验证（仅验证提供的字段）
      if (Object.keys(data).length > 0) {
        const validation = validateStock(data, { partial: true })
        if (!validation.valid) {
          throw new Error(`数据验证失败: ${validation.errors.join(', ')}`)
        }
      }
      
      const response = await stockApi.updateStock({ stockId: id, ...data } as any)
      
      if (response.errCode !== 0) {
        throw new Error(response.msg || '更新标的失败')
      }
      
      const success = response.data?.success
      logger.logRequestSuccess(reqId, 200, { id })
      
      if (success) {
        // 更新成功后重新获取完整的标的信息
        const updatedStock = await this.getById(id)
        if (!updatedStock) {
          throw new Error('更新成功但无法获取标的详情')
        }
        return updatedStock
      }
      throw new Error('更新失败')
    } catch (error) {
      logger.logRequestError(`StockRepo.update(${id})`, error)
      throw error
    }
  }

  /**
   * 删除标的
   */
  static async delete(id: number): Promise<void> {
    try {
      const reqId = logger.logRequestStart(`StockRepo.delete(${id})`, 'DELETE')
      const response = await stockApi.deleteStock({ stockId: id })
      
      if (response.errCode !== 0) {
        throw new Error(response.msg || '删除标的失败')
      }
      
      logger.logRequestSuccess(reqId, 200, { id })
    } catch (error) {
      logger.logRequestError(`StockRepo.delete(${id})`, error)
      throw error
    }
  }

  /**
   * 搜索标的
   */
  static async search(keyword: string, type?: string): Promise<IStock[]> {
    try {
      const reqId = logger.logRequestStart('StockRepo.search', 'GET')
      const response = await stockApi.getStockList({
        keyword,
        type: type as any,
        offset: 0,
        size: 1000
      })
      
      if (response.errCode !== 0) {
        throw new Error(response.msg || '搜索标的失败')
      }
      
      const stocks = (response.data?.list || []).map(stock => ({
        ...stock,
        top: stock.top ?? 0,
      }))
      logger.logRequestSuccess(reqId, 200, { count: stocks.length })
      return stocks
    } catch (error) {
      logger.logRequestError('StockRepo.search', error)
      throw error
    }
  }

}
