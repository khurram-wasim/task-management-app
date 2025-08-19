import { cn } from '@/utils/classNames'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'gray' | 'white'
  className?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  color = 'primary', 
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const colorClasses = {
    primary: 'border-blue-600 border-t-transparent',
    gray: 'border-gray-400 border-t-transparent',
    white: 'border-white border-t-transparent'
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

interface LoadingOverlayProps {
  message?: string
  className?: string
}

export function LoadingOverlay({ 
  message = 'Loading...', 
  className 
}: LoadingOverlayProps) {
  return (
    <div className={cn(
      'fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50',
      className
    )}>
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  )
}

interface LoadingStateProps {
  message?: string
  height?: 'sm' | 'md' | 'lg' | 'full'
  className?: string
}

export function LoadingState({ 
  message = 'Loading...', 
  height = 'md',
  className 
}: LoadingStateProps) {
  const heightClasses = {
    sm: 'h-32',
    md: 'h-64',
    lg: 'h-96',
    full: 'h-full min-h-screen'
  }

  return (
    <div className={cn(
      'flex flex-col items-center justify-center',
      heightClasses[height],
      className
    )}>
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600 font-medium">{message}</p>
    </div>
  )
}

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
}

export function Skeleton({ 
  className, 
  width, 
  height, 
  rounded = 'md' 
}: SkeletonProps) {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  }

  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200',
        roundedClasses[rounded],
        className
      )}
      style={style}
    />
  )
}

// Skeleton compositions for common use cases
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start space-x-4">
        <Skeleton width={40} height={40} rounded="full" />
        <div className="flex-1 space-y-2">
          <Skeleton height={16} width="75%" />
          <Skeleton height={14} width="50%" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton height={12} />
        <Skeleton height={12} width="80%" />
        <Skeleton height={12} width="60%" />
      </div>
      <div className="mt-4 flex justify-between items-center">
        <Skeleton width={80} height={20} />
        <Skeleton width={60} height={32} rounded="md" />
      </div>
    </div>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton width={48} height={48} rounded="full" />
          <div className="flex-1 space-y-2">
            <Skeleton height={16} width="60%" />
            <Skeleton height={14} width="40%" />
          </div>
          <Skeleton width={80} height={32} />
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable({ 
  rows = 5, 
  cols = 4 
}: { 
  rows?: number
  cols?: number 
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }, (_, i) => (
            <Skeleton key={i} height={16} width="60%" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
              {Array.from({ length: cols }, (_, colIndex) => (
                <Skeleton key={colIndex} height={14} width="80%" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}