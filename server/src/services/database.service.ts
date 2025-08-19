// Base database service with common operations
import { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin, getSupabaseForUser } from '@/config/database'
import { logger } from '@/utils'
import type { Database, Board, BoardInsert, BoardUpdate, List, ListInsert, ListUpdate, Task, TaskInsert, TaskUpdate, TaskLabel, TaskLabelInsert, BoardCollaborator, BoardCollaboratorInsert } from '@/types/database'

export class DatabaseService {
  protected admin: SupabaseClient<Database>

  constructor() {
    this.admin = getSupabaseAdmin()
  }

  // Get client for specific user (respects RLS)
  protected getUserClient(accessToken: string): SupabaseClient<Database> {
    return getSupabaseForUser(accessToken)
  }

  // Board operations
  async getBoards(userId: string, accessToken?: string): Promise<Board[]> {
    try {
      const client = accessToken ? this.getUserClient(accessToken) : this.admin
      
      const { data, error } = await client
        .from('boards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        logger.database('getBoards', 'boards', 0)
        throw error
      }
      
      logger.database('getBoards', 'boards', performance.now(), data?.length)
      return data || []
    } catch (error) {
      logger.error('Failed to get boards', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  async getBoardById(id: string, userId?: string, accessToken?: string): Promise<Board | null> {
    try {
      const client = accessToken ? this.getUserClient(accessToken) : this.admin
      
      let query = client.from('boards').select('*').eq('id', id)
      
      // Add user filter if provided (for RLS)
      if (userId) {
        query = query.eq('user_id', userId)
      }
      
      const { data, error } = await query.single()
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        logger.database('getBoardById', 'boards', 0)
        throw error
      }
      
      logger.database('getBoardById', 'boards', performance.now(), data ? 1 : 0)
      return data || null
    } catch (error) {
      logger.error('Failed to get board by ID', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  async createBoard(board: BoardInsert, accessToken?: string): Promise<Board> {
    try {
      const client = accessToken ? this.getUserClient(accessToken) : this.admin
      
      const { data, error } = await client
        .from('boards')
        .insert(board)
        .select()
        .single()
      
      if (error) {
        logger.database('createBoard', 'boards', 0)
        throw error
      }
      
      logger.database('createBoard', 'boards', performance.now(), 1)
      return data
    } catch (error) {
      logger.error('Failed to create board', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  async updateBoard(id: string, updates: BoardUpdate, userId?: string, accessToken?: string): Promise<Board | null> {
    try {
      const client = accessToken ? this.getUserClient(accessToken) : this.admin
      
      let query = client.from('boards').update(updates).eq('id', id)
      
      // Add user filter if provided (for RLS)
      if (userId) {
        query = query.eq('user_id', userId)
      }
      
      const { data, error } = await query.select().single()
      
      if (error && error.code !== 'PGRST116') {
        logger.database('updateBoard', 'boards', 0)
        throw error
      }
      
      logger.database('updateBoard', 'boards', performance.now(), data ? 1 : 0)
      return data || null
    } catch (error) {
      logger.error('Failed to update board', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  async deleteBoard(id: string, userId?: string, accessToken?: string): Promise<boolean> {
    try {
      const client = accessToken ? this.getUserClient(accessToken) : this.admin
      
      let query = client.from('boards').delete().eq('id', id)
      
      // Add user filter if provided (for RLS)
      if (userId) {
        query = query.eq('user_id', userId)
      }
      
      const { error } = await query
      
      if (error) {
        logger.database('deleteBoard', 'boards', 0)
        throw error
      }
      
      logger.database('deleteBoard', 'boards', performance.now(), 1)
      return true
    } catch (error) {
      logger.error('Failed to delete board', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // List operations
  async getListsByBoardId(boardId: string, accessToken?: string): Promise<List[]> {
    try {
      const client = accessToken ? this.getUserClient(accessToken) : this.admin
      
      const { data, error } = await client
        .from('lists')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true })
      
      if (error) {
        logger.database('getListsByBoardId', 'lists', 0)
        throw error
      }
      
      logger.database('getListsByBoardId', 'lists', performance.now(), data?.length)
      return data || []
    } catch (error) {
      logger.error('Failed to get lists by board ID', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  async createList(list: ListInsert, accessToken?: string): Promise<List> {
    try {
      const client = accessToken ? this.getUserClient(accessToken) : this.admin
      
      const { data, error } = await client
        .from('lists')
        .insert(list)
        .select()
        .single()
      
      if (error) {
        logger.database('createList', 'lists', 0)
        throw error
      }
      
      logger.database('createList', 'lists', performance.now(), 1)
      return data
    } catch (error) {
      logger.error('Failed to create list', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  async updateList(id: string, updates: ListUpdate, accessToken?: string): Promise<List | null> {
    try {
      const client = accessToken ? this.getUserClient(accessToken) : this.admin
      
      const { data, error } = await client
        .from('lists')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error && error.code !== 'PGRST116') {
        logger.database('updateList', 'lists', 0)
        throw error
      }
      
      logger.database('updateList', 'lists', performance.now(), data ? 1 : 0)
      return data || null
    } catch (error) {
      logger.error('Failed to update list', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  async deleteList(id: string, accessToken?: string): Promise<boolean> {
    try {
      const client = accessToken ? this.getUserClient(accessToken) : this.admin
      
      const { error } = await client.from('lists').delete().eq('id', id)
      
      if (error) {
        logger.database('deleteList', 'lists', 0)
        throw error
      }
      
      logger.database('deleteList', 'lists', performance.now(), 1)
      return true
    } catch (error) {
      logger.error('Failed to delete list', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Task operations
  async getTasksByListId(listId: string, accessToken?: string): Promise<Task[]> {
    try {
      const client = accessToken ? this.getUserClient(accessToken) : this.admin
      
      const { data, error } = await client
        .from('tasks')
        .select('*')
        .eq('list_id', listId)
        .order('position', { ascending: true })
      
      if (error) {
        logger.database('getTasksByListId', 'tasks', 0)
        throw error
      }
      
      logger.database('getTasksByListId', 'tasks', performance.now(), data?.length)
      return data || []
    } catch (error) {
      logger.error('Failed to get tasks by list ID', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  async createTask(task: TaskInsert, accessToken?: string): Promise<Task> {
    try {
      const client = accessToken ? this.getUserClient(accessToken) : this.admin
      
      const { data, error } = await client
        .from('tasks')
        .insert(task)
        .select()
        .single()
      
      if (error) {
        logger.database('createTask', 'tasks', 0)
        throw error
      }
      
      logger.database('createTask', 'tasks', performance.now(), 1)
      return data
    } catch (error) {
      logger.error('Failed to create task', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  async updateTask(id: string, updates: TaskUpdate, accessToken?: string): Promise<Task | null> {
    try {
      const client = accessToken ? this.getUserClient(accessToken) : this.admin
      
      const { data, error } = await client
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error && error.code !== 'PGRST116') {
        logger.database('updateTask', 'tasks', 0)
        throw error
      }
      
      logger.database('updateTask', 'tasks', performance.now(), data ? 1 : 0)
      return data || null
    } catch (error) {
      logger.error('Failed to update task', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  async deleteTask(id: string, accessToken?: string): Promise<boolean> {
    try {
      const client = accessToken ? this.getUserClient(accessToken) : this.admin
      
      const { error } = await client.from('tasks').delete().eq('id', id)
      
      if (error) {
        logger.database('deleteTask', 'tasks', 0)
        throw error
      }
      
      logger.database('deleteTask', 'tasks', performance.now(), 1)
      return true
    } catch (error) {
      logger.error('Failed to delete task', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Task label operations
  async getTaskLabels(taskId: string, accessToken?: string): Promise<TaskLabel[]> {
    try {
      const client = accessToken ? this.getUserClient(accessToken) : this.admin
      
      const { data, error } = await client
        .from('task_labels')
        .select('*')
        .eq('task_id', taskId)
      
      if (error) {
        logger.database('getTaskLabels', 'task_labels', 0)
        throw error
      }
      
      logger.database('getTaskLabels', 'task_labels', performance.now(), data?.length)
      return data || []
    } catch (error) {
      logger.error('Failed to get task labels', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  async createTaskLabel(label: TaskLabelInsert, accessToken?: string): Promise<TaskLabel> {
    try {
      const client = accessToken ? this.getUserClient(accessToken) : this.admin
      
      const { data, error } = await client
        .from('task_labels')
        .insert(label)
        .select()
        .single()
      
      if (error) {
        logger.database('createTaskLabel', 'task_labels', 0)
        throw error
      }
      
      logger.database('createTaskLabel', 'task_labels', performance.now(), 1)
      return data
    } catch (error) {
      logger.error('Failed to create task label', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Board collaborator operations
  async getBoardCollaborators(boardId: string, accessToken?: string): Promise<BoardCollaborator[]> {
    try {
      const client = accessToken ? this.getUserClient(accessToken) : this.admin
      
      const { data, error } = await client
        .from('board_collaborators')
        .select('*')
        .eq('board_id', boardId)
      
      if (error) {
        logger.database('getBoardCollaborators', 'board_collaborators', 0)
        throw error
      }
      
      logger.database('getBoardCollaborators', 'board_collaborators', performance.now(), data?.length)
      return data || []
    } catch (error) {
      logger.error('Failed to get board collaborators', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  async addBoardCollaborator(collaborator: BoardCollaboratorInsert, accessToken?: string): Promise<BoardCollaborator> {
    try {
      const client = accessToken ? this.getUserClient(accessToken) : this.admin
      
      const { data, error } = await client
        .from('board_collaborators')
        .insert(collaborator)
        .select()
        .single()
      
      if (error) {
        logger.database('addBoardCollaborator', 'board_collaborators', 0)
        throw error
      }
      
      logger.database('addBoardCollaborator', 'board_collaborators', performance.now(), 1)
      return data
    } catch (error) {
      logger.error('Failed to add board collaborator', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }
}

// Singleton instance
export const databaseService = new DatabaseService()