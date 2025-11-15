import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RecentTask, RecentTaskForm } from '@/types/plan'
import { TaskEnums } from '@/types/plan'
import { RecentTaskRepo } from '@/repos/plan-repo'
import { CacheManager } from '@/utils/cache-manager'
import { CACHE_KEYS } from './cache'
import { logger } from '@/utils/logger'

/**
 * 计划状态管理 Store
 * 管理任务列表、状态筛选、CRUD 操作
 */
export const usePlanStore = defineStore('plan', () => {
  // 任务列表相关状态
  const tasks = ref<RecentTask[]>([])
  const loading = ref(false)
  const error = ref<string>('')

  // 状态筛选相关状态
  const selectedStatusList = ref<TaskEnums.Status[]>([])

  // 计算属性：根据状态筛选过滤任务
  const filteredTasks = computed(() => {
    if (selectedStatusList.value.length === 0) {
      // 如果没有选中任何状态，显示所有任务
      return tasks.value
    }
    return tasks.value.filter(task => selectedStatusList.value.includes(task.status))
  })

  // 初始化状态筛选（从缓存加载）
  const initStatusFilter = () => {
    const cachedStatusList = CacheManager.get<TaskEnums.Status[]>(
      CACHE_KEYS.SELECTED_PLAN_STATUS_FILTER,
      [],
      true
    )
    if (cachedStatusList && cachedStatusList.length > 0) {
      selectedStatusList.value = cachedStatusList
    } else {
      // 默认显示所有状态
      selectedStatusList.value = []
    }
  }

  // 加载任务列表
  const loadTasks = async (params?: {
    offset?: number
    size?: number
    status?: TaskEnums.Status
    statusList?: TaskEnums.Status[]
    priority?: TaskEnums.Priority
    keyword?: string
  }): Promise<void> => {
    loading.value = true
    error.value = ''
    try {
      const data = await RecentTaskRepo.getAll(params)
      // 按置顶权重和创建时间排序：置顶的在前，同置顶权重按创建时间倒序
      tasks.value = data.sort((a, b) => {
        if (a.top !== b.top) {
          return b.top - a.top // 置顶权重大的在前
        }
        return b.createTime - a.createTime // 创建时间新的在前
      })

      logger.info('任务列表加载成功', { count: tasks.value.length })
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载任务列表失败'
      logger.error('加载任务列表失败', { error: err })
      throw err
    } finally {
      loading.value = false
    }
  }

  // 根据ID获取任务
  const getTaskById = async (id: number): Promise<RecentTask | null> => {
    try {
      return await RecentTaskRepo.getById(id)
    } catch (err) {
      logger.error('获取任务失败', { error: err, id })
      throw err
    }
  }

  // 创建任务
  const createTask = async (data: RecentTaskForm): Promise<RecentTask> => {
    try {
      const newTask = await RecentTaskRepo.create(data)
      // 重新加载列表
      await loadTasks()
      logger.info('任务创建成功', { id: newTask.id })
      return newTask
    } catch (err) {
      logger.error('创建任务失败', { error: err })
      throw err
    }
  }

  // 更新任务
  const updateTask = async (id: number, data: Partial<RecentTaskForm>): Promise<RecentTask> => {
    try {
      const updatedTask = await RecentTaskRepo.update(id, data)
      // 重新加载列表
      await loadTasks()
      logger.info('任务更新成功', { id })
      return updatedTask
    } catch (err) {
      logger.error('更新任务失败', { error: err, id })
      throw err
    }
  }

  // 更新任务状态
  const updateTaskStatus = async (id: number, status: TaskEnums.Status): Promise<RecentTask> => {
    try {
      const updatedTask = await RecentTaskRepo.update(id, { status })
      // 更新本地状态
      const taskIndex = tasks.value.findIndex(t => t.id === id)
      if (taskIndex !== -1) {
        tasks.value[taskIndex] = updatedTask
        // 重新排序
        tasks.value.sort((a, b) => {
          if (a.top !== b.top) {
            return b.top - a.top
          }
          return b.createTime - a.createTime
        })
      }
      logger.info('任务状态更新成功', { id, status })
      return updatedTask
    } catch (err) {
      logger.error('更新任务状态失败', { error: err, id, status })
      throw err
    }
  }

  // 删除任务
  const deleteTask = async (id: number): Promise<void> => {
    try {
      await RecentTaskRepo.delete(id)
      // 重新加载列表
      await loadTasks()
      logger.info('任务删除成功', { id })
    } catch (err) {
      logger.error('删除任务失败', { error: err, id })
      throw err
    }
  }

  // 切换状态筛选
  const toggleStatus = (status: TaskEnums.Status): void => {
    const index = selectedStatusList.value.indexOf(status)
    if (index > -1) {
      // 如果已选中，则取消选中
      selectedStatusList.value.splice(index, 1)
    } else {
      // 如果未选中，则添加
      selectedStatusList.value.push(status)
    }
    // 保存到缓存
    CacheManager.set(CACHE_KEYS.SELECTED_PLAN_STATUS_FILTER, selectedStatusList.value, true)
    logger.info('状态筛选已更新', { selectedStatusList: selectedStatusList.value })
  }

  // 设置状态筛选
  const setStatusFilter = (statusList: TaskEnums.Status[]): void => {
    selectedStatusList.value = statusList
    CacheManager.set(CACHE_KEYS.SELECTED_PLAN_STATUS_FILTER, statusList, true)
    logger.info('状态筛选已设置', { statusList })
  }

  // 初始化：加载状态筛选
  initStatusFilter()

  return {
    // 任务列表相关状态
    tasks,
    loading,
    error,
    filteredTasks,
    // 状态筛选相关状态
    selectedStatusList,
    // 任务相关方法
    loadTasks,
    getTaskById,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    // 状态筛选相关方法
    toggleStatus,
    setStatusFilter,
  }
})

