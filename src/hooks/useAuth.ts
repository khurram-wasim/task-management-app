import { useAuth as useAuthContext } from '@/contexts/AuthContext'

/**
 * Custom hook for accessing authentication state and methods
 * This is a re-export of the context hook for easier importing
 */
export const useAuth = useAuthContext

/**
 * Hook to check if user is authenticated
 */
export const useIsAuthenticated = () => {
  const { user, loading } = useAuth()
  return { isAuthenticated: !!user, loading }
}

/**
 * Hook to get current user or null
 */
export const useCurrentUser = () => {
  const { user } = useAuth()
  return user
}

/**
 * Hook for authentication actions
 */
export const useAuthActions = () => {
  const { signIn, signUp, signOut } = useAuth()
  return { signIn, signUp, signOut }
}