import { type ReactNode, forwardRef } from 'react'
import { cn } from '@/utils/classNames'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  border?: boolean
  hover?: boolean
  onClick?: () => void
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ 
    children, 
    className, 
    padding = 'md', 
    shadow = 'sm', 
    border = true, 
    hover = false, 
    onClick 
  }, ref) => {
    const paddingClasses = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6'
    }

    const shadowClasses = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg'
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg bg-white',
          paddingClasses[padding],
          shadowClasses[shadow],
          border && 'border border-gray-200',
          hover && 'transition-shadow hover:shadow-md',
          onClick && 'cursor-pointer',
          className
        )}
        onClick={onClick}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

interface CardHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

export function CardHeader({ title, subtitle, actions, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between', className)}>
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-semibold text-gray-900 truncate">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500 truncate">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="ml-4 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={cn('mt-4', className)}>
      {children}
    </div>
  )
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('mt-4 flex items-center justify-between', className)}>
      {children}
    </div>
  )
}

// Specialized card variants
interface BoardCardProps {
  title: string
  description?: string
  tasksCount?: number
  listsCount?: number
  lastUpdated?: Date
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function BoardCard({ 
  title, 
  description, 
  tasksCount = 0, 
  listsCount = 0, 
  lastUpdated, 
  onClick, 
  onEdit, 
  onDelete 
}: BoardCardProps) {
  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation()
    action()
  }

  return (
    <Card hover onClick={onClick} className="relative group">
      <CardHeader
        title={title}
        subtitle={description}
        actions={
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-1">
              {onEdit && (
                <button
                  onClick={(e) => handleActionClick(e, onEdit)}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  aria-label="Edit board"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => handleActionClick(e, onDelete)}
                  className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50"
                  aria-label="Delete board"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        }
      />
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{listsCount} lists</span>
          <span>{tasksCount} tasks</span>
          {lastUpdated && (
            <span>Updated {lastUpdated.toLocaleDateString()}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface TaskCardProps {
  title: string
  description?: string
  dueDate?: Date
  labels?: Array<{ id: string; name: string; color: string }>
  assignees?: Array<{ id: string; name: string; avatar?: string }>
  commentsCount?: number
  isDragging?: boolean
  onClick?: () => void
}

export function TaskCard({ 
  title, 
  description, 
  dueDate, 
  labels = [], 
  assignees = [], 
  commentsCount = 0, 
  isDragging = false, 
  onClick 
}: TaskCardProps) {
  const isOverdue = dueDate && dueDate < new Date()

  return (
    <Card 
      hover 
      onClick={onClick} 
      className={cn(
        'mb-2 cursor-pointer',
        isDragging && 'opacity-50 rotate-2',
        isOverdue && 'border-red-200 bg-red-50'
      )}
      padding="sm"
    >
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{title}</h4>
        
        {description && (
          <p className="text-xs text-gray-600 line-clamp-2">{description}</p>
        )}

        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {labels.map((label) => (
              <span
                key={label.id}
                className="px-2 py-1 text-xs font-medium rounded"
                style={{ 
                  backgroundColor: label.color + '20', 
                  color: label.color 
                }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            {dueDate && (
              <span className={cn(
                'flex items-center gap-1',
                isOverdue && 'text-red-600'
              )}>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {dueDate.toLocaleDateString()}
              </span>
            )}
            
            {commentsCount > 0 && (
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {commentsCount}
              </span>
            )}
          </div>

          {assignees.length > 0 && (
            <div className="flex -space-x-1">
              {assignees.slice(0, 3).map((assignee) => (
                <div
                  key={assignee.id}
                  className="h-5 w-5 rounded-full bg-gray-300 border border-white flex items-center justify-center text-xs font-medium text-gray-600"
                  title={assignee.name}
                >
                  {assignee.avatar ? (
                    <img 
                      src={assignee.avatar} 
                      alt={assignee.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    assignee.name.charAt(0).toUpperCase()
                  )}
                </div>
              ))}
              {assignees.length > 3 && (
                <div className="h-5 w-5 rounded-full bg-gray-200 border border-white flex items-center justify-center text-xs font-medium text-gray-500">
                  +{assignees.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}