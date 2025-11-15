import { checklistApi } from '@/api/checklist'
import { logger } from '@/utils/logger'
import type { ChecklistEntity, ChecklistEditForm, ChecklistExecutionRecordEntity, ChecklistExecutionForm } from '@/types/checklist'
import { ChecklistEnums } from '@/constants/enums'
import { ExecutionMode, ChecklistExecutionStatus } from '@/types/checklist'

/**
 * 清单仓储层 - 基于API实现
 */
export class ChecklistRepo {
  /**
   * 获取所有清单
   */
  static async getAll(): Promise<ChecklistEntity[]> {
    try {
      const reqId = logger.logRequestStart('ChecklistRepo.getAll', 'GET')
      const response = await checklistApi.getChecklistList({ offset: 0, size: 1000 })

      if (response.errCode === 0) {
        const checklists = response.data.list || []
        logger.logRequestSuccess(reqId, 200, { count: checklists.length })
        return checklists
      } else {
        throw new Error(response.msg || '获取清单列表失败')
      }
    } catch (error) {
      logger.logRequestError('ChecklistRepo.getAll', error)
      throw error
    }
  }

  /**
   * 根据ID获取清单
   */
  static async getById(id: number): Promise<ChecklistEntity | null> {
    try {
      const reqId = logger.logRequestStart(`ChecklistRepo.getById(${id})`, 'GET')
      const response = await checklistApi.getChecklistDetail({ id })

      if (response.errCode === 0) {
        logger.logRequestSuccess(reqId, 200, { found: true })
        return response.data
      } else {
        logger.logRequestSuccess(reqId, 404, { found: false })
        return null
      }
    } catch (error) {
      logger.logRequestError(`ChecklistRepo.getById(${id})`, error)
      throw error
    }
  }

  /**
   * 创建清单
   */
  static async create(data: ChecklistEditForm): Promise<ChecklistEntity> {
    try {
      const reqId = logger.logRequestStart('ChecklistRepo.create', 'POST')

      // 数据验证
      if (!data.title?.trim()) {
        throw new Error('清单标题不能为空')
      }
      if (!data.items || data.items.length === 0) {
        throw new Error('至少需要一个检查项')
      }
      for (const item of data.items) {
        if (!item.contentMd?.trim()) {
          throw new Error('检查项内容不能为空')
        }
      }

      const response = await checklistApi.createChecklist(data)

      if (response.errCode === 0) {
        logger.logRequestSuccess(reqId, 201, { id: response.data.id })
        return response.data
      } else {
        throw new Error(response.msg || '创建清单失败')
      }
    } catch (error) {
      logger.logRequestError('ChecklistRepo.create', error)
      throw error
    }
  }

  /**
   * 更新清单
   */
  static async update(id: number, data: Partial<ChecklistEditForm>): Promise<ChecklistEntity> {
    try {
      const reqId = logger.logRequestStart(`ChecklistRepo.update(${id})`, 'PUT')

      // 数据验证
      if (data.title !== undefined && !data.title.trim()) {
        throw new Error('清单标题不能为空')
      }
      if (data.items !== undefined) {
        if (data.items.length === 0) {
          throw new Error('至少需要一个检查项')
        }
        for (const item of data.items) {
          if (!item.contentMd?.trim()) {
            throw new Error('检查项内容不能为空')
          }
        }
      }

      // 过滤掉undefined值
      const updateData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
      ) as Partial<ChecklistEditForm>

      const response = await checklistApi.updateChecklist({ id, ...updateData })

      if (response.errCode === 0) {
        logger.logRequestSuccess(reqId, 200, { id })
        return response.data
      } else {
        throw new Error(response.msg || '更新清单失败')
      }
    } catch (error) {
      logger.logRequestError(`ChecklistRepo.update(${id})`, error)
      throw error
    }
  }

  /**
   * 删除清单
   */
  static async delete(id: number): Promise<void> {
    try {
      const reqId = logger.logRequestStart(`ChecklistRepo.delete(${id})`, 'DELETE')
      const response = await checklistApi.deleteChecklist({ id })

      if (response.errCode === 0) {
        logger.logRequestSuccess(reqId, 200, { id })
      } else {
        throw new Error(response.msg || '删除清单失败')
      }
    } catch (error) {
      logger.logRequestError(`ChecklistRepo.delete(${id})`, error)
      throw error
    }
  }

  /**
   * 获取清单的执行记录列表
   */
  static async getExecutionList(checklistId: number): Promise<ChecklistExecutionRecordEntity[]> {
    try {
      const reqId = logger.logRequestStart(`ChecklistRepo.getExecutionList(${checklistId})`, 'GET')
      const response = await checklistApi.getExecutionList({ checklistId, offset: 0, size: 100 })

      if (response.errCode === 0) {
        const executions = response.data.list || []
        logger.logRequestSuccess(reqId, 200, { count: executions.length })
        return executions
      } else {
        throw new Error(response.msg || '获取执行记录列表失败')
      }
    } catch (error) {
      logger.logRequestError(`ChecklistRepo.getExecutionList(${checklistId})`, error)
      throw error
    }
  }

  /**
   * 创建执行记录
   */
  static async createExecution(data: ChecklistExecutionForm): Promise<ChecklistExecutionRecordEntity> {
    try {
      const reqId = logger.logRequestStart('ChecklistRepo.createExecution', 'POST')
      const response = await checklistApi.createExecution(data)

      if (response.errCode === 0) {
        logger.logRequestSuccess(reqId, 201, { id: response.data.id })
        return response.data
      } else {
        throw new Error(response.msg || '创建执行记录失败')
      }
    } catch (error) {
      logger.logRequestError('ChecklistRepo.createExecution', error)
      throw error
    }
  }

  /**
   * 更新执行记录
   */
  static async updateExecution(id: number, data: Partial<ChecklistExecutionForm>): Promise<ChecklistExecutionRecordEntity> {
    try {
      const reqId = logger.logRequestStart(`ChecklistRepo.updateExecution(${id})`, 'PUT')
      
      // 过滤掉undefined值
      const updateData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
      ) as Partial<ChecklistExecutionForm>

      const response = await checklistApi.updateExecution({ id, ...updateData })

      if (response.errCode === 0) {
        logger.logRequestSuccess(reqId, 200, { id })
        return response.data
      } else {
        throw new Error(response.msg || '更新执行记录失败')
      }
    } catch (error) {
      logger.logRequestError(`ChecklistRepo.updateExecution(${id})`, error)
      throw error
    }
  }

  /**
   * 删除执行记录
   */
  static async deleteExecution(id: number): Promise<void> {
    try {
      const reqId = logger.logRequestStart(`ChecklistRepo.deleteExecution(${id})`, 'DELETE')
      const response = await checklistApi.deleteExecution({ id })

      if (response.errCode === 0) {
        logger.logRequestSuccess(reqId, 200, { id })
      } else {
        throw new Error(response.msg || '删除执行记录失败')
      }
    } catch (error) {
      logger.logRequestError(`ChecklistRepo.deleteExecution(${id})`, error)
      throw error
    }
  }
}

