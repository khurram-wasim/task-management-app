// List service for managing list operations
import { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/config/database'
import { List, CreateListData, UpdateListData, ListWithTasks, ServiceResponse } from '@/types'
import { logger } from '@/utils'
import { createNotFoundError, createDatabaseError, createForbiddenError } from '@/middleware/errorHandler'

export class ListService {
  private supabase: SupabaseClient

  constructor() {
    this.supabase = getSupabaseAdmin()
  }

  // Get all lists for a board
  async getBoardLists(boardId: string, userId: string): Promise<ServiceResponse<ListWithTasks[]>> {
    try {
      logger.debug('Getting board lists', { boardId, userId })

      // First verify user has access to the board
      const { data: boardAccess } = await this.supabase
        .from('board_collaborators')
        .select('board_id')
        .eq('board_id', boardId)
        .eq('user_id', userId)
        .single()

      if (!boardAccess) {
        logger.warn('User does not have access to board', { boardId, userId })
        throw createNotFoundError('Board')
      }

      const { data, error } = await this.supabase
        .from('lists')
        .select(`
          *,
          tasks (
            id,
            title,
            description,
            due_date,
            position,
            created_at,
            updated_at,
            task_labels (
              id,
              label_name,
              label_color
            )
          )
        `)
        .eq('board_id', boardId)
        .order('position', { ascending: true })

      if (error) {
        logger.error('Failed to fetch board lists', error)
        throw createDatabaseError('Failed to fetch lists')
      }

      // Sort tasks by position within each list
      const listsWithSortedTasks = (data as ListWithTasks[])?.map(list => ({
        ...list,
        tasks: list.tasks?.sort((a, b) => a.position - b.position) || []
      })) || []

      logger.info('Successfully retrieved board lists', { boardId, userId, count: data?.length || 0 })

      return {
        success: true,
        data: listsWithSortedTasks
      }
    } catch (error) {
      logger.error('Error in getBoardLists', error as Error)
      throw error
    }
  }

  // Get list by ID with access check
  async getListById(listId: string, userId: string): Promise<ServiceResponse<ListWithTasks>> {
    try {
      logger.debug('Getting list by ID', { listId, userId })

      const { data, error } = await this.supabase
        .from('lists')
        .select(`
          *,
          boards!inner (
            id,
            board_collaborators!inner (
              user_id
            )
          ),
          tasks (
            id,
            title,
            description,
            due_date,
            position,
            created_at,
            updated_at,
            task_labels (
              id,
              label_name,
              label_color
            )
          )
        `)
        .eq('id', listId)
        .eq('boards.board_collaborators.user_id', userId)
        .single()

      if (error || !data) {
        logger.warn('List not found or access denied', { listId, userId, error })
        throw createNotFoundError('List')
      }

      // Sort tasks by position
      const listWithSortedTasks = {
        ...data,
        tasks: data.tasks?.sort((a: any, b: any) => a.position - b.position) || []
      } as ListWithTasks

      logger.info('Successfully retrieved list', { listId, userId })

      return {
        success: true,
        data: listWithSortedTasks
      }
    } catch (error) {
      logger.error('Error in getListById', error as Error)
      throw error
    }
  }

  // Create a new list
  async createList(data: CreateListData, userId: string): Promise<ServiceResponse<List>> {
    try {
      logger.debug('Creating new list', { data, userId })

      // Verify user has access to the board
      const { data: boardAccess } = await this.supabase
        .from('board_collaborators')
        .select('board_id, role')
        .eq('board_id', data.board_id)
        .eq('user_id', userId)
        .single()

      if (!boardAccess) {
        logger.warn('User does not have access to board', { boardId: data.board_id, userId })
        throw createNotFoundError('Board')
      }

      // Get the next position if not provided
      let position = data.position
      if (position === undefined) {
        const { data: lastList } = await this.supabase
          .from('lists')
          .select('position')
          .eq('board_id', data.board_id)
          .order('position', { ascending: false })
          .limit(1)
          .single()

        position = (lastList?.position || 0) + 1
      }

      const { data: list, error } = await this.supabase
        .from('lists')
        .insert({
          name: data.name,
          board_id: data.board_id,
          position,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        logger.error('Failed to create list', error as Error)
        throw createDatabaseError('Failed to create list')
      }

      logger.info('Successfully created list', { listId: list.id, boardId: data.board_id, userId })

      return {
        success: true,
        data: list as List
      }
    } catch (error) {
      logger.error('Error in createList', error as Error)
      throw error
    }
  }

  // Update list
  async updateList(listId: string, data: UpdateListData, userId: string): Promise<ServiceResponse<List>> {
    try {
      logger.debug('Updating list', { listId, data, userId })

      // Check if user has access to the list's board
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
        .eq('id', listId)
        .eq('boards.board_collaborators.user_id', userId)
        .single()

      if (!listData) {
        logger.warn('List not found or access denied', { listId, userId })
        throw createNotFoundError('List')
      }

      const { data: list, error } = await this.supabase
        .from('lists')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', listId)
        .select()
        .single()

      if (error || !list) {
        logger.error('Failed to update list', error as Error)
        throw createDatabaseError('Failed to update list')
      }

      logger.info('Successfully updated list', { listId, userId })

      return {
        success: true,
        data: list as List
      }
    } catch (error) {
      logger.error('Error in updateList', error as Error)
      throw error
    }
  }

  // Delete list
  async deleteList(listId: string, userId: string): Promise<ServiceResponse<{ boardId: string }>> {
    try {
      logger.debug('Deleting list', { listId, userId })

      // Check if user has admin access to the list's board
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
        .eq('id', listId)
        .eq('boards.board_collaborators.user_id', userId)
        .single()

      if (!listData) {
        logger.warn('List not found or access denied', { listId, userId })
        throw createNotFoundError('List')
      }

      // Check if user has admin role
      const collaborator = (listData as any).boards.board_collaborators[0]
      if (collaborator.role !== 'admin') {
        logger.warn('User does not have admin access to delete list', { listId, userId })
        throw createForbiddenError('Insufficient permissions to delete list')
      }

      const boardId = (listData as any).board_id

      const { error } = await this.supabase
        .from('lists')
        .delete()
        .eq('id', listId)

      if (error) {
        logger.error('Failed to delete list', error as Error)
        throw createDatabaseError('Failed to delete list')
      }

      logger.info('Successfully deleted list', { listId, userId, boardId })

      return {
        success: true,
        data: { boardId }
      }
    } catch (error) {
      logger.error('Error in deleteList', error as Error)
      throw error
    }
  }

  // Move list to new position
  async moveList(listId: string, newPosition: number, userId: string): Promise<ServiceResponse<List>> {
    try {
      logger.debug('Moving list to new position', { listId, newPosition, userId })

      // Get current list and verify access
      const { data: currentList } = await this.supabase
        .from('lists')
        .select(`
          *,
          boards!inner (
            board_collaborators!inner (
              user_id,
              role
            )
          )
        `)
        .eq('id', listId)
        .eq('boards.board_collaborators.user_id', userId)
        .single()

      if (!currentList) {
        logger.warn('List not found or access denied', { listId, userId })
        throw createNotFoundError('List')
      }

      const oldPosition = currentList.position
      const boardId = currentList.board_id

      if (oldPosition === newPosition) {
        // No change needed
        return {
          success: true,
          data: currentList as List
        }
      }

      // Get all lists in the board and update positions manually
      const { data: allLists } = await this.supabase
        .from('lists')
        .select('id, position')
        .eq('board_id', boardId)
        .order('position')

      if (allLists) {
        // Recalculate positions for all lists
        const sortedLists = allLists.filter(l => l.id !== listId).sort((a, b) => a.position - b.position)
        sortedLists.splice(newPosition - 1, 0, { id: listId, position: 0 }) // Insert moved list at new position

        // Update all positions
        const updatePromises = sortedLists.map((list, index) => 
          this.supabase
            .from('lists')
            .update({ 
              position: index + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', list.id)
        )

        await Promise.all(updatePromises)
      }

      // Get the updated list
      const { data: updatedList, error } = await this.supabase
        .from('lists')
        .select('*')
        .eq('id', listId)
        .single()

      if (error || !updatedList) {
        logger.error('Failed to retrieve moved list', error as Error)
        throw createDatabaseError('Failed to move list')
      }

      logger.info('Successfully moved list', { listId, oldPosition, newPosition, userId })

      return {
        success: true,
        data: updatedList as List
      }
    } catch (error) {
      logger.error('Error in moveList', error as Error)
      throw error
    }
  }
}

export const listService = new ListService()