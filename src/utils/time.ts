/**
 * 时间工具函数
 * 符合数据模型规范：统一使用秒级时间戳
 */

/**
 * 获取当前时间戳（秒级）
 */
export const getCurrentTimestamp = (): number => {
  return Math.floor(Date.now() / 1000)
}

/**
 * 将日期字符串转换为时间戳（秒级）
 * @param dateString 日期字符串，格式：YYYY-MM-DD
 * @returns 时间戳（秒级）
 */
export const dateStringToTimestamp = (dateString: string): number => {
  const date = new Date(dateString)
  return Math.floor(date.getTime() / 1000)
}

/**
 * 将时间戳（秒级）转换为日期字符串
 * @param timestamp 时间戳（秒级）
 * @returns 日期字符串，格式：YYYY-MM-DD
 */
export const timestampToDateString = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  return date.toISOString().split('T')[0]
}

/**
 * 将时间戳（秒级）转换为中文格式的日期时间字符串
 * @param timestamp 时间戳（秒级）
 * @returns 中文格式的日期时间字符串，格式：YYYY年MM月DD日 HH:mm
 */
export const timestampToChineseDateTime = (timestamp: number): string => {
  // 检查时间戳是否为有效值
  if (!timestamp || timestamp <= 0) {
    return '时间无效'
  }

  // 如果时间戳看起来像毫秒级（大于10000000000），转换为秒级
  let timestampInSeconds = timestamp
  if (timestamp > 10000000000) {
    timestampInSeconds = Math.floor(timestamp / 1000)
  }

  const date = new Date(timestampInSeconds * 1000)

  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return '时间格式错误'
  }

  // 手动格式化日期，确保中文显示
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}年${month}月${day}日 ${hours}:${minutes}`
}

/**
 * 将时间戳（秒级）转换为中文格式的完整日期时间字符串（包含秒）
 * @param timestamp 时间戳（秒级）
 * @returns 中文格式的日期时间字符串，格式：YYYY年MM月DD日 HH:mm:ss
 */
export const timestampToChineseDateTimeWithSeconds = (timestamp: number): string => {
  // 检查时间戳是否为有效值
  if (!timestamp || timestamp <= 0) {
    return '时间无效'
  }

  // 如果时间戳看起来像毫秒级（大于10000000000），转换为秒级
  let timestampInSeconds = timestamp
  if (timestamp > 10000000000) {
    timestampInSeconds = Math.floor(timestamp / 1000)
  }

  const date = new Date(timestampInSeconds * 1000)

  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return '时间格式错误'
  }

  // 手动格式化日期，确保中文显示（包含秒）
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`
}

/**
 * 将时间戳（秒级）转换为可读的日期时间字符串
 * @param timestamp 时间戳（秒级）
 * @returns 日期时间字符串，格式：YYYY-MM-DD HH:mm:ss
 */
export const timestampToDateTimeString = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 获取相对时间描述
 * @param timestamp 时间戳（秒级）
 * @returns 相对时间描述，如：刚刚、5分钟前、2小时前等
 */
export const getRelativeTime = (timestamp: number): string => {
  const now = getCurrentTimestamp()
  const diff = now - timestamp

  if (diff < 60) {
    return '刚刚'
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60)
    return `${minutes}分钟前`
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600)
    return `${hours}小时前`
  } else if (diff < 2592000) {
    const days = Math.floor(diff / 86400)
    return `${days}天前`
  } else if (diff < 31536000) {
    const months = Math.floor(diff / 2592000)
    return `${months}个月前`
  } else {
    const years = Math.floor(diff / 31536000)
    return `${years}年前`
  }
}

/**
 * 格式化时间显示
 * @param timestamp 时间戳（秒级）
 * @param format 格式类型：'date' | 'datetime' | 'relative'
 * @returns 格式化后的时间字符串
 */
export const formatTime = (
  timestamp: number,
  format: 'date' | 'datetime' | 'relative' = 'date'
): string => {
  switch (format) {
    case 'date':
      return timestampToDateString(timestamp)
    case 'datetime':
      return timestampToDateTimeString(timestamp)
    case 'relative':
      return getRelativeTime(timestamp)
    default:
      return timestampToDateString(timestamp)
  }
}

