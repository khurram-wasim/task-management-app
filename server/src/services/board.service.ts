// Board service for managing board operations
import { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/config/database'
import { Board, CreateBoardData, UpdateBoardData, BoardWithCollaborators, ServiceResponse } from '@/types'
import { logger } from '@/utils'
import { createNotFoundError, createDatabaseError, createConflictError } from '@/middleware/errorHandler'

export class BoardService {
  private supabase: SupabaseClient

  constructor() {
    this.supabase = getSupabaseAdmin()
  }

  // Get all boards for a user
  async getUserBoards(userId: string, page: number = 1, limit: number = 20): Promise<ServiceResponse<{ boards: any[]; total: number }>> {
    try {
      logger.debug('Getting user boards', { userId, page, limit })

      const offset = (page - 1) * limit

      // Get boards where user is owner with statistics
      const { data: ownedBoards, error: ownedError } = await this.supabase
        .from('boards')
        .select(`
          *,
          lists (
            id,
            tasks (
              id
            )
          ),
          board_collaborators (
            id
          )
        `)
        .eq('user_id', userId)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })

      if (ownedError) {
        logger.error('Failed to fetch owned boards', ownedError as Error)
        throw createDatabaseError('Failed to fetch boards')
      }

      // Transform the data to include statistics
      const data = ownedBoards?.map(board => ({
        id: board.id,
        user_id: board.user_id,
        name: board.name,
        description: board.description,
        created_at: board.created_at,
        updated_at: board.updated_at,
        lists_count: (board as any).lists?.length || 0,
        tasks_count: (board as any).lists?.reduce((total: number, list: any) => 
          total + (list.tasks?.length || 0), 0) || 0,
        collaborators_count: (board as any).board_collaborators?.length || 0,
        last_activity: board.updated_at,
        is_owner: true,
        role: 'owner' as const
      })) || []
      
      const count = data.length


      logger.info('Successfully retrieved user boards', { userId, count: data?.length || 0 })

      return {
        success: true,
        data: {
          boards: data,
          total: count
        }
      }
    } catch (error) {
      logger.error('Error in getUserBoards', error as Error)
      throw error
    }
  }

  // Get board by ID with access check
  async getBoardById(boardId: string, userId: string): Promise<ServiceResponse<BoardWithCollaborators>> {
    try {
      logger.debug('Getting board by ID', { boardId, userId })

      // Check if user has access to board
      const { data, error } = await this.supabase
        .from('boards')
        .select(`
          *,
          lists (
            id,
            name,
            position,
            tasks (
              id,
              title,
              position
            )
          )
        `)
        .eq('id', boardId)
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        logger.warn('Board not found or access denied', { boardId, userId, error })
        throw createNotFoundError('Board')
      }

      logger.info('Successfully retrieved board', { boardId, userId })

      return {
        success: true,
        data: data as BoardWithCollaborators
      }
    } catch (error) {
      logger.error('Error in getBoardById', error as Error)
      throw error
    }
  }

  // Create a new board
  async createBoard(data: CreateBoardData, userId: string): Promise<ServiceResponse<Board>> {
    try {
      logger.debug('Creating new board', { data, userId })

      const { data: board, error } = await this.supabase
        .from('boards')
        .insert({
          name: data.name,
          description: data.description || null,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        logger.error('Failed to create board', error as Error)
        if (error.code === '23505') {
          throw createConflictError('Board with this name already exists')
        }
        throw createDatabaseError('Failed to create board')
      }

      // Add owner as collaborator with admin role
      const { error: collaboratorError } = await this.supabase
        .from('board_collaborators')
        .insert({
          board_id: board.id,
          user_id: userId,
          role: 'admin',
          created_at: new Date().toISOString()
        })

      if (collaboratorError) {
        logger.error('Failed to add owner as collaborator', collaboratorError as Error)
        // Try to clean up the board if collaborator creation fails
        await this.supabase.from('boards').delete().eq('id', board.id)
        throw createDatabaseError('Failed to create board')
      }

      logger.info('Successfully created board', { boardId: board.id, userId })

      return {
        success: true,
        data: board as Board
      }
    } catch (error) {
      logger.error('Error in createBoard', error as Error)
      throw error
    }
  }

  // Update board
  async updateBoard(boardId: string, data: UpdateBoardData, userId: string): Promise<ServiceResponse<Board>> {
    try {
      logger.debug('Updating board', { boardId, data, userId })

      // Check if user is the owner of the board
      const { data: existingBoard, error: boardError } = await this.supabase
        .from('boards')
        .select('user_id')
        .eq('id', boardId)
        .single()

      if (boardError || !existingBoard) {
        logger.warn('Board not found', { boardId, userId })
        throw createNotFoundError('Board')
      }

      if (existingBoard.user_id !== userId) {
        logger.warn('User does not have permission to update this board', { boardId, userId, ownerId: existingBoard.user_id })
        throw createNotFoundError('Board')
      }

      const { data: updatedBoard, error } = await this.supabase
        .from('boards')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', boardId)
        .select()
        .single()

      if (error || !updatedBoard) {
        logger.error('Failed to update board', (error as Error) || new Error('Unknown error'))
        throw createDatabaseError('Failed to update board')
      }

      logger.info('Successfully updated board', { boardId, userId })

      return {
        success: true,
        data: updatedBoard as Board
      }
    } catch (error) {
      logger.error('Error in updateBoard', error as Error)
      throw error
    }
  }

  // Delete board
  async deleteBoard(boardId: string, userId: string): Promise<ServiceResponse<void>> {
    try {
      logger.debug('Deleting board', { boardId, userId })

      // Check if user is the owner
      const { data: board } = await this.supabase
        .from('boards')
        .select('user_id')
        .eq('id', boardId)
        .single()

      if (!board || board.user_id !== userId) {
        logger.warn('User is not the owner of the board', { boardId, userId })
        throw createNotFoundError('Board')
      }

      const { error } = await this.supabase
        .from('boards')
        .delete()
        .eq('id', boardId)

      if (error) {
        logger.error('Failed to delete board', error as Error)
        throw createDatabaseError('Failed to delete board')
      }

      logger.info('Successfully deleted board', { boardId, userId })

      return {
        success: true,
        data: undefined
      }
    } catch (error) {
      logger.error('Error in deleteBoard', error as Error)
      throw error
    }
  }

  // Add collaborator to board
  async addCollaborator(boardId: string, email: string, role: 'member' | 'admin', requestUserId: string): Promise<ServiceResponse<void>> {
    try {
      logger.debug('Adding collaborator to board', { boardId, email, role, requestUserId })

      // Check if requesting user is board owner or has admin access
      const { data: board } = await this.supabase
        .from('boards')
        .select('user_id')
        .eq('id', boardId)
        .single()

      if (!board) {
        logger.warn('Board not found', { boardId })
        throw createNotFoundError('Board')
      }

      const isOwner = board.user_id === requestUserId

      if (!isOwner) {
        // Check if user has admin role
        const { data: requesterAccess } = await this.supabase
          .from('board_collaborators')
          .select('role')
          .eq('board_id', boardId)
          .eq('user_id', requestUserId)
          .single()

        if (!requesterAccess || requesterAccess.role !== 'admin') {
          logger.warn('User does not have admin access to add collaborators', { boardId, requestUserId })
          throw createNotFoundError('Board')
        }
      }

      // Find user by email
      const { data: user } = await this.supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single()

      if (!user) {
        logger.warn('User not found for collaboration', { email })
        throw createNotFoundError('User')
      }

      // Add collaborator
      const { error } = await this.supabase
        .from('board_collaborators')
        .insert({
          board_id: boardId,
          user_id: user.id,
          role,
          created_at: new Date().toISOString()
        })

      if (error) {
        logger.error('Failed to add collaborator', error)
        if (error.code === '23505') {
          throw createConflictError('User is already a collaborator on this board')
        }
        throw createDatabaseError('Failed to add collaborator')
      }

      logger.info('Successfully added collaborator', { boardId, userId: user.id, role })

      return {
        success: true,
        data: undefined
      }
    } catch (error) {
      logger.error('Error in addCollaborator', error as Error)
      throw error
    }
  }

  // Remove collaborator from board
  async removeCollaborator(boardId: string, userId: string, requestUserId: string): Promise<ServiceResponse<void>> {
    try {
      logger.debug('Removing collaborator from board', { boardId, userId, requestUserId })

      // Check if requesting user has admin access
      const { data: requesterAccess } = await this.supabase
        .from('board_collaborators')
        .select('role')
        .eq('board_id', boardId)
        .eq('user_id', requestUserId)
        .single()

      if (!requesterAccess || requesterAccess.role !== 'admin') {
        logger.warn('User does not have admin access to remove collaborators', { boardId, requestUserId })
        throw createNotFoundError('Board')
      }

      // Don't allow removing the board owner
      const { data: board } = await this.supabase
        .from('boards')
        .select('user_id')
        .eq('id', boardId)
        .single()

      if (board && board.user_id === userId) {
        throw createConflictError('Cannot remove board owner')
      }

      const { error } = await this.supabase
        .from('board_collaborators')
        .delete()
        .eq('board_id', boardId)
        .eq('user_id', userId)

      if (error) {
        logger.error('Failed to remove collaborator', error as Error)
        throw createDatabaseError('Failed to remove collaborator')
      }

      logger.info('Successfully removed collaborator', { boardId, userId })

      return {
        success: true,
        data: undefined
      }
    } catch (error) {
      logger.error('Error in removeCollaborator', error as Error)
      throw error
    }
  }
}

export const boardService = new BoardService()