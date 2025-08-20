import { createContext, useContext, useEffect, useState } from 'react'
import { signIn, signUp, signOut, onAuthStateChange } from '@/lib/auth'
import type { AuthState, AuthUser, ComponentWithChildren } from '@/types'

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: ComponentWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Initialize from localStorage first (faster, no API call)
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('auth_token')
        const storedUser = localStorage.getItem('current_user')
        
        console.log('AuthContext: Initializing from localStorage', { hasToken: !!token, hasUser: !!storedUser })
        
        if (token && storedUser) {
          const user = JSON.parse(storedUser)
          console.log('AuthContext: Found user in localStorage:', user)
          if (mounted) {
            setUser(user)
            setLoading(false)
          }
          return
        }
      } catch (error) {
        console.error('AuthContext: Failed to parse stored user data:', error)
        localStorage.removeItem('current_user')
        localStorage.removeItem('auth_token')
      }
      
      // No valid stored auth, set to null
      if (mounted) {
        setUser(null)
        setLoading(false)
      }
    }

    // Initialize immediately
    initializeAuth()

    // Listen for auth changes (for programmatic login/logout only)
    // Don't override localStorage initialization
    const { data: { subscription } } = onAuthStateChange((user) => {
      console.log('AuthContext: onAuthStateChange triggered:', user)
      // Only update if this is from a login/logout event, not initialization
      if (mounted && user && !localStorage.getItem('current_user')) {
        console.log('AuthContext: Updating user from auth change')
        setUser(user)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSignIn = async (email: string, password: string) => {
    setLoading(true)
    const { user, error } = await signIn(email, password)
    
    if (user) {
      setUser({
        id: user.id,
        email: user.email || '',
        user_metadata: user.user_metadata
      })
    }
    
    setLoading(false)
    return { error }
  }

  const handleSignUp = async (email: string, password: string, fullName?: string) => {
    setLoading(true)
    const { user, error } = await signUp(email, password, fullName)
    
    if (user) {
      setUser({
        id: user.id,
        email: user.email || '',
        user_metadata: user.user_metadata
      })
    }
    
    setLoading(false)
    return { error }
  }

  const handleSignOut = async () => {
    setLoading(true)
    await signOut()
    setUser(null)
    setLoading(false)
  }

  const value: AuthState = {
    user,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}