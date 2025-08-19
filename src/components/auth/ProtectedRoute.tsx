import { useIsAuthenticated } from '@/hooks/useAuth'
import type { ComponentWithChildren } from '@/types'

interface ProtectedRouteProps extends ComponentWithChildren {
  fallback?: React.ReactNode
}

/**
 * Component that protects routes requiring authentication
 * Renders children if user is authenticated, otherwise renders fallback
 */
export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useIsAuthenticated()

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show children if authenticated, otherwise show fallback
  if (isAuthenticated) {
    return <>{children}</>
  }

  return (
    <>
      {fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-6">
              Please sign in to access this page.
            </p>
            <button 
              onClick={() => window.location.href = '/login'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      )}
    </>
  )
}