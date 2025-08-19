import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'

export function Dashboard() {
  const { user, signOut, loading } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Task Management Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user?.name || user?.email}!
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleSignOut}
              loading={loading}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-2xl font-medium text-gray-900 mb-2">
                Dashboard Coming Soon
              </h3>
              <p className="text-gray-600">
                Your boards and tasks will appear here once we implement the board management features.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}