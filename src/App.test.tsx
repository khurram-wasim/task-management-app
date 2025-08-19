import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import App from './App'

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn().mockResolvedValue(null),
  onAuthStateChange: vi.fn().mockReturnValue({
    data: {
      subscription: {
        unsubscribe: vi.fn()
      }
    }
  }),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
}))

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
})

describe('App', () => {
  it('renders login page when not authenticated', async () => {
    render(<App />)
    
    // Should redirect to login and show login form
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    })
  })

  it('renders sign in button', async () => {
    render(<App />)
    
    // Should show the sign in button on login page
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })
  })
})