import { useState, useEffect, useCallback } from 'react'
import { api, ApiError } from '@/lib/api'
import type { 
  Board, 
  BoardWithStats, 
  BoardsState, 
  CreateBoardRequest, 
  UpdateBoardRequest, 
  AddCollaboratorRequest,
  BoardFilters,
  CreateBoardForm,
  UpdateBoardForm
} from '@/types'

/**
 * Hook for managing boards data and operations
 */
export function useBoards(initialFilters?: BoardFilters) {
  const [state, setState] = useState<BoardsState>({
    boards: [],
    loading: false,
    error: null,
    total: 0,
    hasMore: false
  })
  const [filters, setFilters] = useState<BoardFilters>(initialFilters || {})

  /**
   * Fetch all boards for the current user
   */
  const fetchBoards = useCallback(async (page = 1, limit = 20, append = false) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await api.getBoards(page, limit)
      console.log('useBoards fetchBoards - received response:', response)
      const boardsWithStats: BoardWithStats[] = response.boards.map(board => ({
        ...board,
        lists_count: 0,
        tasks_count: 0,
        collaborators_count: 0,
        is_owner: true,
        role: 'owner' as const
      }))
      setState(prev => ({
        ...prev,
        boards: append ? [...prev.boards, ...boardsWithStats] : boardsWithStats,
        total: response.total || response.boards.length,
        hasMore: response.boards.length === limit,
        loading: false
      }))
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to fetch boards'
      setState(prev => ({ ...prev, error: message, loading: false }))
      console.error('Error fetching boards:', error)
    }
  }, [])

  /**
   * Create a new board
   */
  const createBoard = useCallback(async (boardData: CreateBoardForm) => {
    setState(prev => ({ ...prev, error: null }))
    
    try {
      const createRequest: CreateBoardRequest = {
        name: boardData.name,
        description: boardData.description
      }
      const newBoard = await api.createBoard(createRequest)
      const boardWithStats: BoardWithStats = {
        ...newBoard,
        lists_count: 0,
        tasks_count: 0,
        collaborators_count: 0,
        is_owner: true,
        role: 'owner' as const
      }
      setState(prev => ({ 
        ...prev, 
        boards: [boardWithStats, ...prev.boards],
        total: prev.total + 1
      }))
      return { success: true, data: newBoard }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to create board'
      setState(prev => ({ ...prev, error: message }))
      console.error('Error creating board:', error)
      return { success: false, error: message }
    }
  }, [])

  /**
   * Update an existing board
   */
  const updateBoard = useCallback(async (boardId: string, updates: UpdateBoardForm) => {
    setState(prev => ({ ...prev, error: null }))
    
    try {
      const updateRequest: UpdateBoardRequest = {
        name: updates.name,
        description: updates.description
      }
      const updatedBoard = await api.updateBoard(boardId, updateRequest)
      const updatedBoardWithStats: BoardWithStats = {
        ...updatedBoard,
        lists_count: 0,
        tasks_count: 0,
        collaborators_count: 0,
        is_owner: true,
        role: 'owner' as const
      }
      setState(prev => ({
        ...prev,
        boards: prev.boards.map(board => 
          board.id === boardId ? updatedBoardWithStats : board
        )
      }))
      return { success: true, data: updatedBoard }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to update board'
      setState(prev => ({ ...prev, error: message }))
      console.error('Error updating board:', error)
      return { success: false, error: message }
    }
  }, [])

  /**
   * Delete a board
   */
  const deleteBoard = useCallback(async (boardId: string) => {
    setState(prev => ({ ...prev, error: null }))
    
    try {
      await api.deleteBoard(boardId)
      setState(prev => ({
        ...prev,
        boards: prev.boards.filter(board => board.id !== boardId),
        total: Math.max(0, prev.total - 1)
      }))
      return { success: true }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to delete board'
      setState(prev => ({ ...prev, error: message }))
      console.error('Error deleting board:', error)
      return { success: false, error: message }
    }
  }, [])

  /**
   * Add a collaborator to a board
   */
  const addCollaborator = useCallback(async (boardId: string, collaboratorData: AddCollaboratorRequest) => {
    setState(prev => ({ ...prev, error: null }))
    
    try {
      await api.addBoardCollaborator(boardId, collaboratorData)
      return { success: true }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to add collaborator'
      setState(prev => ({ ...prev, error: message }))
      console.error('Error adding collaborator:', error)
      return { success: false, error: message }
    }
  }, [])

  /**
   * Remove a collaborator from a board
   */
  const removeCollaborator = useCallback(async (boardId: string, userId: string) => {
    setState(prev => ({ ...prev, error: null }))
    
    try {
      await api.removeBoardCollaborator(boardId, userId)
      return { success: true }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to remove collaborator'
      setState(prev => ({ ...prev, error: message }))
      console.error('Error removing collaborator:', error)
      return { success: false, error: message }
    }
  }, [])

  // Auto-fetch boards on mount
  useEffect(() => {
    fetchBoards()
  }, [fetchBoards])

  /**
   * Load more boards (pagination)
   */
  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore) return
    
    const currentPage = Math.ceil(state.boards.length / 20) + 1
    await fetchBoards(currentPage, 20, true)
  }, [state.loading, state.hasMore, state.boards.length, fetchBoards])

  /**
   * Search and filter boards
   */
  const searchBoards = useCallback(async (searchFilters: BoardFilters) => {
    setFilters(searchFilters)
    // For now, just refetch - in a real app you'd send filters to the API
    await fetchBoards(1, 20, false)
  }, [fetchBoards])

  /**
   * Refresh boards list
   */
  const refresh = useCallback(() => {
    fetchBoards(1, 20, false)
  }, [fetchBoards])

  return {
    // State
    boards: state.boards,
    loading: state.loading,
    error: state.error,
    total: state.total,
    hasMore: state.hasMore,
    filters,
    
    // Actions
    fetchBoards,
    loadMore,
    refresh,
    searchBoards,
    createBoard,
    updateBoard,
    deleteBoard,
    addCollaborator,
    removeCollaborator,
    clearError: () => setState(prev => ({ ...prev, error: null }))
  }
}

/**
 * Hook for managing a single board
 */
export function useBoard(boardId: string | null) {
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch board details
   */
  const fetchBoard = useCallback(async () => {
    if (!boardId) return

    setLoading(true)
    setError(null)
    
    try {
      const boardData = await api.getBoard(boardId)
      setBoard(boardData)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to fetch board'
      setError(message)
      console.error('Error fetching board:', error)
    } finally {
      setLoading(false)
    }
  }, [boardId])

  /**
   * Update the current board
   */
  const updateBoard = useCallback(async (updates: UpdateBoardRequest) => {
    if (!boardId) return { success: false, error: 'No board ID provided' }

    setError(null)
    
    try {
      const updatedBoard = await api.updateBoard(boardId, updates)
      setBoard(updatedBoard)
      return { success: true, data: updatedBoard }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to update board'
      setError(message)
      console.error('Error updating board:', error)
      return { success: false, error: message }
    }
  }, [boardId])

  // Auto-fetch board when boardId changes
  useEffect(() => {
    fetchBoard()
  }, [fetchBoard])

  return {
    board,
    loading,
    error,
    fetchBoard,
    updateBoard,
    clearError: () => setError(null)
  }
}