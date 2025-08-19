// Board routes for CRUD operations
import { Router, Response } from 'express'
import { boardService } from '@/services/board.service'
import { realtimeService } from '@/services/realtime.service'
import { requireAuth } from '@/middleware/auth'
import { asyncHandler } from '@/middleware/errorHandler'
import { validate, boardSchemas, paramSchemas, querySchemas } from '@/utils/validation'
import { ResponseHelper, parseNumber } from '@/utils'
import { CreateBoardRequest, UpdateBoardRequest, AddCollaboratorRequest, UpdateBoardData, AuthenticatedRequest, BoardResponse } from '@/types'

const router = Router()

// Apply authentication to all board routes
router.use(requireAuth)

/**
 * @swagger
 * /api/boards:
 *   get:
 *     tags:
 *       - Boards
 *     summary: Get user boards
 *     description: Retrieve all boards accessible to the authenticated user (owned or collaborated).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Page'
 *       - $ref: '#/components/parameters/Limit'
 *     responses:
 *       200:
 *         description: Boards retrieved successfully
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
 *                         boards:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Board'
 *                         total:
 *                           type: integer
 *                           example: 50
 *                     meta:
 *                       type: object
 *                       properties:
 *                         pagination:
 *                           $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// GET /api/boards - Get all boards for the authenticated user
router.get(
  '/',
  validate(querySchemas.boardFilters, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id
    const page = parseNumber(req.query['page'] as string, 1)
    const limit = parseNumber(req.query['limit'] as string, 20)

    const result = await boardService.getUserBoards(userId, page, limit)

    ResponseHelper.success(res, result.data, 'Boards retrieved successfully')
  })
)

// GET /api/boards/:id - Get a specific board by ID
router.get(
  '/:id',
  validate(paramSchemas.id, 'params'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: boardId } = req.params
    const userId = req.user!.id

    const result = await boardService.getBoardById(boardId!, userId)

    ResponseHelper.success(res, result.data, 'Board retrieved successfully')
  })
)

// POST /api/boards - Create a new board
router.post(
  '/',
  validate(boardSchemas.create),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, description } = req.body as CreateBoardRequest
    const userId = req.user!.id

    const result = await boardService.createBoard(
      { name: name.trim(), description: description?.trim() || undefined },
      userId
    )

    // Broadcast board creation to all connected users
    if (result.data) {
      const boardResponse: BoardResponse = {
        id: result.data.id,
        name: result.data.name,
        description: result.data.description || null,
        userId: result.data.owner_id,
        createdAt: result.data.created_at,
        updatedAt: result.data.updated_at
      }
      realtimeService.broadcastBoardUpdate(result.data.id, 'created', boardResponse, userId)
    }

    ResponseHelper.created(res, result.data, 'Board created successfully')
  })
)

// PUT /api/boards/:id - Update a board
router.put(
  '/:id',
  validate(paramSchemas.id, 'params'),
  validate(boardSchemas.update),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: boardId } = req.params
    const updateData = req.body as UpdateBoardRequest
    const userId = req.user!.id

    // Clean and prepare update data
    const cleanData: UpdateBoardData = {}
    if (updateData.name !== undefined) {
      cleanData.name = updateData.name.trim()
    }
    if (updateData.description !== undefined) {
      cleanData.description = updateData.description?.trim() || null
    }

    const result = await boardService.updateBoard(boardId!, cleanData, userId)

    // Broadcast board update to all connected users
    if (result.data) {
      const boardResponse: BoardResponse = {
        id: result.data.id,
        name: result.data.name,
        description: result.data.description || null,
        userId: result.data.owner_id,
        createdAt: result.data.created_at,
        updatedAt: result.data.updated_at
      }
      realtimeService.broadcastBoardUpdate(boardId!, 'updated', boardResponse, userId)
    }

    ResponseHelper.success(res, result.data, 'Board updated successfully')
  })
)

// DELETE /api/boards/:id - Delete a board
router.delete(
  '/:id',
  validate(paramSchemas.id, 'params'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: boardId } = req.params
    const userId = req.user!.id

    await boardService.deleteBoard(boardId!, userId)

    // Broadcast board deletion to all connected users
    const deletedBoardResponse: BoardResponse = {
      id: boardId!,
      name: '', // Board is deleted, minimal info
      description: null,
      userId: userId,
      createdAt: '',
      updatedAt: ''
    }
    realtimeService.broadcastBoardUpdate(boardId!, 'deleted', deletedBoardResponse, userId)

    ResponseHelper.success(res, undefined, 'Board deleted successfully')
  })
)

/**
 * @swagger
 * /api/boards/{id}/collaborators:
 *   post:
 *     tags:
 *       - Boards
 *     summary: Add a collaborator to a board
 *     description: Add a new collaborator to a board by email. Only board owners can add collaborators.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/BoardId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email of the user to add as collaborator
 *                 example: "collaborator@example.com"
 *               role:
 *                 type: string
 *                 enum: [member, admin]
 *                 default: member
 *                 description: Role to assign to the collaborator
 *                 example: "member"
 *             required: [email]
 *           examples:
 *             memberCollaborator:
 *               summary: Add member collaborator
 *               value:
 *                 email: "member@example.com"
 *                 role: "member"
 *             adminCollaborator:
 *               summary: Add admin collaborator
 *               value:
 *                 email: "admin@example.com"
 *                 role: "admin"
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: User is already a collaborator
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// POST /api/boards/:boardId/collaborators - Add a collaborator to a board
router.post(
  '/:boardId/collaborators',
  validate(paramSchemas.boardId, 'params'),
  validate(boardSchemas.addCollaborator),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { boardId } = req.params
    const { email } = req.body as AddCollaboratorRequest
    const userId = req.user!.id
    const role = req.body.role || 'member' // Default to member if not specified

    await boardService.addCollaborator(boardId!, email.toLowerCase().trim(), role, userId)

    ResponseHelper.success(res, undefined, 'Collaborator added successfully')
  })
)

/**
 * @swagger
 * /api/boards/{boardId}/collaborators/{userId}:
 *   delete:
 *     tags:
 *       - Boards
 *     summary: Remove a collaborator from a board
 *     description: Remove a collaborator from a board. Only board owners and the collaborator themselves can perform this action.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: boardId
 *         in: path
 *         required: true
 *         description: ID of the board
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *       - name: userId
 *         in: path
 *         required: true
 *         description: ID of the user to remove from collaboration
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174001"
 *     responses:
 *       200:
 *         description: Collaborator removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// DELETE /api/boards/:boardId/collaborators/:userId - Remove a collaborator from a board
router.delete(
  '/:boardId/collaborators/:userId',
  validate(paramSchemas.boardId, 'params'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { boardId, userId: targetUserId } = req.params
    const requestUserId = req.user!.id

    await boardService.removeCollaborator(boardId!, targetUserId!, requestUserId)

    ResponseHelper.success(res, undefined, 'Collaborator removed successfully')
  })
)

export default router