// Authentication middleware for protected routes
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { getSupabaseAnon } from '@/config/database'
import { env } from '@/config'
import { logger, ResponseHelper } from '@/utils'
import type { AuthenticatedRequest, AuthTokenPayload, SupabaseUser } from '@/types'

// JWT token verification
export async function verifyToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload
    return decoded
  } catch (error) {
    logger.error('JWT token verification failed', error instanceof Error ? error : new Error(String(error)))
    return null
  }
}

// Supabase JWT token verification (for tokens issued by Supabase)
export async function verifySupabaseToken(token: string): Promise<SupabaseUser | null> {
  try {
    const supabase = getSupabaseAnon()
    
    // Set the auth token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      logger.error('Supabase token verification failed', error || new Error('No user returned'))
      return null
    }
    
    return user as SupabaseUser
  } catch (error) {
    logger.error('Supabase token verification error', error instanceof Error ? error : new Error(String(error)))
    return null
  }
}

// Extract token from Authorization header
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization
  
  if (!authHeader) {
    return null
  }
  
  // Handle "Bearer token" format
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Handle direct token
  return authHeader
}

// Authentication middleware - verifies JWT token
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req)
    
    if (!token) {
      logger.warn('Authentication failed - no token provided', { 
        path: req.path, 
        method: req.method,
        ip: req.ip
      })
      ResponseHelper.unauthorized(res, 'Authentication token required')
      return
    }
    
    // First try to verify as our own JWT token
    const jwtPayload = await verifyToken(token)
    if (jwtPayload) {
      req.user = {
        id: jwtPayload.sub,
        email: jwtPayload.email,
        aud: jwtPayload.aud,
        role: jwtPayload.role
      }
      req.accessToken = token
      logger.debug('JWT authentication successful', { userId: req.user.id, email: req.user.email })
      return next()
    }
    
    // Fallback to Supabase token verification
    const supabaseUser = await verifySupabaseToken(token)
    if (supabaseUser) {
      req.user = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        aud: supabaseUser.aud,
        role: supabaseUser.role
      }
      req.accessToken = token
      logger.debug('Supabase authentication successful', { userId: req.user.id, email: req.user.email })
      return next()
    }
    
    // Both verification methods failed
    logger.warn('Authentication failed - invalid token', { 
      path: req.path, 
      method: req.method,
      ip: req.ip
    })
    ResponseHelper.unauthorized(res, 'Invalid authentication token')
  } catch (error) {
    logger.error('Authentication middleware error', error instanceof Error ? error : new Error(String(error)), {
      path: req.path,
      method: req.method
    })
    ResponseHelper.internalError(res, 'Authentication error')
  }
}

// Optional authentication middleware - doesn't fail if no token
export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req)
    
    if (!token) {
      // No token provided, continue without authentication
      return next()
    }
    
    // Try to verify token but don't fail if invalid
    const jwtPayload = await verifyToken(token)
    if (jwtPayload) {
      req.user = {
        id: jwtPayload.sub,
        email: jwtPayload.email,
        aud: jwtPayload.aud,
        role: jwtPayload.role
      }
      req.accessToken = token
      logger.debug('Optional JWT authentication successful', { userId: req.user.id })
      return next()
    }
    
    // Try Supabase token
    const supabaseUser = await verifySupabaseToken(token)
    if (supabaseUser) {
      req.user = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        aud: supabaseUser.aud,
        role: supabaseUser.role
      }
      req.accessToken = token
      logger.debug('Optional Supabase authentication successful', { userId: req.user.id })
      return next()
    }
    
    // Token provided but invalid - continue without auth
    logger.debug('Optional authentication - invalid token provided, continuing without auth')
    next()
  } catch (error) {
    logger.error('Optional authentication middleware error', error instanceof Error ? error : new Error(String(error)))
    // Continue without authentication on error
    next()
  }
}

// Role-based authorization middleware
export function requireRole(role: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseHelper.unauthorized(res, 'Authentication required')
      return
    }
    
    if (req.user.role !== role) {
      logger.warn('Authorization failed - insufficient role', {
        userId: req.user.id,
        requiredRole: role,
        userRole: req.user.role,
        path: req.path
      })
      ResponseHelper.forbidden(res, 'Insufficient permissions')
      return
    }
    
    logger.debug('Role authorization successful', { 
      userId: req.user.id, 
      role: req.user.role 
    })
    next()
  }
}

// Resource ownership middleware - ensures user can only access their own resources
export function requireOwnership(userIdField: string = 'user_id') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseHelper.unauthorized(res, 'Authentication required')
      return
    }
    
    // Extract resource user ID from request (params, body, or query)
    const resourceUserId = req.params[userIdField] || 
                          req.body?.[userIdField] || 
                          req.query?.[userIdField]
    
    if (!resourceUserId) {
      logger.warn('Ownership check failed - no resource user ID found', {
        userId: req.user.id,
        userIdField,
        path: req.path
      })
      ResponseHelper.badRequest(res, `Missing ${userIdField} parameter`)
      return
    }
    
    if (req.user.id !== resourceUserId) {
      logger.warn('Ownership check failed - resource belongs to different user', {
        userId: req.user.id,
        resourceUserId,
        path: req.path
      })
      ResponseHelper.forbidden(res, 'Access denied - resource belongs to another user')
      return
    }
    
    logger.debug('Ownership authorization successful', { 
      userId: req.user.id,
      resourceUserId
    })
    next()
  }
}

// Admin role middleware
export const requireAdmin = requireRole('admin')

// Service role middleware (for internal operations)
export const requireService = requireRole('service_role')

// Authenticated user middleware (any authenticated user)
export const requireUser = requireRole('authenticated')