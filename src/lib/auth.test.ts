import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signUp, signIn, signOut, getCurrentUser } from './auth'
import { api, ApiError } from './api'

// Mock the API client
vi.mock('./api', () => ({
  api: {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  },
  setAuthToken: vi.fn(),
  getAuthToken: vi.fn(),
  ApiError: vi.fn().mockImplementation((message: string, status: number) => {
    const error = new Error(message)
    error.name = 'ApiError'
    ;(error as any).status = status
    return error
  })
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

const mockApi = api as any
const mockSetAuthToken = vi.mocked(await import('./api')).setAuthToken as any
const mockGetAuthToken = vi.mocked(await import('./api')).getAuthToken as any

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
  })

  describe('signUp', () => {
    it('should sign up user successfully', async () => {
      const mockResponse = {
        user: { id: '123', email: 'test@example.com', fullName: 'Test User' },
        token: 'mock-token'
      }
      mockApi.register.mockResolvedValue(mockResponse)

      const result = await signUp('test@example.com', 'password123', 'Test User')

      expect(result.user).toEqual({
        id: '123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      })
      expect(result.error).toBeNull()
      expect(mockApi.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User'
      })
    })

    it('should handle sign up error', async () => {
      const mockError = new Error('Email already registered')
      mockError.name = 'ApiError'
      ;(mockError as any).status = 422
      mockApi.register.mockRejectedValue(mockError)

      const result = await signUp('test@example.com', 'password123')

      expect(result.user).toBeNull()
      expect(result.error).toBe('Email already registered')
    })

    it('should handle unexpected errors', async () => {
      mockApi.register.mockRejectedValue(new Error('Network error'))

      const result = await signUp('test@example.com', 'password123')

      expect(result.user).toBeNull()
      expect(result.error).toBe('An unexpected error occurred during sign up')
    })
  })

  describe('signIn', () => {
    it('should sign in user successfully', async () => {
      const mockResponse = {
        user: { id: '123', email: 'test@example.com', fullName: 'Test User' },
        token: 'mock-token'
      }
      mockApi.login.mockResolvedValue(mockResponse)

      const result = await signIn('test@example.com', 'password123')

      expect(result.user).toEqual({
        id: '123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      })
      expect(result.error).toBeNull()
      expect(mockApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('should handle sign in error', async () => {
      const mockError = new Error('Invalid credentials')
      mockError.name = 'ApiError'
      ;(mockError as any).status = 401
      mockApi.login.mockRejectedValue(mockError)

      const result = await signIn('test@example.com', 'wrongpassword')

      expect(result.user).toBeNull()
      expect(result.error).toBe('Invalid credentials')
    })
  })

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      mockGetAuthToken.mockReturnValue('mock-token')
      mockApi.logout.mockResolvedValue(undefined)

      const result = await signOut()

      expect(result.error).toBeNull()
      expect(mockApi.logout).toHaveBeenCalled()
    })

    it('should handle sign out error', async () => {
      mockLocalStorage.getItem.mockReturnValue('mock-token')
      mockApi.logout.mockRejectedValue(new Error('Logout failed'))

      const result = await signOut()

      // Should always return success for logout (clears local state regardless)
      expect(result.error).toBeNull()
    })
  })

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com', fullName: 'Test User' }
      mockGetAuthToken.mockReturnValue('mock-token')
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ id: '123', email: 'test@example.com', user_metadata: { full_name: 'Test User' } }))
      mockApi.getCurrentUser.mockResolvedValue(mockUser)

      const result = await getCurrentUser()

      expect(result).toEqual({
        id: '123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      })
    })

    it('should return null when no user', async () => {
      mockGetAuthToken.mockReturnValue(null)
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = await getCurrentUser()

      expect(result).toBeNull()
    })

    it('should handle errors gracefully', async () => {
      mockGetAuthToken.mockReturnValue(null)
      mockLocalStorage.getItem.mockReturnValue(null)
      const mockError = new Error('Unauthorized')
      mockError.name = 'ApiError'
      ;(mockError as any).status = 401
      mockApi.getCurrentUser.mockRejectedValue(mockError)

      const result = await getCurrentUser()

      expect(result).toBeNull()
    })
  })
})