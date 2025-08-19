import { api, setAuthToken, getAuthToken, ApiError } from './api'
import type { AuthUser } from '@/types'

/**
 * Authentication utilities for the task management app
 * Updated to use backend API instead of Supabase directly
 */

// Auth state change listeners
let authListeners: ((user: AuthUser | null) => void)[] = []
let currentUser: AuthUser | null = null

// Store current user in memory and localStorage
const setCurrentUser = (user: AuthUser | null) => {
  currentUser = user
  if (user) {
    localStorage.setItem('current_user', JSON.stringify(user))
  } else {
    localStorage.removeItem('current_user')
  }
  
  // Notify all listeners
  authListeners.forEach(callback => callback(user))
}

// Initialize user from localStorage on app start
const initializeAuth = () => {
  const token = getAuthToken()
  if (token) {
    const storedUser = localStorage.getItem('current_user')
    if (storedUser) {
      try {
        currentUser = JSON.parse(storedUser)
        // Setup token refresh for existing session
        setupTokenRefresh()
      } catch {
        // Clear invalid stored user
        localStorage.removeItem('current_user')
        setAuthToken(null)
      }
    }
  }
}

// Initialize on module load
initializeAuth()

// Token refresh timer
let refreshTimer: NodeJS.Timeout | null = null

// Setup automatic token refresh
const setupTokenRefresh = () => {
  // Clear existing timer
  if (refreshTimer) {
    clearTimeout(refreshTimer)
  }

  const token = getAuthToken()
  if (!token) return

  // Try to refresh token every 6 hours (21600000 ms)
  // In a real app, you'd decode the JWT to check expiry
  refreshTimer = setTimeout(async () => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        // Token is invalid, sign out
        await signOut()
      } else {
        // Setup next refresh
        setupTokenRefresh()
      }
    } catch (error) {
      console.warn('Token refresh failed:', error)
      await signOut()
    }
  }, 21600000) // 6 hours
}

// API error handler for 401 responses (token expired)
const handleApiError = (error: any) => {
  if (error instanceof ApiError && error.status === 401) {
    // Token expired, automatically sign out
    signOut()
  }
}

/**
 * Sign up a new user with email and password
 */
export const signUp = async (email: string, password: string, fullName?: string) => {
  try {
    const response = await api.register({ email, password, fullName })
    
    // Set authentication token
    setAuthToken(response.token)
    
    // Convert API response to AuthUser format
    const user: AuthUser = {
      id: response.user.id,
      email: response.user.email,
      user_metadata: {
        full_name: response.user.fullName
      }
    }
    
    setCurrentUser(user)
    
    // Setup token refresh timer
    setupTokenRefresh()
    
    return { user, error: null }
  } catch (error) {
    if (error instanceof ApiError) {
      return { user: null, error: error.message }
    }
    return { user: null, error: 'An unexpected error occurred during sign up' }
  }
}

/**
 * Sign in an existing user with email and password
 */
export const signIn = async (email: string, password: string) => {
  try {
    const response = await api.login({ email, password })
    
    // Set authentication token
    setAuthToken(response.token)
    
    // Convert API response to AuthUser format
    const user: AuthUser = {
      id: response.user.id,
      email: response.user.email,
      user_metadata: {
        full_name: response.user.fullName
      }
    }
    
    setCurrentUser(user)
    
    // Setup token refresh timer
    setupTokenRefresh()
    
    return { user, error: null }
  } catch (error) {
    if (error instanceof ApiError) {
      return { user: null, error: error.message }
    }
    return { user: null, error: 'An unexpected error occurred during sign in' }
  }
}

/**
 * Sign out the current user
 */
export const signOut = async () => {
  try {
    // Call logout endpoint if we have a token
    const token = getAuthToken()
    if (token) {
      try {
        await api.logout()
      } catch (error) {
        // Continue with logout even if API call fails
        console.warn('Failed to call logout endpoint:', error)
      }
    }
    
    // Clear refresh timer
    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }
    
    // Clear local authentication state
    setAuthToken(null)
    setCurrentUser(null)
    
    return { error: null }
  } catch (error) {
    // Always clear local state, even if logout API call fails
    setAuthToken(null)
    setCurrentUser(null)
    return { error: null }
  }
}

/**
 * Get the current user session
 */
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const token = getAuthToken()
    if (!token) {
      return null
    }

    // Try to get user from memory first
    if (currentUser) {
      return currentUser
    }

    // Verify token and get current user from API
    const response = await api.getCurrentUser()
    
    const user: AuthUser = {
      id: response.id,
      email: response.email,
      user_metadata: {
        full_name: response.fullName
      }
    }
    
    setCurrentUser(user)
    return user
  } catch (error) {
    // If token is invalid, clear auth state
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      setAuthToken(null)
      setCurrentUser(null)
    }
    
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Listen for authentication state changes
 */
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  // Add listener to the list
  authListeners.push(callback)
  
  // Immediately call with current user
  callback(currentUser)
  
  // Return unsubscribe function wrapped in expected format
  return {
    data: {
      subscription: {
        unsubscribe: () => {
          authListeners = authListeners.filter(listener => listener !== callback)
        }
      }
    }
  }
}

/**
 * Verify current token validity
 */
export const verifyToken = async (): Promise<AuthUser | null> => {
  try {
    const token = getAuthToken()
    if (!token) {
      return null
    }

    const response = await api.verifyToken()
    
    if (response.valid && response.user) {
      const user: AuthUser = {
        id: response.user.id,
        email: response.user.email,
        user_metadata: {
          full_name: response.user.fullName
        }
      }
      
      setCurrentUser(user)
      return user
    } else {
      setAuthToken(null)
      setCurrentUser(null)
      return null
    }
  } catch (error) {
    console.error('Error verifying token:', error)
    setAuthToken(null)
    setCurrentUser(null)
    return null
  }
}

/**
 * Refresh authentication token
 */
export const refreshAuthToken = async (): Promise<boolean> => {
  try {
    // Note: This would require implementing refresh tokens in the backend
    // For now, we'll just verify the current token
    const user = await verifyToken()
    return user !== null
  } catch (error) {
    console.error('Error refreshing token:', error)
    return false
  }
}

// Legacy functions for backward compatibility (can be removed later)
export const resetPassword = async (_email: string) => {
  // TODO: Implement password reset with backend API
  console.warn('Password reset not yet implemented with backend API')
  return { error: 'Password reset not yet implemented' }
}

export const updatePassword = async (_newPassword: string) => {
  // TODO: Implement password update with backend API
  console.warn('Password update not yet implemented with backend API')
  return { error: 'Password update not yet implemented' }
}