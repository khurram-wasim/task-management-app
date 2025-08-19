// Tests for API client utility
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { api, setAuthToken, getAuthToken, ApiError } from './api'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    setAuthToken(null)
  })

  describe('Token Management', () => {
    it('should set and get auth token', () => {
      const token = 'test-token-123'
      setAuthToken(token)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', token)
      expect(getAuthToken()).toBe(token)
    })

    it('should remove auth token', () => {
      setAuthToken('test-token')
      setAuthToken(null)
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
    })

    it('should get token from localStorage if not in memory', () => {
      mockLocalStorage.getItem.mockReturnValue('stored-token')
      
      expect(getAuthToken()).toBe('stored-token')
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token')
    })
  })

  describe('API Requests', () => {
    it('should make successful login request', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@example.com' },
        token: 'jwt-token',
        expiresIn: '24h'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse })
      })

      const result = await api.login({ email: 'test@example.com', password: 'password' })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ email: 'test@example.com', password: 'password' })
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should include auth token in authenticated requests', async () => {
      setAuthToken('test-token')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })

      await api.getBoards()

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/boards?page=1&limit=20',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      )
    })

    it('should handle API errors correctly', async () => {
      const errorResponse = {
        success: false,
        message: 'Validation failed',
        error: {
          code: 'VALIDATION_ERROR',
          details: { field: 'email' }
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => errorResponse
      })

      await expect(api.login({ email: 'invalid', password: 'test' }))
        .rejects.toThrow(ApiError)

      try {
        await api.login({ email: 'invalid', password: 'test' })
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).status).toBe(400)
        expect((error as ApiError).code).toBe('VALIDATION_ERROR')
        expect((error as ApiError).message).toBe('Validation failed')
        expect((error as ApiError).details).toEqual({ field: 'email' })
      }
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(api.login({ email: 'test@example.com', password: 'password' }))
        .rejects.toThrow(ApiError)

      try {
        await api.login({ email: 'test@example.com', password: 'password' })
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).status).toBe(0)
        expect((error as ApiError).code).toBe('NETWORK_ERROR')
        expect((error as ApiError).message).toBe('Network error')
      }
    })

    it('should handle non-JSON error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => { throw new Error('Invalid JSON') }
      })

      await expect(api.getBoards())
        .rejects.toThrow(ApiError)

      try {
        await api.getBoards()
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError)
        expect((error as ApiError).status).toBe(500)
        expect((error as ApiError).message).toBe('HTTP 500: Internal Server Error')
      }
    })
  })

  describe('Board Operations', () => {
    it('should create board', async () => {
      const boardData = { name: 'Test Board', description: 'Test Description' }
      const mockBoard = { id: '1', ...boardData, userId: 'user1', createdAt: '2024-01-01', updatedAt: '2024-01-01' }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockBoard })
      })

      const result = await api.createBoard(boardData)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/boards',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(boardData)
        })
      )
      expect(result).toEqual(mockBoard)
    })

    it('should get boards with pagination', async () => {
      const mockResponse = { boards: [], total: 0 }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse })
      })

      await api.getBoards(2, 10)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/boards?page=2&limit=10',
        expect.any(Object)
      )
    })
  })

  describe('Task Operations', () => {
    it('should move task', async () => {
      const taskId = 'task-1'
      const moveData = { listId: 'list-2', position: 3 }
      const mockTask = { id: taskId, title: 'Test Task', listId: 'list-2', position: 3 }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockTask })
      })

      const result = await api.moveTask(taskId, moveData)

      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/api/tasks/${taskId}/move`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(moveData)
        })
      )
      expect(result).toEqual(mockTask)
    })

    it('should add task label', async () => {
      const taskId = 'task-1'
      const label = { name: 'Priority', color: '#FF0000' }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      await api.addTaskLabel(taskId, label)

      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/api/tasks/${taskId}/labels`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(label)
        })
      )
    })
  })

  describe('Health Check', () => {
    it('should check API health', async () => {
      const mockHealth = {
        status: 'OK',
        message: 'Task Management API is running',
        timestamp: '2024-01-01T00:00:00.000Z',
        version: '1.0.0'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockHealth })
      })

      const result = await api.healthCheck()

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/health',
        expect.any(Object)
      )
      expect(result).toEqual(mockHealth)
    })
  })
})