// Task service for managing task operations
import { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/config/database'
import { Task, CreateTaskData, UpdateTaskData, TaskWithLabels, ServiceResponse } from '@/types'
import { logger } from '@/utils'
import { createNotFoundError, createDatabaseError } from '@/middleware/errorHandler'

export class TaskService {
  private supabase: SupabaseClient

  constructor() {
    this.supabase = getSupabaseAdmin()
  }

  // Helper method to get board ID from a task ID
  async getBoardIdFromTask(taskId: string): Promise<string | null> {
    const { data } = await this.supabase
      .from('tasks')
      .select(`
        lists!inner (
          board_id
        )
      `)
      .eq('id', taskId)
      .single()

    return data ? (data as any).lists.board_id : null
  }

  // Get all tasks for a list
  async getListTasks(listId: string, userId: string): Promise<ServiceResponse<TaskWithLabels[]>> {
    try {
      logger.debug('Getting list tasks', { listId, userId })

      // First verify user has access to the list's board
      const { data: listData } = await this.supabase
        .from('lists')
        .select(`
          board_id,
          boards!inner (
            board_collaborators!inner (
              user_id
            )
          )
        `)
        .eq('id', listId)
        .eq('boards.board_collaborators.user_id', userId)
        .single()

      if (!listData) {
        logger.warn('User does not have access to list', { listId, userId })
        throw createNotFoundError('List')
      }

      const { data, error } = await this.supabase
        .from('tasks')
        .select(`
          *,
          task_labels (
            id,
            label_name,
            label_color
          )
        `)
        .eq('list_id', listId)
        .order('position', { ascending: true })

      if (error) {
        logger.error('Failed to fetch list tasks', error as Error)
        throw createDatabaseError('Failed to fetch tasks')
      }

      logger.info('Successfully retrieved list tasks', { listId, userId, count: data?.length || 0 })

      return {
        success: true,
        data: (data as TaskWithLabels[]) || []
      }
    } catch (error) {
      logger.error('Error in getListTasks', error as Error)
      throw error
    }
  }

  // Get task by ID with access check
  async getTaskById(taskId: string, userId: string): Promise<ServiceResponse<TaskWithLabels>> {
    try {
      logger.debug('Getting task by ID', { taskId, userId })

      const { data, error } = await this.supabase
        .from('tasks')
        .select(`
          *,
          lists!inner (
            board_id,
            boards!inner (
              board_collaborators!inner (
                user_id
              )
            )
          ),
          task_labels (
            id,
            label_name,
            label_color
          )
        `)
        .eq('id', taskId)
        .eq('lists.boards.board_collaborators.user_id', userId)
        .single()

      if (error || !data) {
        logger.warn('Task not found or access denied', { taskId, userId, error })
        throw createNotFoundError('Task')
      }

      logger.info('Successfully retrieved task', { taskId, userId })

      return {
        success: true,
        data: data as TaskWithLabels
      }
    } catch (error) {
      logger.error('Error in getTaskById', error as Error)
      throw error
    }
  }

  // Create a new task
  async createTask(data: CreateTaskData, userId: string): Promise<ServiceResponse<Task>> {
    try {
      logger.debug('Creating new task', { data, userId })

      // Verify user has access to the list's board
      const { data: listData } = await this.supabase
        .from('lists')
        .select(`
          board_id,
          boards!inner (
            board_collaborators!inner (
              user_id,
              role
            )
          )
        `)
        .eq('id', data.list_id)
        .eq('boards.board_collaborators.user_id', userId)
        .single()

      if (!listData) {
        logger.warn('User does not have access to list', { listId: data.list_id, userId })
        throw createNotFoundError('List')
      }

      // Get the next position if not provided
      let position = data.position
      if (position === undefined) {
        const { data: lastTask } = await this.supabase
          .from('tasks')
          .select('position')
          .eq('list_id', data.list_id)
          .order('position', { ascending: false })
          .limit(1)
          .single()

        position = (lastTask?.position || 0) + 1
      }

      const { data: task, error } = await this.supabase
        .from('tasks')
        .insert({
          title: data.title,
          description: data.description || null,
          list_id: data.list_id,
          due_date: data.due_date || null,
          position,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        logger.error('Failed to create task', error as Error)
        throw createDatabaseError('Failed to create task')
      }

      logger.info('Successfully created task', { taskId: task.id, listId: data.list_id, userId })

      return {
        success: true,
        data: task as Task
      }
    } catch (error) {
      logger.error('Error in createTask', error as Error)
      throw error
    }
  }

  // Update task
  async updateTask(taskId: string, data: UpdateTaskData, userId: string): Promise<ServiceResponse<Task>> {
    try {
      logger.debug('Updating task', { taskId, data, userId })

      // Check if user has access to the task's board
      const { data: taskData } = await this.supabase
        .from('tasks')
        .select(`
          list_id,
          lists!inner (
            board_id,
            boards!inner (
              board_collaborators!inner (
                user_id,
                role
              )
            )
          )
        `)
        .eq('id', taskId)
        .eq('lists.boards.board_collaborators.user_id', userId)
        .single()

      if (!taskData) {
        logger.warn('Task not found or access denied', { taskId, userId })
        throw createNotFoundError('Task')
      }

      const { data: task, error } = await this.supabase
        .from('tasks')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single()

      if (error || !task) {
        logger.error('Failed to update task', error as Error)
        throw createDatabaseError('Failed to update task')
      }

      logger.info('Successfully updated task', { taskId, userId })

      return {
        success: true,
        data: task as Task
      }
    } catch (error) {
      logger.error('Error in updateTask', error as Error)
      throw error
    }
  }

  // Delete task
  async deleteTask(taskId: string, userId: string): Promise<ServiceResponse<void>> {
    try {
      logger.debug('Deleting task', { taskId, userId })

      // Check if user has access to the task's board
      const { data: taskData } = await this.supabase
        .from('tasks')
        .select(`
          list_id,
          lists!inner (
            board_id,
            boards!inner (
              board_collaborators!inner (
                user_id,
                role
              )
            )
          )
        `)
        .eq('id', taskId)
        .eq('lists.boards.board_collaborators.user_id', userId)
        .single()

      if (!taskData) {
        logger.warn('Task not found or access denied', { taskId, userId })
        throw createNotFoundError('Task')
      }

      const { error } = await this.supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) {
        logger.error('Failed to delete task', error as Error)
        throw createDatabaseError('Failed to delete task')
      }

      logger.info('Successfully deleted task', { taskId, userId })

      return {
        success: true,
        data: undefined
      }
    } catch (error) {
      logger.error('Error in deleteTask', error as Error)
      throw error
    }
  }

  // Move task to new list and/or position
  async moveTask(taskId: string, newListId: string, newPosition: number, userId: string): Promise<ServiceResponse<Task>> {
    try {
      logger.debug('Moving task to new position', { taskId, newListId, newPosition, userId })

      // Get current task and verify access
      const { data: currentTask } = await this.supabase
        .from('tasks')
        .select(`
          *,
          lists!inner (
            board_id,
            boards!inner (
              board_collaborators!inner (
                user_id,
                role
              )
            )
          )
        `)
        .eq('id', taskId)
        .eq('lists.boards.board_collaborators.user_id', userId)
        .single()

      if (!currentTask) {
        logger.warn('Task not found or access denied', { taskId, userId })
        throw createNotFoundError('Task')
      }

      // Verify access to destination list if different
      if (newListId !== currentTask.list_id) {
        const { data: destListData } = await this.supabase
          .from('lists')
          .select(`
            board_id,
            boards!inner (
              board_collaborators!inner (
                user_id
              )
            )
          `)
          .eq('id', newListId)
          .eq('boards.board_collaborators.user_id', userId)
          .single()

        if (!destListData) {
          logger.warn('User does not have access to destination list', { listId: newListId, userId })
          throw createNotFoundError('List')
        }
      }

      const oldListId = currentTask.list_id
      const oldPosition = currentTask.position

      // If same list and same position, no change needed
      if (newListId === oldListId && newPosition === oldPosition) {
        return {
          success: true,
          data: currentTask as Task
        }
      }

      // Get all tasks in both lists and update positions manually
      const { data: sourceTasks } = await this.supabase
        .from('tasks')
        .select('id, position')
        .eq('list_id', oldListId)
        .order('position')

      let destTasks: any[] = []
      if (newListId !== oldListId) {
        const { data } = await this.supabase
          .from('tasks')
          .select('id, position')
          .eq('list_id', newListId)
          .order('position')
        destTasks = data || []
      }

      // Update positions in source list (remove moved task)
      if (sourceTasks) {
        const updatedSourceTasks = sourceTasks
          .filter(t => t.id !== taskId)
          .map((task, index) => ({
            id: task.id,
            position: index + 1
          }))

        if (updatedSourceTasks.length > 0) {
          const sourceUpdatePromises = updatedSourceTasks.map(task => 
            this.supabase
              .from('tasks')
              .update({ 
                position: task.position,
                updated_at: new Date().toISOString()
              })
              .eq('id', task.id)
          )
          await Promise.all(sourceUpdatePromises)
        }
      }

      // Update positions in destination list (insert moved task)
      if (newListId !== oldListId && destTasks.length > 0) {
        const updatedDestTasks = destTasks
          .slice(0, newPosition - 1)
          .concat([{ id: taskId, position: newPosition }])
          .concat(destTasks.slice(newPosition - 1).map(task => ({ ...task, position: task.position + 1 })))
          .map((task, index) => ({
            id: task.id,
            position: index + 1
          }))

        const destUpdatePromises = updatedDestTasks
          .filter(task => task.id !== taskId)
          .map(task => 
            this.supabase
              .from('tasks')
              .update({ 
                position: task.position,
                updated_at: new Date().toISOString()
              })
              .eq('id', task.id)
          )
        await Promise.all(destUpdatePromises)
      }

      // Update the moved task
      const { data: updatedTask, error } = await this.supabase
        .from('tasks')
        .update({
          list_id: newListId,
          position: newPosition,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single()

      if (error || !updatedTask) {
        logger.error('Failed to move task', error as Error)
        throw createDatabaseError('Failed to move task')
      }

      logger.info('Successfully moved task', { taskId, oldListId, newListId, oldPosition, newPosition, userId })

      return {
        success: true,
        data: updatedTask as Task
      }
    } catch (error) {
      logger.error('Error in moveTask', error as Error)
      throw error
    }
  }

  // Add label to task
  async addTaskLabel(taskId: string, labelName: string, labelColor: string, userId: string): Promise<ServiceResponse<void>> {
    try {
      logger.debug('Adding label to task', { taskId, labelName, labelColor, userId })

      // Verify user has access to the task
      const { data: taskData } = await this.supabase
        .from('tasks')
        .select(`
          lists!inner (
            boards!inner (
              board_collaborators!inner (
                user_id
              )
            )
          )
        `)
        .eq('id', taskId)
        .eq('lists.boards.board_collaborators.user_id', userId)
        .single()

      if (!taskData) {
        logger.warn('Task not found or access denied', { taskId, userId })
        throw createNotFoundError('Task')
      }

      const { error } = await this.supabase
        .from('task_labels')
        .insert({
          task_id: taskId,
          label_name: labelName,
          label_color: labelColor,
          created_at: new Date().toISOString()
        })

      if (error) {
        logger.error('Failed to add task label', error as Error)
        throw createDatabaseError('Failed to add label')
      }

      logger.info('Successfully added task label', { taskId, labelName, userId })

      return {
        success: true,
        data: undefined
      }
    } catch (error) {
      logger.error('Error in addTaskLabel', error as Error)
      throw error
    }
  }

  // Remove label from task
  async removeTaskLabel(taskId: string, labelId: string, userId: string): Promise<ServiceResponse<void>> {
    try {
      logger.debug('Removing label from task', { taskId, labelId, userId })

      // Verify user has access to the task
      const { data: taskData } = await this.supabase
        .from('tasks')
        .select(`
          lists!inner (
            boards!inner (
              board_collaborators!inner (
                user_id
              )
            )
          )
        `)
        .eq('id', taskId)
        .eq('lists.boards.board_collaborators.user_id', userId)
        .single()

      if (!taskData) {
        logger.warn('Task not found or access denied', { taskId, userId })
        throw createNotFoundError('Task')
      }

      const { error } = await this.supabase
        .from('task_labels')
        .delete()
        .eq('id', labelId)
        .eq('task_id', taskId)

      if (error) {
        logger.error('Failed to remove task label', error as Error)
        throw createDatabaseError('Failed to remove label')
      }

      logger.info('Successfully removed task label', { taskId, labelId, userId })

      return {
        success: true,
        data: undefined
      }
    } catch (error) {
      logger.error('Error in removeTaskLabel', error as Error)
      throw error
    }
  }
}

export const taskService = new TaskService()