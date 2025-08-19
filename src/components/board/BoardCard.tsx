import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/Modal'
import { cn } from '@/utils/classNames'
import type { BoardWithStats } from '@/types'

interface BoardCardProps {
  board: BoardWithStats
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onShare?: () => void
  className?: string
}

export function BoardCard({ 
  board, 
  onClick, 
  onEdit, 
  onDelete, 
  onShare,
  className 
}: BoardCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation()
    action()
  }

  const handleDelete = async () => {
    if (!onDelete) return
    
    setIsDeleting(true)
    try {
      await onDelete()
      setShowDeleteModal(false)
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'owner': return 'bg-blue-100 text-blue-800'
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'member': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const lastUpdated = board.last_activity 
    ? new Date(board.last_activity)
    : new Date(board.updated_at)

  return (
    <>
      <Card 
        hover 
        onClick={onClick} 
        className={cn('relative group transition-all duration-200', className)}
      >
        {/* Header with title and actions */}
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {board.name}
            </h3>
            {board.description && (
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                {board.description}
              </p>
            )}
          </div>
          
          {/* Action buttons - show on hover */}
          <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-1">
              {onShare && (
                <button
                  onClick={(e) => handleActionClick(e, onShare)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Share board"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
              )}
              
              {onEdit && (
                <button
                  onClick={(e) => handleActionClick(e, onEdit)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  title="Edit board"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              
              {onDelete && board.is_owner && (
                <button
                  onClick={(e) => handleActionClick(e, () => setShowDeleteModal(true))}
                  className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete board"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <span>{board.lists_count} lists</span>
          </div>
          
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>{board.tasks_count} tasks</span>
          </div>
          
          {board.collaborators_count > 0 && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <span>{board.collaborators_count + 1} members</span>
            </div>
          )}
        </div>

        {/* Footer with role and last updated */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {board.role && (
              <span className={cn(
                'px-2 py-1 text-xs font-medium rounded-full',
                getRoleColor(board.role)
              )}>
                {board.role}
              </span>
            )}
          </div>
          
          <span className="text-xs text-gray-400">
            Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </span>
        </div>
      </Card>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Board"
        message={`Are you sure you want to delete "${board.name}"? This action cannot be undone and will permanently delete all lists, tasks, and attachments.`}
        confirmText="Delete"
        confirmVariant="destructive"
        loading={isDeleting}
      />
    </>
  )
}

// Skeleton loading state for BoardCard
export function BoardCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
        
        {/* Stats */}
        <div className="flex gap-4">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-between items-center">
          <div className="h-5 bg-gray-200 rounded w-16"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </Card>
  )
}

// Empty state when no boards
export function NoBoardsState({ onCreateBoard }: { onCreateBoard?: () => void }) {
  return (
    <div className="text-center py-12">
      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
      <h3 className="mt-4 text-lg font-medium text-gray-900">No boards yet</h3>
      <p className="mt-2 text-gray-600 max-w-md mx-auto">
        Get started by creating your first board to organize your projects and tasks.
      </p>
      {onCreateBoard && (
        <Button onClick={onCreateBoard} className="mt-4">
          Create your first board
        </Button>
      )}
    </div>
  )
}