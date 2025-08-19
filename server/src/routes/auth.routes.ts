// Authentication routes for login, register, logout
import { Router, Request, Response } from 'express'
import { authService } from '@/services/auth.service'
import { logger, ResponseHelper, validateRequired } from '@/utils'
import { requireAuth, optionalAuth } from '@/middleware/auth'
import { asyncHandler } from '@/middleware/errorHandler'
import { validateContentType } from '@/middleware/security'
import type { AuthenticatedRequest, LoginRequest, RegisterRequest, AuthResponse } from '@/types'
import { VALIDATION } from '@/config'

const router = Router()

// Apply content type validation to all auth routes
router.use(validateContentType(['application/json']))

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Creates a new user account with email and password. Optionally accepts full name.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             basic:
 *               summary: Basic registration
 *               value:
 *                 email: "user@example.com"
 *                 password: "securePassword123"
 *             withName:
 *               summary: Registration with full name
 *               value:
 *                 email: "john.doe@example.com"
 *                 password: "securePassword123"
 *                 fullName: "John Doe"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// POST /auth/register - Register a new user
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, fullName } = req.body as RegisterRequest

  // Validate required fields
  const requiredFields = ['email', 'password']
  const validation = validateRequired(req.body, requiredFields)
  if (!validation.isValid) {
    ResponseHelper.validationError(res, validation.message, validation.errors)
    return
  }

  // Validate email format
  if (!VALIDATION.EMAIL_REGEX.test(email)) {
    ResponseHelper.validationError(res, 'Invalid email format')
    return
  }

  // Validate password length
  if (password.length < 8 || password.length > 128) {
    ResponseHelper.validationError(res, 'Password must be between 8 and 128 characters')
    return
  }

  logger.info('User registration attempt', { email })

  // Register user
  const result = await authService.register({
    email: email.trim().toLowerCase(),
    password,
    fullName: fullName?.trim() || undefined
  })

  if (!result.success) {
    if (result.error?.code === 'RESOURCE_CONFLICT') {
      ResponseHelper.conflict(res, result.error.message)
      return
    }
    if (result.error?.code === 'VALIDATION_ERROR') {
      ResponseHelper.validationError(res, result.error.message)
      return
    }
    ResponseHelper.internalError(res, result.error?.message || 'Registration failed')
    return
  }

  const response: AuthResponse = {
    user: {
      id: result.data!.user.id,
      email: result.data!.user.email,
      fullName: result.data!.user.fullName || undefined
    },
    token: result.data!.tokens.accessToken,
    expiresIn: result.data!.tokens.expiresIn
  }

  logger.info('User registered successfully', { 
    userId: result.data!.user.id,
    email: result.data!.user.email 
  })

  ResponseHelper.success(res, response, 'User registered successfully', 201)
}))

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login user
 *     description: Authenticates a user with email and password, returning a JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: "user@example.com"
 *             password: "securePassword123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// POST /auth/login - Login user
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginRequest

  // Validate required fields
  const requiredFields = ['email', 'password']
  const validation = validateRequired(req.body, requiredFields)
  if (!validation.isValid) {
    ResponseHelper.validationError(res, validation.message, validation.errors)
    return
  }

  // Validate email format
  if (!VALIDATION.EMAIL_REGEX.test(email)) {
    ResponseHelper.validationError(res, 'Invalid email format')
    return
  }

  logger.info('User login attempt', { email })

  // Login user
  const result = await authService.login({
    email: email.trim().toLowerCase(),
    password
  })

  if (!result.success) {
    if (result.error?.code === 'AUTHENTICATION_ERROR') {
      ResponseHelper.unauthorized(res, result.error.message)
      return
    }
    ResponseHelper.internalError(res, result.error?.message || 'Login failed')
    return
  }

  const response: AuthResponse = {
    user: {
      id: result.data!.user.id,
      email: result.data!.user.email,
      fullName: result.data!.user.fullName || undefined
    },
    token: result.data!.tokens.accessToken,
    expiresIn: result.data!.tokens.expiresIn
  }

  logger.info('User logged in successfully', { 
    userId: result.data!.user.id,
    email: result.data!.user.email 
  })

  ResponseHelper.success(res, response, 'Login successful')
}))

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Logout user
 *     description: Logs out the authenticated user and invalidates their session.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// POST /auth/logout - Logout user (requires authentication)
router.post('/logout', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id

  logger.info('User logout attempt', { userId })

  // Logout user
  const result = await authService.logout(userId)

  if (!result.success) {
    ResponseHelper.internalError(res, result.error?.message || 'Logout failed')
    return
  }

  logger.info('User logged out successfully', { userId })

  ResponseHelper.success(res, { message: result.data!.message }, 'Logout successful')
}))

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token
 *     description: Refresh an expired access token using a valid refresh token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             required: [refreshToken]
 *           example:
 *             refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         token:
 *                           type: string
 *                           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                         expiresIn:
 *                           type: string
 *                           example: "24h"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         description: Invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// POST /auth/refresh - Refresh access token
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    ResponseHelper.validationError(res, 'Refresh token is required')
    return
  }

  logger.info('Token refresh attempt')

  // Refresh token
  const result = await authService.refreshToken(refreshToken)

  if (!result.success) {
    if (result.error?.code === 'AUTHENTICATION_ERROR') {
      ResponseHelper.unauthorized(res, result.error.message)
      return
    }
    ResponseHelper.internalError(res, result.error?.message || 'Token refresh failed')
    return
  }

  logger.info('Token refreshed successfully')

  ResponseHelper.success(res, {
    token: result.data!.accessToken,
    expiresIn: result.data!.expiresIn
  }, 'Token refreshed successfully')
}))

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current user information
 *     description: Retrieve information about the currently authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           example: "123e4567-e89b-12d3-a456-426614174000"
 *                         email:
 *                           type: string
 *                           format: email
 *                           example: "user@example.com"
 *                         fullName:
 *                           type: string
 *                           nullable: true
 *                           example: "John Doe"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// GET /auth/me - Get current user information (requires authentication)
router.get('/me', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id

  // Verify and get user
  const result = await authService.verifyUser(userId)

  if (!result.success) {
    if (result.error?.code === 'RESOURCE_NOT_FOUND') {
      ResponseHelper.notFound(res, result.error.message)
      return
    }
    ResponseHelper.internalError(res, result.error?.message || 'Failed to get user information')
    return
  }

  ResponseHelper.success(res, {
    id: result.data!.id,
    email: result.data!.email,
    fullName: result.data!.fullName
  }, 'User information retrieved successfully')
}))

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Verify token validity
 *     description: Verify if the provided JWT token is valid and the user still exists. Uses optional authentication middleware.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         valid:
 *                           type: boolean
 *                           example: true
 *                         user:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                               example: "123e4567-e89b-12d3-a456-426614174000"
 *                             email:
 *                               type: string
 *                               format: email
 *                               example: "user@example.com"
 *                             fullName:
 *                               type: string
 *                               nullable: true
 *                               example: "John Doe"
 *       401:
 *         description: Invalid token or user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// GET /auth/verify - Verify token validity (optional authentication)
router.get('/verify', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    ResponseHelper.unauthorized(res, 'No valid token provided')
    return
  }

  // Verify user still exists
  const result = await authService.verifyUser(req.user.id)

  if (!result.success) {
    ResponseHelper.unauthorized(res, 'Token is valid but user no longer exists')
    return
  }

  ResponseHelper.success(res, {
    valid: true,
    user: {
      id: result.data!.id,
      email: result.data!.email,
      fullName: result.data!.fullName
    }
  }, 'Token is valid')
}))

export default router