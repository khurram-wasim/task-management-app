// Global error handling middleware
import { Request, Response, NextFunction } from 'express'
import { logger, ResponseHelper } from '@/utils'
import { AppError, ERROR_CODES, HTTP_STATUS } from '@/types'
import { env } from '@/config'

// Custom error class for application errors
export { AppError }

// Error handler middleware
export function errorHandler(
  error: Error,
  req: Request,
  res: Response
): void {
  logger.error('Global error handler', error, {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method !== 'GET' ? req.body : undefined
  })

  // Handle different types of errors
  if (error instanceof AppError) {
    ResponseHelper.error(res, error.code, error.message, error.statusCode)
    return
  }

  // Handle Supabase errors
  if (error.name === 'PostgrestError') {
    const pgError = error as any
    logger.error('Supabase database error', error, { code: pgError.code })
    
    switch (pgError.code) {
      case '23505': // Unique violation
        ResponseHelper.conflict(res, 'Resource already exists')
        return
      case '23503': // Foreign key violation
        ResponseHelper.badRequest(res, 'Invalid reference to related resource')
        return
      case '23502': // Not null violation
        ResponseHelper.badRequest(res, 'Missing required field')
        return
      case 'PGRST116': // No rows found
        ResponseHelper.notFound(res, 'Resource not found')
        return
      default:
        ResponseHelper.internalError(res, 'Database operation failed')
        return
    }
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    ResponseHelper.unauthorized(res, 'Invalid authentication token')
    return
  }

  if (error.name === 'TokenExpiredError') {
    ResponseHelper.unauthorized(res, 'Authentication token has expired')
    return
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    ResponseHelper.validationError(res, error.message)
    return
  }

  // Handle syntax errors (usually from JSON parsing)
  if (error instanceof SyntaxError && 'status' in error && error.status === 400) {
    ResponseHelper.badRequest(res, 'Invalid JSON format')
    return
  }

  // Handle timeout errors
  if (error.name === 'TimeoutError') {
    ResponseHelper.error(res, ERROR_CODES.INTERNAL_ERROR, 'Request timeout', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    return
  }

  // Default error response
  const statusCode = (error as any).statusCode || (error as any).status || HTTP_STATUS.INTERNAL_SERVER_ERROR
  const message = env.NODE_ENV === 'production' ? 'Internal server error' : error.message
  
  ResponseHelper.error(res, ERROR_CODES.INTERNAL_ERROR, message, statusCode)
}

// Async error wrapper - wraps async route handlers to catch errors
export function asyncHandler<T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: T, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// Not found middleware (404 handler)
export function notFoundHandler(req: Request, res: Response): void {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    ip: req.ip
  })

  ResponseHelper.notFound(res, `Route ${req.method} ${req.path} not found`)
}

// Request timeout middleware
export function timeoutHandler(timeout: number = 30000) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const timer = setTimeout(() => {
      const error = new AppError('Request timeout', HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.INTERNAL_ERROR)
      next(error)
    }, timeout)

    // Clear timeout when response finishes
    res.on('finish', () => {
      clearTimeout(timer)
    })

    next()
  }
}

// Rate limit error handler
export function rateLimitHandler(req: Request, res: Response): void {
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    path: req.path,
    method: req.method
  })

  ResponseHelper.error(
    res,
    ERROR_CODES.RATE_LIMIT_EXCEEDED,
    'Too many requests, please try again later',
    HTTP_STATUS.INTERNAL_SERVER_ERROR
  )
}

// CORS error handler
export function corsErrorHandler(req: Request, res: Response): void {
  logger.warn('CORS policy violation', {
    origin: req.get('Origin'),
    path: req.path,
    method: req.method
  })

  ResponseHelper.forbidden(res, 'CORS policy violation')
}

// Create application error factory functions
export const createValidationError = (message: string): AppError => 
  new AppError(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, ERROR_CODES.VALIDATION_ERROR)

export const createAuthError = (message: string = 'Authentication failed'): AppError =>
  new AppError(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_ERROR)

export const createAuthorizationError = (message: string = 'Access denied'): AppError =>
  new AppError(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR)

export const createNotFoundError = (resource: string = 'Resource'): AppError =>
  new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND)

export const createConflictError = (message: string = 'Resource conflict'): AppError =>
  new AppError(message, HTTP_STATUS.CONFLICT, ERROR_CODES.RESOURCE_CONFLICT)

export const createDatabaseError = (message: string = 'Database operation failed'): AppError =>
  new AppError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.DATABASE_ERROR)

export const createForbiddenError = (message: string = 'Access forbidden'): AppError =>
  new AppError(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_ERROR)