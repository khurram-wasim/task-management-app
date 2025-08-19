// List routes for CRUD operations
import { Router, Response } from 'express'
import { listService } from '@/services/list.service'
import { realtimeService } from '@/services/realtime.service'
import { requireAuth } from '@/middleware/auth'
import { asyncHandler } from '@/middleware/errorHandler'
import { validate, listSchemas, paramSchemas, querySchemas, commonSchemas } from '@/utils/validation'
import { ResponseHelper } from '@/utils'
import { CreateListRequest, UpdateListRequest, AuthenticatedRequest, ListResponse } from '@/types'

const router = Router()

// Apply authentication to all list routes
router.use(requireAuth)

/**
 * @swagger
 * /api/lists:
 *   get:
 *     tags:
 *       - Lists
 *     summary: Get lists for a board
 *     description: Retrieve all lists for a specific board. The boardId must be provided as a query parameter.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: boardId
 *         in: query
 *         required: true
 *         description: ID of the board to get lists for
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Lists retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/List'
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
// GET /api/lists?boardId=:boardId - Get all lists for a board
router.get(
  '/',
  validate(querySchemas.boardFilters, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id
    const boardId = req.query['boardId'] as string

    console.log('Lists endpoint - query params:', req.query)
    console.log('Lists endpoint - boardId:', boardId)

    if (!boardId) {
      ResponseHelper.badRequest(res, 'boardId query parameter is required')
      return
    }

    const result = await listService.getBoardLists(boardId, userId)

    ResponseHelper.success(res, result.data, 'Lists retrieved successfully')
  })
)

/**
 * @swagger
 * /api/lists/{id}:
 *   get:
 *     tags:
 *       - Lists
 *     summary: Get a specific list
 *     description: Retrieve a specific list by its ID. User must have access to the board containing the list.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ListId'
 *     responses:
 *       200:
 *         description: List retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/List'
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
// GET /api/lists/:id - Get a specific list by ID
router.get(
  '/:id',
  validate(paramSchemas.id, 'params'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: listId } = req.params
    const userId = req.user!.id

    if (!listId) {
      ResponseHelper.badRequest(res, 'List ID is required')
      return
    }

    const result = await listService.getListById(listId, userId)

    ResponseHelper.success(res, result.data, 'List retrieved successfully')
  })
)

/**
 * @swagger
 * /api/lists:
 *   post:
 *     tags:
 *       - Lists
 *     summary: Create a new list
 *     description: Create a new list within a board. The list will be positioned at the end unless a specific position is provided.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateListRequest'
 *           examples:
 *             basic:
 *               summary: Basic list creation
 *               value:
 *                 name: "To Do"
 *                 boardId: "123e4567-e89b-12d3-a456-426614174000"
 *             withPosition:
 *               summary: List with specific position
 *               value:
 *                 name: "In Progress"
 *                 boardId: "123e4567-e89b-12d3-a456-426614174000"
 *                 position: 1
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Created'
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
// POST /api/lists - Create a new list
router.post(
  '/',
  validate(listSchemas.create),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, boardId, position } = req.body as CreateListRequest
    const userId = req.user!.id

    const result = await listService.createList(
      { 
        name: name.trim(), 
        board_id: boardId,
        ...(position !== undefined && { position })
      },
      userId
    )

    // Broadcast list creation to all connected users
    if (result.data) {
      const listResponse: ListResponse = {
        id: result.data.id,
        name: result.data.name,
        boardId: result.data.board_id,
        position: result.data.position,
        createdAt: result.data.created_at,
        updatedAt: result.data.updated_at
      }
      realtimeService.broadcastListUpdate(boardId, 'created', listResponse, userId)
    }

    ResponseHelper.created(res, result.data, 'List created successfully')
  })
)

/**
 * @swagger
 * /api/lists/{id}:
 *   put:
 *     tags:
 *       - Lists
 *     summary: Update a list
 *     description: Update a list's name or position. At least one field must be provided for update.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ListId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBoardRequest'
 *           examples:
 *             updateName:
 *               summary: Update list name
 *               value:
 *                 name: "Updated List Name"
 *             updatePosition:
 *               summary: Update list position
 *               value:
 *                 position: 2
 *             updateBoth:
 *               summary: Update name and position
 *               value:
 *                 name: "Done"
 *                 position: 3
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
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// PUT /api/lists/:id - Update a list
router.put(
  '/:id',
  validate(paramSchemas.id, 'params'),
  validate(listSchemas.update),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: listId } = req.params
    const updateData = req.body as UpdateListRequest
    const userId = req.user!.id

    if (!listId) {
      ResponseHelper.badRequest(res, 'List ID is required')
      return
    }

    // Clean update data
    const cleanData: any = {}
    if (updateData.name !== undefined) {
      cleanData.name = updateData.name.trim()
    }
    if (updateData.position !== undefined) {
      cleanData.position = updateData.position
    }

    const result = await listService.updateList(listId, cleanData, userId)

    // Broadcast list update to all connected users
    if (result.data) {
      const listResponse: ListResponse = {
        id: result.data.id,
        name: result.data.name,
        boardId: result.data.board_id,
        position: result.data.position,
        createdAt: result.data.created_at,
        updatedAt: result.data.updated_at
      }
      realtimeService.broadcastListUpdate(result.data.board_id, 'updated', listResponse, userId)
    }

    ResponseHelper.success(res, result.data, 'List updated successfully')
  })
)

/**
 * @swagger
 * /api/lists/{id}/move:
 *   put:
 *     tags:
 *       - Lists
 *     summary: Move list to new position
 *     description: Move a list to a new position within the same board. All other lists will be reordered automatically.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ListId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               position:
 *                 type: integer
 *                 minimum: 0
 *                 description: New position for the list
 *                 example: 2
 *             required: [position]
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
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// PUT /api/lists/:id/move - Move list to new position
router.put(
  '/:id/move',
  validate(paramSchemas.id, 'params'),
  validate(listSchemas.update.keys({ position: commonSchemas.position.required() })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: listId } = req.params
    const { position } = req.body
    const userId = req.user!.id

    if (!listId) {
      ResponseHelper.badRequest(res, 'List ID is required')
      return
    }

    const result = await listService.moveList(listId, position, userId)

    // Broadcast list move to all connected users
    if (result.data) {
      const listResponse: ListResponse = {
        id: result.data.id,
        name: result.data.name,
        boardId: result.data.board_id,
        position: result.data.position,
        createdAt: result.data.created_at,
        updatedAt: result.data.updated_at
      }
      realtimeService.broadcastListUpdate(result.data.board_id, 'moved', listResponse, userId)
    }

    ResponseHelper.success(res, result.data, 'List moved successfully')
  })
)

/**
 * @swagger
 * /api/lists/{id}:
 *   delete:
 *     tags:
 *       - Lists
 *     summary: Delete a list
 *     description: Delete a list and all its tasks. This action is irreversible. User must be the board owner or have admin access.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ListId'
 *     responses:
 *       200:
 *         description: List deleted successfully
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
// DELETE /api/lists/:id - Delete a list
router.delete(
  '/:id',
  validate(paramSchemas.id, 'params'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: listId } = req.params
    const userId = req.user!.id

    if (!listId) {
      ResponseHelper.badRequest(res, 'List ID is required')
      return
    }

    const result = await listService.deleteList(listId, userId)

    // Broadcast list deletion to all connected users
    if (result.data) {
      const deletedListResponse: ListResponse = {
        id: listId,
        name: '', // List is deleted, minimal info
        boardId: result.data.boardId,
        position: 0,
        createdAt: '',
        updatedAt: ''
      }
      realtimeService.broadcastListUpdate(result.data.boardId, 'deleted', deletedListResponse, userId)
    }

    ResponseHelper.success(res, undefined, 'List deleted successfully')
  })
)

export default router