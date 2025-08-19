// Central exports for utility functions
export { ResponseHelper } from './response'
export { validate, validateRequired, commonSchemas, authSchemas, boardSchemas, listSchemas, taskSchemas, paramSchemas, querySchemas } from './validation'
export type { ValidationResult } from './validation'
export { logger, requestLogger, LogLevel } from './logger'

// Additional utility functions
export function generateId(): string {
  return crypto.randomUUID()
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function parseBoolean(value: string | undefined): boolean {
  return value === 'true' || value === '1'
}

export function parseNumber(value: string | undefined, defaultValue: number = 0): number {
  const parsed = parseInt(value || '', 10)
  return isNaN(parsed) ? defaultValue : parsed
}

export function truncateString(str: string, length: number): string {
  return str.length > length ? `${str.substring(0, length)}...` : str
}

export function removeNullValues<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      result[key as keyof T] = value
    }
  }
  return result
}

export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return defaultValue
  }
}