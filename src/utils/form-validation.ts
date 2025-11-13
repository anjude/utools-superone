/**
 * 表单验证工具函数
 * 提供统一的表单验证逻辑
 */

import { logger } from '@/utils/logger'

/**
 * 验证文本字段
 * @param value 字段值
 * @param fieldName 字段名称
 * @param options 验证选项
 */
export const validateTextField = (
  value: string | undefined | null,
  fieldName: string,
  options: {
    required?: boolean
    minLength?: number
    maxLength?: number
    trim?: boolean
  } = {}
): { isValid: boolean; message?: string } => {
  const { required = false, minLength = 1, maxLength = 50, trim = true } = options
  
  const trimmedValue = trim ? value?.trim() : value
  
  // 必填验证
  if (required && (!trimmedValue || trimmedValue.length === 0)) {
    return {
      isValid: false,
      message: `请输入${fieldName}`
    }
  }
  
  // 长度验证
  if (trimmedValue && (trimmedValue.length < minLength || trimmedValue.length > maxLength)) {
    return {
      isValid: false,
      message: `${fieldName}长度应在${minLength}-${maxLength}个字符之间`
    }
  }
  
  return { isValid: true }
}

/**
 * 验证优先级字段
 * @param priority 优先级值
 * @param fieldName 字段名称
 */
export const validatePriority = (
  priority: number | undefined | null,
  fieldName: string = '优先级'
): { isValid: boolean; message?: string } => {
  if (!priority) {
    return {
      isValid: false,
      message: `请选择${fieldName}`
    }
  }
  
  return { isValid: true }
}

/**
 * 验证关键结果列表
 * @param keyResults 关键结果列表
 */
export const validateKeyResults = (
  keyResults: Array<{ title: string; description?: string }>
): { isValid: boolean; message?: string } => {
  if (!keyResults || keyResults.length === 0) {
    return {
      isValid: false,
      message: '至少需要添加一个关键结果'
    }
  }
  
  for (let i = 0; i < keyResults.length; i++) {
    const kr = keyResults[i]
    const titleValidation = validateTextField(kr.title, `第${i + 1}个关键结果的标题`, {
      required: true,
      minLength: 1,
      maxLength: 50
    })
    
    if (!titleValidation.isValid) {
      return {
        isValid: false,
        message: titleValidation.message
      }
    }
  }
  
  return { isValid: true }
}

/**
 * 显示验证错误提示
 * @param message 错误消息
 */
export const showValidationError = (message: string): void => {
  logger.warn('表单验证失败', { message })
  uni.showToast({
    title: message,
    icon: 'none',
    duration: 2000,
  })
}

/**
 * 通用表单验证函数
 * @param validations 验证结果数组
 */
export const validateForm = (validations: Array<{ isValid: boolean; message?: string }>): boolean => {
  const failedValidation = validations.find(v => !v.isValid)
  
  if (failedValidation) {
    showValidationError(failedValidation.message!)
    return false
  }
  
  return true
}
