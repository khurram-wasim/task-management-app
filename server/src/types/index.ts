// Central exports for all types
export * from './api'
export * from './database'

// Environment configuration types
export interface EnvConfig {
  PORT: number
  NODE_ENV: 'development' | 'production' | 'test'
  FRONTEND_URL: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  JWT_SECRET: string
  JWT_EXPIRES_IN: string
  DATABASE_URL: string | undefined
}

// Service layer types
export interface ServiceResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

// Middleware types
export interface AuthTokenPayload {
  sub: string // user id
  email: string
  aud: string
  role: string
  iat: number
  exp: number
}

// Real-time service types
export interface RealtimeClient {
  userId: string
  boardIds: string[]
  lastActivity: Date
}

export interface RealtimeSubscription {
  id: string
  boardId: string
  userId: string
  type: 'board' | 'list' | 'task'
  callback: (payload: any) => void
}

// Error handling types
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly isOperational: boolean

  constructor(message: string, statusCode: number, code: string, isOperational = true) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

// Common constants
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const