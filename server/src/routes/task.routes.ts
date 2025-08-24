// Task routes for CRUD operations
import { Router, Response } from 'express'
import { taskService } from '@/services/task.service'
import { realtimeService } from '@/services/realtime.service'
import { requireAuth } from '@/middleware/auth'
import { asyncHandler } from '@/middleware/errorHandler'
import { validate, taskSchemas, paramSchemas, querySchemas, commonSchemas } from '@/utils/validation'
import { ResponseHelper } from '@/utils'
import { CreateTaskRequest, UpdateTaskRequest, AuthenticatedRequest, TaskResponse } from '@/types'
import Joi from 'joi'

const router = Router()

// Apply authentication to all task routes
router.use(requireAuth)

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     tags:
 *       - Tasks
 *     summary: Get tasks for a list
 *     description: Retrieve all tasks for a specific list. The listId must be provided as a query parameter.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: listId
 *         in: query
 *         required: true
 *         description: ID of the list to get tasks for
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
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
 *                         $ref: '#/components/schemas/Task'
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
// GET /api/tasks?listId=:listId - Get all tasks for a list
router.get(
  '/',
  validate(querySchemas.taskFilters, 'query'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id
    const listId = req.query['listId'] as string

    if (!listId) {
      ResponseHelper.badRequest(res, 'listId query parameter is required')
      return
    }

    const result = await taskService.getListTasks(listId, userId)

    ResponseHelper.success(res, result.data, 'Tasks retrieved successfully')
  })
)

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     tags:
 *       - Tasks
 *     summary: Get a specific task
 *     description: Retrieve a specific task by its ID. User must have access to the board containing the task.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TaskId'
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Task'
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
// GET /api/tasks/:id - Get a specific task by ID
router.get(
  '/:id',
  validate(paramSchemas.id, 'params'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: taskId } = req.params
    const userId = req.user!.id

    if (!taskId) {
      ResponseHelper.badRequest(res, 'Task ID is required')
      return
    }

    const result = await taskService.getTaskById(taskId, userId)

    ResponseHelper.success(res, result.data, 'Task retrieved successfully')
  })
)

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     tags:
 *       - Tasks
 *     summary: Create a new task
 *     description: Create a new task within a list. The task will be positioned at the end unless a specific position is provided.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskRequest'
 *           examples:
 *             basic:
 *               summary: Basic task creation
 *               value:
 *                 title: "Implement authentication"
 *                 listId: "123e4567-e89b-12d3-a456-426614174000"
 *             withDetails:
 *               summary: Task with description and due date
 *               value:
 *                 title: "Design user interface"
 *                 description: "Create mockups for the main dashboard"
 *                 listId: "123e4567-e89b-12d3-a456-426614174000"
 *                 dueDate: "2024-12-31"
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
// POST /api/tasks - Create a new task
router.post(
  '/',
  validate(taskSchemas.create),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { title, description, listId, dueDate, position } = req.body as CreateTaskRequest
    const userId = req.user!.id

    const result = await taskService.createTask(
      { 
        title: title.trim(), 
        list_id: listId,
        ...(description && { description: description.trim() }),
        ...(dueDate && { due_date: dueDate }),
        ...(position !== undefined && { position })
      },
      userId
    )

    // Broadcast task creation to all connected users
    if (result.data) {
      const boardId = await taskService.getBoardIdFromTask(result.data.id)
      if (boardId) {
        const taskResponse: TaskResponse = {
          id: result.data.id,
          title: result.data.title,
          description: result.data.description || null,
          listId: result.data.list_id,
          dueDate: result.data.due_date || null,
          position: result.data.position,
          createdAt: result.data.created_at,
          updatedAt: result.data.updated_at
        }
        realtimeService.broadcastTaskUpdate(boardId, 'created', taskResponse, userId)
      }
    }

    ResponseHelper.created(res, result.data, 'Task created successfully')
  })
)

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     tags:
 *       - Tasks
 *     summary: Update a task
 *     description: Update a task's title, description, due date, or position. At least one field must be provided for update.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TaskId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 example: "Updated task title"
 *               description:
 *                 type: string
 *                 nullable: true
 *                 maxLength: 1000
 *                 example: "Updated task description"
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 example: "2024-12-31"
 *               position:
 *                 type: integer
 *                 minimum: 0
 *                 example: 2
 *               listId:
 *                 type: string
 *                 format: uuid
 *                 description: Move task to a different list
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *             minProperties: 1
 *           examples:
 *             updateTitle:
 *               summary: Update task title
 *               value:
 *                 title: "Revised task title"
 *             updateAll:
 *               summary: Update multiple fields
 *               value:
 *                 title: "Complete project documentation"
 *                 description: "Write comprehensive docs"
 *                 dueDate: "2024-12-15"
 *                 position: 1
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
// PUT /api/tasks/:id - Update a task
router.put(
  '/:id',
  validate(paramSchemas.id, 'params'),
  validate(taskSchemas.update),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: taskId } = req.params
    const updateData = req.body as UpdateTaskRequest
    const userId = req.user!.id

    if (!taskId) {
      ResponseHelper.badRequest(res, 'Task ID is required')
      return
    }

    // Clean update data
    const cleanData: any = {}
    if (updateData.title !== undefined) {
      cleanData.title = updateData.title.trim()
    }
    if (updateData.description !== undefined) {
      cleanData.description = updateData.description?.trim() || null
    }
    if (updateData.dueDate !== undefined) {
      cleanData.due_date = updateData.dueDate || null
    }
    if (updateData.position !== undefined) {
      cleanData.position = updateData.position
    }
    if (updateData.listId !== undefined) {
      cleanData.list_id = updateData.listId
    }

    await taskService.updateTask(taskId, cleanData, userId)

    // Get the complete task with labels for response and broadcasting
    const completeTaskResult = await taskService.getTaskById(taskId, userId)
    
    // Broadcast task update to all connected users
    if (completeTaskResult.data) {
      const boardId = await taskService.getBoardIdFromTask(taskId)
      if (boardId) {
        const taskResponse: TaskResponse = {
          id: completeTaskResult.data.id,
          title: completeTaskResult.data.title,
          description: completeTaskResult.data.description || null,
          listId: completeTaskResult.data.list_id,
          dueDate: completeTaskResult.data.due_date || null,
          position: completeTaskResult.data.position,
          createdAt: completeTaskResult.data.created_at,
          updatedAt: completeTaskResult.data.updated_at,
          labels: completeTaskResult.data.labels?.map(label => ({
            id: label.id,
            name: label.label_name,
            color: label.label_color
          })) || []
        }
        realtimeService.broadcastTaskUpdate(boardId, 'updated', taskResponse, userId)
      }
    }

    // Return the complete task with labels
    ResponseHelper.success(res, completeTaskResult.data, 'Task updated successfully')
  })
)

