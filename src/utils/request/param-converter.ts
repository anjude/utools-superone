// 参数命名风格转换工具

export class ParamConverter {
  static toSnakeCase(obj: any): any {
    if (obj === null || obj === undefined) return obj
    if (typeof obj !== 'object') return obj
    if (Array.isArray(obj)) {
      return obj.map(item => this.toSnakeCase(item))
    }

    const result: Record<string, any> = {}
    Object.keys(obj).forEach(key => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
      result[snakeKey] = this.toSnakeCase(obj[key])
    })
    return result
  }

  static toCamelCase(obj: any): any {
    if (obj === null || obj === undefined) return obj
    if (typeof obj !== 'object') return obj
    if (Array.isArray(obj)) {
      return obj.map(item => this.toCamelCase(item))
    }

    const result: Record<string, any> = {}
    Object.keys(obj).forEach(key => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
      result[camelKey] = this.toCamelCase(obj[key])
    })
    return result
  }
}

export default ParamConverter
