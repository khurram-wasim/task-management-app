import { useState } from 'react'
import { Calendar, MessageCircle, Paperclip, User } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task as TaskType, TaskLabel } from '@/types'
import { cn } from '@/utils/classNames'

interface TaskProps {
  task: TaskType & {
    labels?: TaskLabel[]
  }
  className?: string
  onClick?: () => void
  onTaskClick?: (taskId: string) => void
}

export function Task({ task, className, onClick, onTaskClick }: TaskProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Make the task draggable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return {
        text: date.toLocaleDateString(),
        color: 'text-red-600 bg-red-100',
        isOverdue: true
      }
    } else if (diffDays === 0) {
      return {
        text: 'Today',
        color: 'text-orange-600 bg-orange-100',
        isOverdue: false
      }
    } else if (diffDays === 1) {
      return {
        text: 'Tomorrow',
        color: 'text-yellow-600 bg-yellow-100',
        isOverdue: false
      }
    } else if (diffDays <= 7) {
      return {
        text: `${diffDays} days`,
        color: 'text-green-600 bg-green-100',
        isOverdue: false
      }
    } else {
      return {
        text: date.toLocaleDateString(),
        color: 'text-gray-600 bg-gray-100',
        isOverdue: false
      }
    }
  }

  const dueDate = task.due_date ? formatDueDate(task.due_date) : null
  const hasLabels = task.labels && task.labels.length > 0
  const hasDescription = task.description && task.description.trim().length > 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-white rounded-lg p-3 shadow-sm cursor-pointer transition-all duration-200",
        "hover:shadow-md hover:bg-gray-50",
        "touch-none", // Prevent scrolling while dragging
        isHovered && "ring-2 ring-blue-200",
        isDragging && "opacity-50 rotate-3 shadow-lg",
        className
      )}
      onClick={() => {
        onClick?.()
        onTaskClick?.(task.id)
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="space-y-2">
        {/* Labels */}
        {hasLabels && (
          <div className="flex flex-wrap gap-1">
            {task.labels!.map((label) => (
              <span
                key={label.id}
                className="inline-block px-2 py-1 text-xs font-medium rounded-full"
                style={{
                  backgroundColor: `${label.label_color}20`,
                  color: label.label_color,
                  border: `1px solid ${label.label_color}40`
                }}
              >
                {label.label_name}
              </span>
            ))}
          </div>
        )}

        {/* Task Title */}
        <h4 className="text-sm font-medium text-gray-900 leading-tight">
          {task.title}
        </h4>

        {/* Task Description Preview */}
        {hasDescription && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Task Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            {/* Due Date */}
            {dueDate && (
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full",
                dueDate.color
              )}>
                <Calendar className="w-3 h-3" />
                <span className="font-medium">{dueDate.text}</span>
              </div>
            )}
          </div>

          {/* Task Icons */}
          <div className="flex items-center gap-2">
            {hasDescription && (
              <div className="flex items-center gap-1 text-gray-400">
                <MessageCircle className="w-3 h-3" />
              </div>
            )}
            
            {/* Placeholder for attachments count */}
            {false && (
              <div className="flex items-center gap-1 text-gray-400">
                <Paperclip className="w-3 h-3" />
                <span>2</span>
              </div>
            )}
            
            {/* Placeholder for assignee */}
            {false && (
              <div className="flex items-center gap-1 text-gray-400">
                <User className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Task Skeleton for loading states
export function TaskSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "bg-white rounded-lg p-3 shadow-sm animate-pulse",
      className
    )}>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        <div className="flex justify-between">
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  )
}

// Empty state for when no tasks exist
export function NoTasksState({ className }: { className?: string }) {
  return (
    <div className={cn(
      "text-center py-8 text-gray-500",
      className
    )}>
      <div className="mb-2">
        <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-sm">No tasks yet</p>
      <p className="text-xs">Add a card to get started</p>
    </div>
  )
}