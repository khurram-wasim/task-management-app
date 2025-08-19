import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
  onAuthStateChange: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
}))

// Test component that uses the auth context
function TestComponent() {
  const { user, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (user) return <div>Welcome {user.email}</div>
  return <div>Not authenticated</div>
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should provide authentication context to children', async () => {
    const { getCurrentUser, onAuthStateChange } = await import('@/lib/auth')
    
    // Mock no initial user
    vi.mocked(getCurrentUser).mockResolvedValue(null)
    
    // Mock auth state change listener
    vi.mocked(onAuthStateChange).mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn()
        }
      }
    } as any)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // Should show not authenticated after loading
    await waitFor(() => {
      expect(screen.getByText('Not authenticated')).toBeInTheDocument()
    })
  })

  it('should handle authenticated user', async () => {
    const { getCurrentUser, onAuthStateChange } = await import('@/lib/auth')
    
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      user_metadata: {}
    }

    // Mock authenticated user
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    
    // Mock auth state change listener
    vi.mocked(onAuthStateChange).mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn()
        }
      }
    } as any)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Should show welcome message for authenticated user
    await waitFor(() => {
      expect(screen.getByText('Welcome test@example.com')).toBeInTheDocument()
    })
  })

  it('should throw error when useAuth is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')
    
    consoleSpy.mockRestore()
  })
})