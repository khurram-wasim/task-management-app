import React from 'react'
import type { ReactNode } from 'react'
import { Button } from './Button'
import { cn } from '@/utils/classNames'

interface ErrorStateProps {
  title?: string
  message?: string
  icon?: ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  icon,
  action,
  className,
  size = 'md'
}: ErrorStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'w-8 h-8',
      title: 'text-lg font-semibold',
      message: 'text-sm'
    },
    md: {
      container: 'py-12',
      icon: 'w-12 h-12',
      title: 'text-xl font-semibold',
      message: 'text-base'
    },
    lg: {
      container: 'py-16',
      icon: 'w-16 h-16',
      title: 'text-2xl font-semibold',
      message: 'text-lg'
    }
  }

  const defaultIcon = (
    <svg 
      className={cn('text-red-500', sizeClasses[size].icon)} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
      />
    </svg>
  )

  return (
    <div className={cn(
      'text-center',
      sizeClasses[size].container,
      className
    )}>
      <div className="mx-auto mb-4">
        {icon || defaultIcon}
      </div>
      <h3 className={cn('text-gray-900 mb-2', sizeClasses[size].title)}>
        {title}
      </h3>
      <p className={cn('text-gray-600 mb-6 max-w-md mx-auto', sizeClasses[size].message)}>
        {message}
      </p>
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  )
}

interface NotFoundProps {
  title?: string
  message?: string
  backLabel?: string
  onBack?: () => void
  className?: string
}

export function NotFound({
  title = 'Page not found',
  message = "Sorry, we couldn't find the page you're looking for.",
  backLabel = 'Go back',
  onBack,
  className
}: NotFoundProps) {
  return (
    <ErrorState
      title={title}
      message={message}
      icon={
        <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      action={onBack ? { label: backLabel, onClick: onBack } : undefined}
      className={className}
    />
  )
}

interface NetworkErrorProps {
  onRetry?: () => void
  className?: string
}

export function NetworkError({ onRetry, className }: NetworkErrorProps) {
  return (
    <ErrorState
      title="Connection problem"
      message="Unable to connect to the server. Please check your internet connection and try again."
      icon={
        <svg className="w-12 h-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      action={onRetry ? { label: 'Try again', onClick: onRetry } : undefined}
      className={className}
    />
  )
}

interface UnauthorizedProps {
  onLogin?: () => void
  className?: string
}

export function Unauthorized({ onLogin, className }: UnauthorizedProps) {
  return (
    <ErrorState
      title="Access denied"
      message="You don't have permission to access this resource. Please log in or contact an administrator."
      icon={
        <svg className="w-12 h-12 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      }
      action={onLogin ? { label: 'Sign in', onClick: onLogin } : undefined}
      className={className}
    />
  )
}

interface EmptyStateProps {
  title?: string
  message?: string
  icon?: ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  title = 'No data available',
  message = 'There are no items to display.',
  icon,
  action,
  className
}: EmptyStateProps) {
  const defaultIcon = (
    <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  )

  return (
    <div className={cn('text-center py-12', className)}>
      <div className="mx-auto mb-4">
        {icon || defaultIcon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {message}
      </p>
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  )
}

// Error boundary component
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: any) => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorState
          title="Application Error"
          message="Something went wrong. Please refresh the page or try again later."
          action={{
            label: 'Reload page',
            onClick: () => window.location.reload()
          }}
        />
      )
    }

    return this.props.children
  }
}