// Central route exports and API router
import { Router } from 'express'
import authRoutes from './auth.routes'
import boardRoutes from './board.routes'
import listRoutes from './list.routes'
import taskRoutes from './task.routes'
import { logger } from '@/utils'

const router = Router()

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags:
 *       - System
 *     summary: API Health Check
 *     description: Check if the Task Management API is running and healthy.
 *     responses:
 *       200:
 *         description: API is healthy and running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 message:
 *                   type: string
 *                   example: "Task Management API is running"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 */
// Health check for API routes
router.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    message: 'Task Management API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// Mount route modules
router.use('/auth', authRoutes)
router.use('/boards', boardRoutes)
router.use('/lists', listRoutes)
router.use('/tasks', taskRoutes)

// Log route registration
logger.info('API routes registered', {
  routes: [
    'GET /api/health',
    'POST /api/auth/register',
    'POST /api/auth/login', 
    'POST /api/auth/logout',
    'POST /api/auth/refresh',
    'GET /api/auth/me',
    'GET /api/auth/verify',
    'GET /api/boards',
    'GET /api/boards/:id',
    'POST /api/boards',
    'PUT /api/boards/:id',
    'DELETE /api/boards/:id',
    'POST /api/boards/:id/collaborators',
    'DELETE /api/boards/:boardId/collaborators/:userId',
    'GET /api/lists?boardId=:boardId',
    'GET /api/lists/:id',
    'POST /api/lists',
    'PUT /api/lists/:id',
    'PUT /api/lists/:id/move',
    'DELETE /api/lists/:id',
    'GET /api/tasks?listId=:listId',
    'GET /api/tasks/:id',
    'POST /api/tasks',
    'PUT /api/tasks/:id',
    'PUT /api/tasks/:id/move',
    'DELETE /api/tasks/:id',
    'POST /api/tasks/:id/labels',
    'DELETE /api/tasks/:taskId/labels/:labelId'
  ]
})

export default router