// Logging utility for structured logging
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any> | undefined
  error?: {
    name: string
    message: string
    stack?: string | undefined
  }
}

class Logger {
  private isDevelopment = process.env['NODE_ENV'] === 'development'
  private isTest = process.env['NODE_ENV'] === 'test'

  private formatLogEntry(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Pretty format for development
      const timestamp = new Date(entry.timestamp).toLocaleTimeString()
      const level = entry.level.toUpperCase().padEnd(5)
      let message = `[${timestamp}] ${level} ${entry.message}`
      
      if (entry.context) {
        message += `\n${JSON.stringify(entry.context, null, 2)}`
      }
      
      if (entry.error) {
        message += `\nError: ${entry.error.name}: ${entry.error.message}`
        if (entry.error.stack) {
          message += `\n${entry.error.stack}`
        }
      }
      
      return message
    }
    
    // JSON format for production
    return JSON.stringify(entry)
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (this.isTest) {
      return // Suppress logs during testing
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context !== undefined && { context }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack ?? undefined
        }
      })
    }

    const formattedMessage = this.formatLogEntry(entry)

    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage)
        break
      case LogLevel.WARN:
        console.warn(formattedMessage)
        break
      case LogLevel.INFO:
        console.info(formattedMessage)
        break
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(formattedMessage)
        }
        break
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error)
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context)
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context)
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  // Request logging helper
  request(method: string, url: string, statusCode: number, responseTime: number, userId?: string): void {
    this.info('HTTP Request', {
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
      userId
    })
  }

  // Database operation logging
  database(operation: string, table: string, duration: number, recordCount?: number): void {
    this.debug('Database Operation', {
      operation,
      table,
      duration: `${duration}ms`,
      recordCount
    })
  }

  // Authentication logging
  auth(action: string, email: string, success: boolean, reason?: string): void {
    this.info('Authentication', {
      action,
      email,
      success,
      reason
    })
  }

  // Real-time logging
  realtime(event: string, boardId?: string, userId?: string, connectionCount?: number): void {
    this.debug('Real-time Event', {
      event,
      boardId,
      userId,
      connectionCount
    })
  }
}

export const logger = new Logger()

// Express middleware for request logging
export function requestLogger() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now()
    
    res.on('finish', () => {
      const responseTime = Date.now() - startTime
      logger.request(
        req.method,
        req.originalUrl,
        res.statusCode,
        responseTime,
        req.user?.id
      )
    })
    
    next()
  }
}