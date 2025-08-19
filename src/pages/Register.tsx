import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { AuthLayout } from '@/components/layout'

export function Register() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const handleRegisterSuccess = () => {
    navigate('/dashboard', { replace: true })
  }

  const handleSwitchToLogin = () => {
    navigate('/login')
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join us and start managing your tasks today"
    >
      <RegisterForm 
        onSuccess={handleRegisterSuccess}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </AuthLayout>
  )
}