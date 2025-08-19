// Utility functions for standardized API responses
import { Response } from 'express'
import { ApiResponse, HTTP_STATUS } from '@/types'

export class ResponseHelper {
  static success<T>(
    res: Response,
    data?: T,
    message?: string,
    statusCode: number = HTTP_STATUS.OK
  ): Response<ApiResponse<T>> {
    const response: ApiResponse<T> = {
      success: true,
      ...(data !== undefined && { data }),
      ...(message !== undefined && { message }),
      meta: {
        timestamp: new Date().toISOString(),
      },
    }

    return res.status(statusCode).json(response)
  }

  static created<T>(
    res: Response,
    data?: T,
    message?: string
  ): Response<ApiResponse<T>> {
    return this.success(res, data, message, HTTP_STATUS.CREATED)
  }

  static noContent(res: Response): Response {
    return res.status(HTTP_STATUS.NO_CONTENT).send()
  }

  static error(
    res: Response,
    code: string,
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    details?: any
  ): Response<ApiResponse> {
    const response: ApiResponse = {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    }

    return res.status(statusCode).json(response)
  }

  static badRequest(
    res: Response,
    message: string = 'Bad Request',
    details?: any
  ): Response<ApiResponse> {
    return this.error(res, 'BAD_REQUEST', message, HTTP_STATUS.BAD_REQUEST, details)
  }

  static unauthorized(
    res: Response,
    message: string = 'Unauthorized'
  ): Response<ApiResponse> {
    return this.error(res, 'UNAUTHORIZED', message, HTTP_STATUS.UNAUTHORIZED)
  }

  static forbidden(
    res: Response,
    message: string = 'Forbidden'
  ): Response<ApiResponse> {
    return this.error(res, 'FORBIDDEN', message, HTTP_STATUS.FORBIDDEN)
  }

  static notFound(
    res: Response,
    message: string = 'Resource not found'
  ): Response<ApiResponse> {
    return this.error(res, 'NOT_FOUND', message, HTTP_STATUS.NOT_FOUND)
  }

  static conflict(
    res: Response,
    message: string = 'Resource already exists'
  ): Response<ApiResponse> {
    return this.error(res, 'CONFLICT', message, HTTP_STATUS.CONFLICT)
  }

  static validationError(
    res: Response,
    message: string = 'Validation failed',
    details?: any
  ): Response<ApiResponse> {
    return this.error(res, 'VALIDATION_ERROR', message, HTTP_STATUS.UNPROCESSABLE_ENTITY, details)
  }

  static internalError(
    res: Response,
    message: string = 'Internal server error'
  ): Response<ApiResponse> {
    return this.error(res, 'INTERNAL_ERROR', message, HTTP_STATUS.INTERNAL_SERVER_ERROR)
  }

  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
  ): Response<ApiResponse<T[]>> {
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    const response: ApiResponse<T[]> = {
      success: true,
      data,
      ...(message !== undefined && { message }),
      meta: {
        timestamp: new Date().toISOString(),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev,
        },
      },
    }

    return res.status(HTTP_STATUS.OK).json(response)
  }
}