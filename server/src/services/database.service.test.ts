// Tests for database service
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DatabaseService } from './database.service'

// Mock the database configuration
vi.mock('@/config/database', () => ({
  getSupabaseAdmin: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null
          })),
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: '123', name: 'Test Board' },
              error: null
            }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: { id: '123', name: 'Updated Board' },
                error: null
              }))
            }))
          }))
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            error: null
          }))
        }))
      }))
    }))
  })),
  getSupabaseForUser: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null
          }))
        }))
      }))
    }))
  }))
}))

// Mock the logger
vi.mock('@/utils', () => ({
  logger: {
    database: vi.fn(),
    error: vi.fn()
  }
}))

describe('DatabaseService', () => {
  let service: DatabaseService

  beforeEach(() => {
    service = new DatabaseService()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Board operations', () => {
    it('should get boards for user', async () => {
      const boards = await service.getBoards('user-123')
      expect(boards).toEqual([])
    })

    it('should get board by ID', async () => {
      const board = await service.getBoardById('board-123', 'user-123')
      expect(board).toBeNull()
    })

    it('should create board', async () => {
      const boardData = {
        user_id: 'user-123',
        name: 'Test Board',
        description: 'Test Description'
      }
      
      const board = await service.createBoard(boardData)
      expect(board).toEqual({ id: '123', name: 'Test Board' })
    })

    it('should update board', async () => {
      const updates = { name: 'Updated Board' }
      
      const board = await service.updateBoard('board-123', updates, 'user-123')
      expect(board).toEqual({ id: '123', name: 'Updated Board' })
    })

    it('should delete board', async () => {
      const result = await service.deleteBoard('board-123', 'user-123')
      expect(result).toBe(true)
    })
  })

  describe('List operations', () => {
    it('should get lists by board ID', async () => {
      const lists = await service.getListsByBoardId('board-123')
      expect(lists).toEqual([])
    })

    it('should create list', async () => {
      const listData = {
        board_id: 'board-123',
        name: 'Test List',
        position: 1
      }
      
      const list = await service.createList(listData)
      expect(list).toEqual({ id: '123', name: 'Test Board' })
    })
  })

  describe('Task operations', () => {
    it('should get tasks by list ID', async () => {
      const tasks = await service.getTasksByListId('list-123')
      expect(tasks).toEqual([])
    })

    it('should create task', async () => {
      const taskData = {
        list_id: 'list-123',
        title: 'Test Task',
        description: 'Test Description'
      }
      
      const task = await service.createTask(taskData)
      expect(task).toEqual({ id: '123', name: 'Test Board' })
    })
  })

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock an error response
      const mockError = new Error('Database connection failed')
      vi.mocked(service['admin'].from).mockReturnValue({
        select: () => {
          throw mockError
        }
      } as any)

      await expect(service.getBoards('user-123')).rejects.toThrow('Database connection failed')
    })
  })
})