/**
 * 智能格式化（用于卡片元信息等紧凑展示）
 * - 今天：返回 HH:mm
 * - 今年：返回 MM-DD
 * - 其他：返回 YYYY-MM-DD
 */
export const formatTimeSmart = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (isSameDay) {
    const h = String(date.getHours()).padStart(2, '0')
    const m = String(date.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  }

  const isSameYear = date.getFullYear() === now.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')

  if (isSameYear) {
    return `${mm}-${dd}`
  }

  return `${date.getFullYear()}-${mm}-${dd}`
}

/**
 * 详细时间格式化（用于日志卡片等需要精确时间的场景）
 * 始终返回完整的年月日时分秒格式：YYYY-MM-DD HH:mm:ss
 */
export const formatTimeDetailed = (timestamp: number): string => {
  // 检查时间戳是否为有效值
  if (!timestamp || timestamp <= 0) {
    return '时间无效'
  }

  // 如果时间戳看起来像毫秒级（大于10000000000），转换为秒级
  let timestampInSeconds = timestamp
  if (timestamp > 10000000000) {
    timestampInSeconds = Math.floor(timestamp / 1000)
  }

  const date = new Date(timestampInSeconds * 1000)

  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return '时间格式错误'
  }

  // 格式化年月日时分秒
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 截止时间友好格式化（用于任务截止时间展示）
 * - 今天：返回 "今天"
 * - 明天：返回 "明天"
 * - 昨天：返回 "昨天"
 * - 未来：返回 "X天后"
 * - 过去：返回 "X天前"
 * - 超过30天：返回具体日期
 */
export const formatDeadline = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  const today = new Date()

  // 重置时间为当天开始
  today.setHours(0, 0, 0, 0)
  const deadlineDate = new Date(date)
  deadlineDate.setHours(0, 0, 0, 0)

  const diffTime = deadlineDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '明天'
  if (diffDays === -1) return '昨天'
  if (diffDays > 0) return `${diffDays}天后`
  if (diffDays < 0) return `${Math.abs(diffDays)}天前`

  // 如果超过30天，显示具体日期
  return formatTimeSmart(timestamp)
}

/**
 * 判断任务是否过期（以天为单位比较）
 * @param deadline 截止时间戳（秒级）
 * @param completed 是否已完成
 * @returns 是否过期
 */
export const isTaskOverdue = (deadline: number, completed: boolean = false): boolean => {
  if (!deadline || completed) {
    return false
  }

  const deadlineDate = new Date(deadline * 1000)
  const today = new Date()

  // 重置时间为当天开始，以天为单位比较
  today.setHours(0, 0, 0, 0)
  deadlineDate.setHours(0, 0, 0, 0)

  if (!Number.isFinite(deadline) || deadline <= 0) {
    return false
  }

  // 如果截止日期在今天之前（不包括今天），才算过期
  return deadlineDate < today
}

/**
 * 验证时间戳是否有效
 * @param timestamp 时间戳（秒级）
 * @returns 是否为有效的时间戳
 */
export const isValidTimestamp = (timestamp: number): boolean => {
  return (
    typeof timestamp === 'number' && !isNaN(timestamp) && timestamp > 0 && timestamp < 4102444800
  ) // 2100年1月1日的时间戳
}

/**
 * 兼容旧数据：将字符串格式的时间转换为时间戳
 * @param timeValue 时间值，可能是字符串或数字
 * @returns 时间戳（秒级）
 */
export const normalizeTimeValue = (timeValue: string | number): number => {
  if (typeof timeValue === 'number') {
    // 如果已经是数字，检查是否为毫秒级时间戳
    if (timeValue > 10000000000) {
      // 毫秒级时间戳，转换为秒级
      return Math.floor(timeValue / 1000)
    }
    return timeValue
  }

  if (typeof timeValue === 'string') {
    // 字符串格式，转换为时间戳
    return dateStringToTimestamp(timeValue)
  }

  // 默认返回当前时间戳
  return getCurrentTimestamp()
}
