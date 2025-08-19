import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signUp, signIn, signOut, getCurrentUser } from './auth'
import { supabase } from './supabase'

// Mock the supabase client
vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    }
  }
}))

const mockSupabase = supabase as any

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signUp', () => {
    it('should sign up user successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const result = await signUp('test@example.com', 'password123')

      expect(result.user).toEqual(mockUser)
      expect(result.error).toBeNull()
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('should handle sign up error', async () => {
      const mockError = { message: 'Email already registered' }
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: mockError
      })

      const result = await signUp('test@example.com', 'password123')

      expect(result.user).toBeNull()
      expect(result.error).toBe('Email already registered')
    })

    it('should handle unexpected errors', async () => {
      mockSupabase.auth.signUp.mockRejectedValue(new Error('Network error'))

      const result = await signUp('test@example.com', 'password123')

      expect(result.user).toBeNull()
      expect(result.error).toBe('An unexpected error occurred during sign up')
    })
  })

  describe('signIn', () => {
    it('should sign in user successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const result = await signIn('test@example.com', 'password123')

      expect(result.user).toEqual(mockUser)
      expect(result.error).toBeNull()
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('should handle sign in error', async () => {
      const mockError = { message: 'Invalid credentials' }
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: mockError
      })

      const result = await signIn('test@example.com', 'wrongpassword')

      expect(result.user).toBeNull()
      expect(result.error).toBe('Invalid credentials')
    })
  })

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      const result = await signOut()

      expect(result.error).toBeNull()
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    it('should handle sign out error', async () => {
      const mockError = { message: 'Sign out failed' }
      mockSupabase.auth.signOut.mockResolvedValue({ error: mockError })

      const result = await signOut()

      expect(result.error).toBe('Sign out failed')
    })
  })

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      const mockUser = { 
        id: '123', 
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser }
      })

      const result = await getCurrentUser()

      expect(result).toEqual({
        id: '123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      })
    })

    it('should return null when no user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null }
      })

      const result = await getCurrentUser()

      expect(result).toBeNull()
    })

    it('should handle errors gracefully', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Network error'))

      const result = await getCurrentUser()

      expect(result).toBeNull()
    })
  })
})