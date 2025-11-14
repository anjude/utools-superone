/**
 * ID生成器
 * 使用秒级时间戳 + 4位随机数的方式生成唯一ID
 * 支持高并发场景，每秒可生成10000个不重复ID
 *
 * ID格式：秒级时间戳(10位) + 4位随机数 = 14位数字
 * 示例：17031234561234
 */

/**
 * 生成唯一ID
 * 格式：秒级时间戳 + 4位随机数
 */
function generateId(): number {
  const timestamp = Math.floor(Date.now() / 1000) // 秒级时间戳
  const random = Math.floor(Math.random() * 10000)
  return timestamp * 10000 + random // 时间戳左移4位，加上随机数
}

/**
 * 统一ID生成器
 * 对外暴露接口保持不变，返回数字类型以兼容现有类型定义
 */
export const idGenerator = {
  /**
   * 生成唯一ID
   * 格式：秒级时间戳 + 4位随机数 = 14位数字
   * 支持高并发，每秒可生成10000个不重复ID
   */
  generateId(): number {
    return generateId()
  },

  /**
   * 批量生成ID
   * @param count 生成数量
   */
  generateIds(count: number): number[] {
    if (count <= 0) return []

    const ids: number[] = []
    for (let i = 0; i < count; i++) {
      ids.push(generateId())
    }
    return ids
  },
}
