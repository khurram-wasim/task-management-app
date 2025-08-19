import { createContext, useContext, useEffect, useState } from 'react'
import { signIn, signUp, signOut, getCurrentUser, onAuthStateChange } from '@/lib/auth'
import type { AuthState, AuthUser, ComponentWithChildren } from '@/types'

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: ComponentWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial user
    getCurrentUser().then((user) => {
      setUser(user)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
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

  const handleSignUp = async (email: string, password: string) => {
    setLoading(true)
    const { user, error } = await signUp(email, password)
    
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