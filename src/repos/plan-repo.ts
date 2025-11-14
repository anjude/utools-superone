import { logger } from '@/utils/logger'
import { planApi } from '@/api/plan'
import type { RecentTask, Goal, RecentTaskForm, GoalForm } from '@/types/plan'
import { TaskEnums, OKREnums } from '@/types/plan'
import { ScheduleEnums } from '@/constants/enums'

/**
 * 近期任务仓储层
 */
export class RecentTaskRepo {
  /**
   * 获取所有近期任务
   */
  static async getAll(params?: {
    offset?: number
    size?: number
    status?: TaskEnums.Status
    statusList?: TaskEnums.Status[]
    priority?: TaskEnums.Priority
    keyword?: string
  }): Promise<RecentTask[]> {
    try {
      const reqId = logger.logRequestStart('RecentTaskRepo.getAll', 'GET')
      const response = await planApi.getRecentTaskList({
        offset: 0,
        size: 1000,
        ...params,
      })

      if (response.errCode !== 0) {
        throw new Error(response.msg || '获取近期任务列表失败')
      }

      const tasks = response.data?.list || []
      logger.logRequestSuccess(reqId, 200, { count: tasks.length })
      return tasks
    } catch (error) {
      logger.logRequestError('RecentTaskRepo.getAll', error)
      throw error
    }
  }

  /**
   * 根据ID获取近期任务
   */
  static async getById(id: number): Promise<RecentTask | null> {
    try {
      const reqId = logger.logRequestStart(`RecentTaskRepo.getById(${id})`, 'GET')
      const response = await planApi.getRecentTaskDetail({ id })

      if (response.errCode !== 0) {
        if (response.errCode === 404) {
          logger.logRequestSuccess(reqId, 404, { found: false })
          return null
        }
        throw new Error(response.msg || '获取近期任务详情失败')
      }

      const task = response.data
      logger.logRequestSuccess(reqId, 200, { found: true })
      return task || null
    } catch (error) {
      logger.logRequestError(`RecentTaskRepo.getById(${id})`, error)
      throw error
    }
  }

  /**
   * 创建近期任务
   */
  static async create(data: RecentTaskForm): Promise<RecentTask> {
    try {
      const reqId = logger.logRequestStart('RecentTaskRepo.create', 'POST')

      const response = await planApi.createRecentTask(data)

      if (response.errCode !== 0) {
        throw new Error(response.msg || '创建近期任务失败')
      }

      const newTask = response.data
      logger.logRequestSuccess(reqId, 201, { id: newTask.id })
      return newTask
    } catch (error) {
      logger.logRequestError('RecentTaskRepo.create', error)
      throw error
    }
  }

  /**
   * 更新近期任务
   */
  static async update(id: number, data: Partial<RecentTaskForm>): Promise<RecentTask> {
    try {
      const reqId = logger.logRequestStart(`RecentTaskRepo.update(${id})`, 'PUT')

      const response = await planApi.updateRecentTask({ id, ...data })

      if (response.errCode !== 0) {
        throw new Error(response.msg || '更新近期任务失败')
      }

      const updatedTask = response.data
      logger.logRequestSuccess(reqId, 200, { id })
      return updatedTask
    } catch (error) {
      logger.logRequestError(`RecentTaskRepo.update(${id})`, error)
      throw error
    }
  }

  /**
   * 删除近期任务
   */
  static async delete(id: number): Promise<void> {
    try {
      const reqId = logger.logRequestStart(`RecentTaskRepo.delete(${id})`, 'DELETE')
      const response = await planApi.deleteRecentTask({ id })

      if (response.errCode !== 0) {
        throw new Error(response.msg || '删除近期任务失败')
      }

      logger.logRequestSuccess(reqId, 200, { id })
    } catch (error) {
      logger.logRequestError(`RecentTaskRepo.delete(${id})`, error)
      throw error
    }
  }
}

/**
 * 统一目标仓储层
 */
export class GoalRepo {
  /**
   * 获取所有目标
   */
  static async getAll(params?: {
    offset?: number
    size?: number
    year?: number
    quarter?: ScheduleEnums.Quarter
    type?: OKREnums.Type
    status?: OKREnums.Status
    priority?: OKREnums.Priority
  }): Promise<Goal[]> {
    try {
      const reqId = logger.logRequestStart('GoalRepo.getAll', 'GET')
      const response = await planApi.getGoalList({
        offset: 0,
        size: 1000,
        ...params,
      })

      if (response.errCode !== 0) {
        throw new Error(response.msg || '获取目标列表失败')
      }

      const goals = response.data?.list || []
      logger.logRequestSuccess(reqId, 200, { count: goals.length })
      return goals
    } catch (error) {
      logger.logRequestError('GoalRepo.getAll', error)
      throw error
    }
  }

  /**
   * 根据ID获取目标
   */
  static async getById(id: number): Promise<Goal | null> {
    try {
      const reqId = logger.logRequestStart(`GoalRepo.getById(${id})`, 'GET')
      const response = await planApi.getGoalDetail({ id })

      if (response.errCode !== 0) {
        if (response.errCode === 404) {
          logger.logRequestSuccess(reqId, 404, { found: false })
          return null
        }
        throw new Error(response.msg || '获取目标详情失败')
      }

      const goal = response.data
      logger.logRequestSuccess(reqId, 200, { found: true })
      return goal || null
    } catch (error) {
      logger.logRequestError(`GoalRepo.getById(${id})`, error)
      throw error
    }
  }

  /**
   * 创建目标
   */
  static async create(data: GoalForm): Promise<Goal> {
    try {
      const reqId = logger.logRequestStart('GoalRepo.create', 'POST')

      const response = await planApi.createGoal(data)

      if (response.errCode !== 0) {
        throw new Error(response.msg || '创建目标失败')
      }

      const newGoal = response.data
      logger.logRequestSuccess(reqId, 201, { id: newGoal.id })
      return newGoal
    } catch (error) {
      logger.logRequestError('GoalRepo.create', error)
      throw error
    }
  }

  /**
   * 更新目标
   */
  static async update(id: number, data: Partial<GoalForm>): Promise<Goal> {
    try {
      const reqId = logger.logRequestStart(`GoalRepo.update(${id})`, 'PUT')

      const response = await planApi.updateGoal({
        id,
        ...data,
      })

      if (response.errCode !== 0) {
        throw new Error(response.msg || '更新目标失败')
      }

      const updatedGoal = response.data
      logger.logRequestSuccess(reqId, 200, { id })
      return updatedGoal
    } catch (error) {
      logger.logRequestError(`GoalRepo.update(${id})`, error)
      throw error
    }
  }

  /**
   * 删除目标
   */
  static async delete(id: number): Promise<void> {
    try {
      const reqId = logger.logRequestStart(`GoalRepo.delete(${id})`, 'DELETE')
      const response = await planApi.deleteGoal({ id })

      if (response.errCode !== 0) {
        throw new Error(response.msg || '删除目标失败')
      }

      logger.logRequestSuccess(reqId, 200, { id })
    } catch (error) {
      logger.logRequestError(`GoalRepo.delete(${id})`, error)
      throw error
    }
  }
}
