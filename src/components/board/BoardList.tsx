import { useState } from 'react'
import { BoardCard, BoardCardSkeleton, NoBoardsState } from './BoardCard'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ErrorState } from '@/components/ui'
import { cn } from '@/utils/classNames'
import type { BoardWithStats, BoardFilters } from '@/types'

interface BoardListProps {
  boards: BoardWithStats[]
  loading: boolean
  error: string | null
  hasMore?: boolean
  filters?: BoardFilters
  onBoardClick?: (board: BoardWithStats) => void
  onEditBoard?: (board: BoardWithStats) => void
  onDeleteBoard?: (board: BoardWithStats) => void
  onShareBoard?: (board: BoardWithStats) => void
  onCreateBoard?: () => void
  onLoadMore?: () => void
  onSearch?: (filters: BoardFilters) => void
  onRefresh?: () => void
  className?: string
}

export function BoardList({
  boards,
  loading,
  error,
  hasMore = false,
  filters = {},
  onBoardClick,
  onEditBoard,
  onDeleteBoard,
  onShareBoard,
  onCreateBoard,
  onLoadMore,
  onSearch,
  onRefresh,
  className
}: BoardListProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '')
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'updated_at' | 'activity'>(filters.sortBy || 'updated_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(filters.sortOrder || 'desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    onSearch?.({ ...filters, search: term })
  }

  const handleSort = (field: 'name' | 'created_at' | 'updated_at' | 'activity') => {
    const newOrder = field === sortBy && sortOrder === 'desc' ? 'asc' : 'desc'
    setSortBy(field)
    setSortOrder(newOrder)
    onSearch?.({ ...filters, sortBy: field, sortOrder: newOrder })
  }

  const getSortIcon = (field: 'name' | 'created_at' | 'updated_at' | 'activity') => {
    if (field !== sortBy) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    
    return sortOrder === 'desc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    )
  }

  // Error state
  if (error && !loading) {
    return (
      <ErrorState
        title="Failed to load boards"
        message={error}
        action={onRefresh ? { label: 'Try again', onClick: onRefresh } : undefined}
        className={className}
      />
    )
  }

  // Loading state (initial load)
  if (loading && boards.length === 0) {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Search and controls skeleton */}
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        
        {/* Board cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <BoardCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with search and controls */}
      <div className="space-y-4">
        {/* Search */}
        <div className="flex gap-4">
          <div className="flex-1 max-w-md">
            <Input
              type="search"
              placeholder="Search boards..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full"
            />
          </div>
          
          {onCreateBoard && (
            <Button onClick={onCreateBoard}>
              Create Board
            </Button>
          )}
        </div>

        {/* Filters and view controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Sort options */}
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600">Sort by:</span>
              
              <button
                onClick={() => handleSort('name')}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100',
                  sortBy === 'name' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
                )}
              >
                Name {getSortIcon('name')}
              </button>
              
              <button
                onClick={() => handleSort('updated_at')}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100',
                  sortBy === 'updated_at' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
                )}
              >
                Updated {getSortIcon('updated_at')}
              </button>
              
              <button
                onClick={() => handleSort('created_at')}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100',
                  sortBy === 'created_at' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
                )}
              >
                Created {getSortIcon('created_at')}
              </button>
            </div>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                viewMode === 'grid' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              )}
              title="Grid view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                viewMode === 'list' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              )}
              title="List view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Results info */}
        {boards.length > 0 && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {boards.length} board{boards.length !== 1 ? 's' : ''}
              {searchTerm && ` matching "${searchTerm}"`}
            </span>
            
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                disabled={loading}
              >
                <svg 
                  className={cn('w-4 h-4', loading && 'animate-spin')} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            )}
          </div>
        )}
      </div>

      {/* Boards display */}
      {boards.length === 0 ? (
        <NoBoardsState onCreateBoard={onCreateBoard} />
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        )}>
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onClick={() => onBoardClick?.(board)}
              onEdit={() => onEditBoard?.(board)}
              onDelete={() => onDeleteBoard?.(board)}
              onShare={() => onShareBoard?.(board)}
              className={viewMode === 'list' ? 'max-w-none' : ''}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-6">
          <Button
            variant="outline"
            onClick={onLoadMore}
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}

      {/* Loading indicator for additional loads */}
      {loading && boards.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  )
}