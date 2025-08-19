import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoginForm } from '@/components/auth/LoginForm'
import { AuthLayout } from '@/components/layout'

export function Login() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const handleLoginSuccess = () => {
    navigate('/dashboard', { replace: true })
  }

  const handleSwitchToRegister = () => {
    navigate('/register')
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account to continue"
    >
      <LoginForm 
        onSuccess={handleLoginSuccess}
        onSwitchToRegister={handleSwitchToRegister}
      />
    </AuthLayout>
  )
}