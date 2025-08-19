import { useState, FormEvent } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface LoginFormProps {
  onSuccess?: () => void
  onSwitchToRegister?: () => void
}

interface FormData {
  email: string
  password: string
}

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const { signIn, loading } = useAuth()
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      const result = await signIn(formData.email, formData.password)
      
      if (result.error) {
        setErrors({ general: result.error })
      } else {
        // Clear form and errors on success
        setFormData({ email: '', password: '' })
        setErrors({})
        onSuccess?.()
      }
    } catch (error) {
      setErrors({ 
        general: error instanceof Error ? error.message : 'An unexpected error occurred' 
      })
    }
  }

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{errors.general}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="Email address"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            error={errors.email}
            placeholder="Enter your email"
            autoComplete="email"
            disabled={loading}
          />

          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleInputChange('password')}
            error={errors.password}
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={loading}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          loading={loading}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>

        {onSwitchToRegister && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
                disabled={loading}
              >
                Sign up
              </button>
            </p>
          </div>
        )}
      </form>
    </div>
  )
}