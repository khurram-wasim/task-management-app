// Security middleware functions
import { Request, Response, NextFunction } from 'express'
import { env } from '@/config'
import { logger, ResponseHelper } from '@/utils'

// HTTPS redirect middleware
export function httpsRedirect(req: Request, res: Response, next: NextFunction): void {
  if (env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    logger.warn('HTTP request redirected to HTTPS', { 
      url: req.url, 
      ip: req.ip 
    })
    return res.redirect(`https://${req.header('host')}${req.url}`)
  }
  next()
}

// API key validation middleware
export function validateApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string
  const expectedApiKey = process.env['API_KEY']

  if (!expectedApiKey) {
    // No API key configured, skip validation
    return next()
  }

  if (!apiKey || apiKey !== expectedApiKey) {
    logger.warn('Invalid API key provided', { 
      ip: req.ip, 
      path: req.path,
      providedKey: apiKey ? `${apiKey.slice(0, 8)}...` : 'none'
    })
    ResponseHelper.unauthorized(res, 'Valid API key required')
    return
  }

  logger.debug('API key validation successful', { ip: req.ip })
  next()
}

// Content type validation middleware
export function validateContentType(allowedTypes: string[] = ['application/json']) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip validation for GET requests and requests without body
    if (req.method === 'GET' || !req.body || Object.keys(req.body).length === 0) {
      return next()
    }

    const contentType = req.headers['content-type']?.split(';')[0]
    
    if (!contentType || !allowedTypes.includes(contentType)) {
      logger.warn('Invalid content type', { 
        provided: contentType,
        allowed: allowedTypes,
        path: req.path,
        method: req.method
      })
      ResponseHelper.badRequest(res, `Content-Type must be one of: ${allowedTypes.join(', ')}`)
      return
    }

    next()
  }
}

// Request size limit middleware
export function requestSizeLimit(maxSize: string = '1mb') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10)
    const maxSizeBytes = parseSize(maxSize)

    if (contentLength > maxSizeBytes) {
      logger.warn('Request size limit exceeded', {
        size: contentLength,
        limit: maxSizeBytes,
        path: req.path,
        ip: req.ip
      })
      ResponseHelper.badRequest(res, `Request size exceeds limit of ${maxSize}`)
      return
    }

    next()
  }
}

// IP whitelist middleware
export function ipWhitelist(allowedIPs: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.socket.remoteAddress || 'unknown'
    
    if (!allowedIPs.includes(clientIP)) {
      logger.warn('IP address not whitelisted', { 
        ip: clientIP,
        allowed: allowedIPs,
        path: req.path
      })
      ResponseHelper.forbidden(res, 'Access denied from this IP address')
      return
    }

    logger.debug('IP whitelist check passed', { ip: clientIP })
    next()
  }
}

// User agent validation middleware
export function validateUserAgent(req: Request, res: Response, next: NextFunction): void {
  const userAgent = req.headers['user-agent']
  
  // Block requests with suspicious or missing user agents
  if (!userAgent || userAgent.length < 3) {
    logger.warn('Suspicious or missing User-Agent', { 
      userAgent,
      ip: req.ip,
      path: req.path
    })
    ResponseHelper.badRequest(res, 'Valid User-Agent header required')
    return
  }

  // Block known bad user agents
  const suspiciousAgents = [
    'curl', 'wget', 'python-requests', 'bot', 'crawler', 'spider'
  ]
  
  const lowerUA = userAgent.toLowerCase()
  if (suspiciousAgents.some(agent => lowerUA.includes(agent))) {
    logger.warn('Blocked suspicious User-Agent', { 
      userAgent,
      ip: req.ip,
      path: req.path
    })
    ResponseHelper.forbidden(res, 'Access denied')
    return
  }

  next()
}

// Request ID middleware
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const existingId = req.headers['x-request-id'] as string
  const reqId = existingId || generateRequestId()
  
  // Extend the request object with requestId
  ;(req as any).requestId = reqId
  res.setHeader('X-Request-ID', reqId)
  
  next()
}

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

// Parse size string (e.g., '1mb', '500kb') to bytes
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  }
  
  const match = size.toLowerCase().match(/^(\d+)(b|kb|mb|gb)$/)
  if (!match) {
    throw new Error(`Invalid size format: ${size}`)
  }
  
  const numStr = match[1]
  const unitStr = match[2]
  if (!numStr || !unitStr || !(unitStr in units)) {
    throw new Error(`Invalid size format: ${size}`)
  }
  return parseInt(numStr, 10) * (units[unitStr] || 1)
}

// Development only middleware
export function devOnly(_req: Request, res: Response, next: NextFunction): void {
  if (env.NODE_ENV !== 'development') {
    ResponseHelper.notFound(res, 'Route not found')
    return
  }
  next()
}

// Production only middleware
export function prodOnly(_req: Request, res: Response, next: NextFunction): void {
  if (env.NODE_ENV !== 'production') {
    ResponseHelper.notFound(res, 'Route not found')
    return
  }
  next()
}