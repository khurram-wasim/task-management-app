// Authentication service using Supabase Auth
import jwt from 'jsonwebtoken'
import { getSupabaseAdmin } from '@/config/database'
import { env, CONFIG } from '@/config'
import { logger } from '@/utils'
import { AppError, ERROR_CODES, ServiceResponse, AuthTokenPayload } from '@/types'

export interface AuthUser {
  id: string
  email: string
  fullName?: string
  createdAt: string
  updatedAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
  expiresIn: string
}

export interface RegisterData {
  email: string
  password: string
  fullName?: string | undefined
}

export interface LoginData {
  email: string
  password: string
}

export class AuthService {
  private readonly supabase = getSupabaseAdmin()

  // Register a new user using Supabase Auth
  async register(data: RegisterData): Promise<ServiceResponse<{ user: AuthUser; tokens: AuthTokens }>> {
    const startTime = performance.now()
    
    try {
      const { email, password, fullName } = data
      
      // Validate password strength
      if (!this.isPasswordStrong(password)) {
        return {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Password must be at least 8 characters long and contain uppercase, lowercase, and numbers'
          }
        }
      }

      // Create user with Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: true, // Auto-confirm for development
        user_metadata: {
          full_name: fullName || null
        }
      })

      if (authError || !authData.user) {
        logger.error('Error creating user with Supabase Auth', authError || new Error('Unknown auth error'))
        
        // Handle specific Supabase Auth errors
        if (authError?.message?.includes('already registered')) {
          return {
            success: false,
            error: {
              code: ERROR_CODES.RESOURCE_CONFLICT,
              message: 'User with this email already exists'
            }
          }
        }
        
        return {
          success: false,
          error: {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: authError?.message || 'Failed to create user'
          }
        }
      }

      // Create our own JWT tokens for the API
      const tokens = this.generateTokens({
        sub: authData.user.id,
        email: authData.user.email!,
        aud: 'authenticated',
        role: 'authenticated'
      })

      const user: AuthUser = {
        id: authData.user.id,
        email: authData.user.email!,
        fullName: authData.user.user_metadata?.['full_name'],
        createdAt: authData.user.created_at,
        updatedAt: authData.user.updated_at || authData.user.created_at
      }

      logger.info('User registered successfully', {
        userId: authData.user.id,
        email: authData.user.email,
        duration: `${performance.now() - startTime}ms`
      })

      return {
        success: true,
        data: { user, tokens }
      }

    } catch (error) {
      logger.error('Registration service error', error instanceof Error ? error : new Error(String(error)))
      
      if (error instanceof AppError) {
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        }
      }

      return {
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Registration failed'
        }
      }
    }
  }

  // Login user using Supabase Auth
  async login(data: LoginData): Promise<ServiceResponse<{ user: AuthUser; tokens: AuthTokens }>> {
    const startTime = performance.now()
    
    try {
      const { email, password } = data

      // Sign in user with Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password
      })

      if (authError || !authData.user) {
        logger.warn('Login attempt failed', { email, error: authError?.message })
        
        return {
          success: false,
          error: {
            code: ERROR_CODES.AUTHENTICATION_ERROR,
            message: 'Invalid email or password'
          }
        }
      }

      // Create our own JWT tokens for the API
      const tokens = this.generateTokens({
        sub: authData.user.id,
        email: authData.user.email!,
        aud: 'authenticated',
        role: 'authenticated'
      })

      const user: AuthUser = {
        id: authData.user.id,
        email: authData.user.email!,
        fullName: authData.user.user_metadata?.['full_name'],
        createdAt: authData.user.created_at,
        updatedAt: authData.user.updated_at || authData.user.created_at
      }

      logger.info('User logged in successfully', {
        userId: authData.user.id,
        email: authData.user.email,
        duration: `${performance.now() - startTime}ms`
      })

      return {
        success: true,
        data: { user, tokens }
      }

    } catch (error) {
      logger.error('Login service error', error instanceof Error ? error : new Error(String(error)))
      
      if (error instanceof AppError) {
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        }
      }

      return {
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Login failed'
        }
      }
    }
  }

  // Logout user (with Supabase Auth)
  async logout(userId: string): Promise<ServiceResponse<{ message: string }>> {
    try {
      // Get the user's session and sign them out
      const { error: signOutError } = await this.supabase.auth.admin.signOut(userId, 'global')

      if (signOutError) {
        logger.error('Error signing out user', signOutError)
        // Don't fail the logout for this error - token will still expire
      }

      logger.info('User logged out successfully', { userId })

      return {
        success: true,
        data: { message: 'Logged out successfully' }
      }

    } catch (error) {
      logger.error('Logout service error', error instanceof Error ? error : new Error(String(error)))
      
      return {
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Logout failed'
        }
      }
    }
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<ServiceResponse<AuthTokens>> {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, env.JWT_SECRET) as AuthTokenPayload
      
      // Verify user still exists in Supabase Auth
      const { data: userData, error: userError } = await this.supabase.auth.admin.getUserById(payload.sub)
      
      if (userError || !userData.user) {
        return {
          success: false,
          error: {
            code: ERROR_CODES.AUTHENTICATION_ERROR,
            message: 'Invalid refresh token - user no longer exists'
          }
        }
      }
      
      // Generate new tokens
      const tokens = this.generateTokens({
        sub: payload.sub,
        email: payload.email,
        aud: payload.aud,
        role: payload.role
      })

      logger.info('Token refreshed successfully', { userId: payload.sub })

      return {
        success: true,
        data: tokens
      }

    } catch (error) {
      logger.warn('Token refresh failed', error instanceof Error ? error : new Error(String(error)))
      
      return {
        success: false,
        error: {
          code: ERROR_CODES.AUTHENTICATION_ERROR,
          message: 'Invalid refresh token'
        }
      }
    }
  }

  // Verify user exists and is valid
  async verifyUser(userId: string): Promise<ServiceResponse<AuthUser>> {
    try {
      const { data: userData, error } = await this.supabase.auth.admin.getUserById(userId)

      if (error || !userData.user) {
        return {
          success: false,
          error: {
            code: ERROR_CODES.RESOURCE_NOT_FOUND,
            message: 'User not found'
          }
        }
      }

      return {
        success: true,
        data: {
          id: userData.user.id,
          email: userData.user.email!,
          fullName: userData.user.user_metadata?.['full_name'],
          createdAt: userData.user.created_at,
          updatedAt: userData.user.updated_at || userData.user.created_at
        }
      }

    } catch (error) {
      logger.error('User verification error', error instanceof Error ? error : new Error(String(error)))
      
      return {
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'User verification failed'
        }
      }
    }
  }

  // Verify Supabase token and return user info
  async verifySupabaseToken(token: string): Promise<ServiceResponse<AuthUser>> {
    try {
      const { data: userData, error } = await this.supabase.auth.getUser(token)

      if (error || !userData.user) {
        return {
          success: false,
          error: {
            code: ERROR_CODES.AUTHENTICATION_ERROR,
            message: 'Invalid token'
          }
        }
      }

      return {
        success: true,
        data: {
          id: userData.user.id,
          email: userData.user.email!,
          fullName: userData.user.user_metadata?.['full_name'],
          createdAt: userData.user.created_at,
          updatedAt: userData.user.updated_at || userData.user.created_at
        }
      }

    } catch (error) {
      logger.error('Supabase token verification error', error instanceof Error ? error : new Error(String(error)))
      
      return {
        success: false,
        error: {
          code: ERROR_CODES.AUTHENTICATION_ERROR,
          message: 'Token verification failed'
        }
      }
    }
  }

  // Private helper methods
  private generateTokens(payload: Omit<AuthTokenPayload, 'iat' | 'exp'>): AuthTokens {
    const now = Math.floor(Date.now() / 1000)
    const expiresIn = this.parseExpiresIn(env.JWT_EXPIRES_IN)
    
    const tokenPayload: AuthTokenPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn
    }

    const accessToken = jwt.sign(tokenPayload, env.JWT_SECRET, {
      algorithm: CONFIG.JWT_ALGORITHM
    })

    // For refresh tokens, use longer expiration
    const refreshTokenPayload: AuthTokenPayload = {
      ...payload,
      iat: now,
      exp: now + (expiresIn * 4) // 4x longer than access token
    }

    const refreshToken = jwt.sign(refreshTokenPayload, env.JWT_SECRET, {
      algorithm: CONFIG.JWT_ALGORITHM
    })

    return {
      accessToken,
      refreshToken,
      expiresIn: env.JWT_EXPIRES_IN
    }
  }

  private parseExpiresIn(expiresIn: string): number {
    // Parse strings like '7d', '24h', '60m', '3600s'
    const match = expiresIn.match(/^(\d+)([smhd])$/)
    if (!match) return 7 * 24 * 60 * 60 // Default 7 days

    const numStr = match[1]
    const unit = match[2]
    if (!numStr || !unit) return 7 * 24 * 60 * 60
    const value = parseInt(numStr, 10)

    switch (unit) {
      case 's': return value
      case 'm': return value * 60
      case 'h': return value * 60 * 60
      case 'd': return value * 24 * 60 * 60
      default: return 7 * 24 * 60 * 60
    }
  }

  private isPasswordStrong(password: string): boolean {
    if (password.length < CONFIG.PASSWORD_MIN_LENGTH) return false
    if (password.length > CONFIG.PASSWORD_MAX_LENGTH) return false
    
    // Check for at least one uppercase, lowercase, and number
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    
    return hasUppercase && hasLowercase && hasNumber
  }
}

// Export singleton instance
export const authService = new AuthService()