// Tests for database service
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the database configuration before imports
vi.mock('@/config/database', () => ({
  getSupabaseAdmin: vi.fn(),
  getSupabaseForUser: vi.fn()
}))

// Mock the logger
vi.mock('@/utils', () => ({
  logger: {
    database: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

// Import after mocks
import { DatabaseService } from './database.service'
import { getSupabaseAdmin, getSupabaseForUser } from '@/config/database'

// Helper function to create chainable query mocks
const createChainableQuery = () => {
  const chainable = {
    select: vi.fn(() => chainable),
    eq: vi.fn(() => chainable),
    order: vi.fn(() => Promise.resolve({ data: [], error: null })),
    single: vi.fn(() => Promise.resolve({ data: { id: '123', name: 'Test' }, error: null })),
    insert: vi.fn(() => chainable),
    update: vi.fn(() => chainable),
    delete: vi.fn(() => chainable)
  }
  return chainable
}

describe('DatabaseService', () => {
  let service: DatabaseService
  let mockAdmin: any
  let mockUser: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Create mocks using the chainable query helper
    
    // Create admin client mock
    mockAdmin = {
      from: vi.fn((table) => {
        const query = createChainableQuery()
        
        // Override specific behaviors for different operations
        if (table === 'boards' || table === 'lists' || table === 'tasks') {
          // For delete operations, create a chainable query that can handle .eq() calls
          query.delete = vi.fn(() => {
            const deleteQuery = createChainableQuery()
            // Override eq to be chainable but also provide a final resolution
            deleteQuery.eq = vi.fn(() => {
              // Return a chainable object that can be awaited
              return Object.assign(Promise.resolve({ error: null }), {
                eq: vi.fn(() => Promise.resolve({ error: null }))
              })
            })
            return deleteQuery
          })
          query.insert = vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: { id: '123', name: 'Test' }, error: null }))
            }))
          }))
          query.update = vi.fn(() => {
            const updateQuery = createChainableQuery()
            updateQuery.select = vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: { id: '123', name: 'Test' }, error: null }))
            }))
            return updateQuery
          })
        }
        
        return query
      })
    }
    
    mockUser = { ...mockAdmin }
    
    // Mock the functions to return our mock clients
    vi.mocked(getSupabaseAdmin).mockReturnValue(mockAdmin)
    vi.mocked(getSupabaseForUser).mockReturnValue(mockUser)
    
    service = new DatabaseService()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Board operations', () => {
    it('should get boards for user', async () => {
      const boards = await service.getBoards('user-123')
      expect(boards).toEqual([])
      expect(mockAdmin.from).toHaveBeenCalledWith('boards')
    })

    it('should get board by ID', async () => {
      const board = await service.getBoardById('board-123', 'user-123')
      expect(board).toEqual({ id: '123', name: 'Test' })
      expect(mockAdmin.from).toHaveBeenCalledWith('boards')
    })

    it('should create board', async () => {
      const boardData = {
        user_id: 'user-123',
        name: 'Test Board',
        description: 'Test Description'
      }
      
      const board = await service.createBoard(boardData)
      expect(board).toEqual({ id: '123', name: 'Test' })
      expect(mockAdmin.from).toHaveBeenCalledWith('boards')
    })

    it('should update board', async () => {
      const updates = { name: 'Updated Board' }
      
      const board = await service.updateBoard('board-123', updates, 'user-123')
      expect(board).toEqual({ id: '123', name: 'Test' })
      expect(mockAdmin.from).toHaveBeenCalledWith('boards')
    })

    it('should delete board', async () => {
      const result = await service.deleteBoard('board-123', 'user-123')
      expect(result).toBe(true)
      expect(mockAdmin.from).toHaveBeenCalledWith('boards')
    })
  })

  describe('List operations', () => {
    it('should get lists by board ID', async () => {
      const lists = await service.getListsByBoardId('board-123')
      expect(lists).toEqual([])
      expect(mockAdmin.from).toHaveBeenCalledWith('lists')
    })

    it('should create list', async () => {
      const listData = {
        board_id: 'board-123',
        name: 'Test List',
        position: 1
      }
      
      const list = await service.createList(listData)
      expect(list).toEqual({ id: '123', name: 'Test' })
      expect(mockAdmin.from).toHaveBeenCalledWith('lists')
    })
  })

  describe('Task operations', () => {
    it('should get tasks by list ID', async () => {
      const tasks = await service.getTasksByListId('list-123')
      expect(tasks).toEqual([])
      expect(mockAdmin.from).toHaveBeenCalledWith('tasks')
    })

    it('should create task', async () => {
      const taskData = {
        list_id: 'list-123',
        title: 'Test Task',
        description: 'Test Description'
      }
      
      const task = await service.createTask(taskData)
      expect(task).toEqual({ id: '123', name: 'Test' })
      expect(mockAdmin.from).toHaveBeenCalledWith('tasks')
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockError = { code: 'DB_ERROR', message: 'Database connection failed' }
      
      // Override the mock for this test to return an error
      const errorQuery = createChainableQuery()
      errorQuery.order = vi.fn(() => Promise.resolve({ data: null, error: mockError }))
      mockAdmin.from.mockReturnValue(errorQuery)

      await expect(service.getBoards('user-123')).rejects.toEqual(mockError)
      expect(mockAdmin.from).toHaveBeenCalledWith('boards')
    })
  })
})