/**
 * @swagger
 * /api/tasks/{id}/move:
 *   put:
 *     tags:
 *       - Tasks
 *     summary: Move task to new list and position
 *     description: Move a task to a different list and/or position. This is specifically for drag-and-drop operations.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TaskId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               listId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the target list
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               position:
 *                 type: integer
 *                 minimum: 0
 *                 description: New position in the target list
 *                 example: 1
 *             required: [listId, position]
 *           example:
 *             listId: "123e4567-e89b-12d3-a456-426614174000"
 *             position: 2
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
// PUT /api/tasks/:id/move - Move task to new list and/or position
router.put(
  '/:id/move',
  validate(paramSchemas.id, 'params'),
  validate(taskSchemas.move),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: taskId } = req.params
    const { listId, position } = req.body
    const userId = req.user!.id

    if (!taskId) {
      ResponseHelper.badRequest(res, 'Task ID is required')
      return
    }

    // Get the current task first to capture the old list ID for real-time updates
    const currentTaskResult = await taskService.getTaskById(taskId, userId)
    const oldListId = currentTaskResult.data?.list_id

    const result = await taskService.moveTask(taskId, listId, position, userId)

    // Broadcast task move to all connected users
    if (result.data) {
      const boardId = await taskService.getBoardIdFromTask(taskId)
      if (boardId) {
        const taskResponse: TaskResponse = {
          id: result.data.id,
          title: result.data.title,
          description: result.data.description || null,
          listId: result.data.list_id,
          dueDate: result.data.due_date || null,
          position: result.data.position,
          createdAt: result.data.created_at,
          updatedAt: result.data.updated_at
        }
        
        // Pass correct parameters: boardId, action, task, oldListId, newListId, excludeUserId
        realtimeService.broadcastTaskUpdate(
          boardId, 
          'moved', 
          taskResponse, 
          oldListId,     // old list ID 
          listId,        // new list ID
          undefined      // don't exclude anyone - include all users for better real-time experience
        )
      }
    }

    ResponseHelper.success(res, result.data, 'Task moved successfully')
  })
)

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     tags:
 *       - Tasks
 *     summary: Delete a task
 *     description: Delete a task permanently. This action is irreversible. All task labels will also be removed.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TaskId'
 *     responses:
 *       200:
 *         description: Task deleted successfully
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
// DELETE /api/tasks/:id - Delete a task
router.delete(
  '/:id',
  validate(paramSchemas.id, 'params'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: taskId } = req.params
    const userId = req.user!.id

    if (!taskId) {
      ResponseHelper.badRequest(res, 'Task ID is required')
      return
    }

    // Get board ID before deletion for broadcasting
    const boardId = await taskService.getBoardIdFromTask(taskId)
    
    await taskService.deleteTask(taskId, userId)

    // Broadcast task deletion to all connected users
    if (boardId) {
      const deletedTaskResponse: TaskResponse = {
        id: taskId,
        title: '', // Task is deleted, minimal info
        description: null,
        listId: '',
        dueDate: null,
        position: 0,
        createdAt: '',
        updatedAt: ''
      }
      realtimeService.broadcastTaskUpdate(boardId, 'deleted', deletedTaskResponse, userId)
    }

    ResponseHelper.success(res, undefined, 'Task deleted successfully')
  })
)

/**
 * @swagger
 * /api/tasks/{id}/labels:
 *   post:
 *     tags:
 *       - Tasks
 *     summary: Add a label to a task
 *     description: Add a new label to a task. The label will be created if it doesn't exist or reused if it does.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TaskId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Label name
 *                 example: "High Priority"
 *               color:
 *                 type: string
 *                 pattern: "^#[0-9A-Fa-f]{6}$"
 *                 description: Label color in hex format
 *                 example: "#FF0000"
 *             required: [name, color]
 *           examples:
 *             urgentLabel:
 *               summary: Urgent label
 *               value:
 *                 name: "Urgent"
 *                 color: "#FF0000"
 *             inProgressLabel:
 *               summary: In progress label
 *               value:
 *                 name: "In Progress"
 *                 color: "#FFA500"
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
// POST /api/tasks/:id/labels - Add a label to a task
router.post(
  '/:id/labels',
  validate(paramSchemas.id, 'params'),
  validate(Joi.object({
    name: commonSchemas.name,
    color: commonSchemas.color
  })),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: taskId } = req.params
    const { name, color } = req.body
    const userId = req.user!.id

    if (!taskId) {
      ResponseHelper.badRequest(res, 'Task ID is required')
      return
    }

    await taskService.addTaskLabel(taskId, name.trim(), color, userId)

    // Broadcast task label update to all connected users
    const boardId = await taskService.getBoardIdFromTask(taskId)
    if (boardId) {
      // Get the updated task data to include in the broadcast
      const taskResult = await taskService.getTaskById(taskId, userId)
      if (taskResult.data) {
        const taskResponse: TaskResponse = {
          id: taskResult.data.id,
          title: taskResult.data.title,
          description: taskResult.data.description || null,
          listId: taskResult.data.list_id,
          dueDate: taskResult.data.due_date || null,
          position: taskResult.data.position,
          createdAt: taskResult.data.created_at,
          updatedAt: taskResult.data.updated_at
        }
        realtimeService.broadcastTaskUpdate(boardId, 'updated', taskResponse, userId)
      }
    }

    ResponseHelper.success(res, undefined, 'Label added successfully')
  })
)

/**
 * @swagger
 * /api/tasks/{taskId}/labels/{labelId}:
 *   delete:
 *     tags:
 *       - Tasks
 *     summary: Remove a label from a task
 *     description: Remove a specific label from a task. The label itself is not deleted, only its association with the task.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         description: ID of the task
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *       - name: labelId
 *         in: path
 *         required: true
 *         description: ID of the label to remove
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174001"
 *     responses:
 *       200:
 *         description: Label removed successfully
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
// DELETE /api/tasks/:taskId/labels/:labelId - Remove a label from a task
router.delete(
  '/:taskId/labels/:labelId',
  validate(Joi.object({
    taskId: commonSchemas.uuid,
    labelId: commonSchemas.uuid
  }), 'params'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { taskId, labelId } = req.params
    const userId = req.user!.id

    if (!taskId || !labelId) {
      ResponseHelper.badRequest(res, 'Task ID and Label ID are required')
      return
    }

    await taskService.removeTaskLabel(taskId, labelId, userId)

    // Broadcast task label update to all connected users
    const boardId = await taskService.getBoardIdFromTask(taskId)
    if (boardId) {
      // Get the updated task data to include in the broadcast
      const taskResult = await taskService.getTaskById(taskId, userId)
      if (taskResult.data) {
        const taskResponse: TaskResponse = {
          id: taskResult.data.id,
          title: taskResult.data.title,
          description: taskResult.data.description || null,
          listId: taskResult.data.list_id,
          dueDate: taskResult.data.due_date || null,
          position: taskResult.data.position,
          createdAt: taskResult.data.created_at,
          updatedAt: taskResult.data.updated_at
        }
        realtimeService.broadcastTaskUpdate(boardId, 'updated', taskResponse, userId)
      }
    }

    ResponseHelper.success(res, undefined, 'Label removed successfully')
  })
)

export default router