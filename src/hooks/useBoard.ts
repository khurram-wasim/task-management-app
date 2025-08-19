import { useState, useEffect, useCallback } from 'react'
import { api, ApiError } from '@/lib/api'
import type { Board, UpdateBoardRequest } from '@/types'

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

  /**
   * Delete the current board
   */
  const deleteBoard = useCallback(async () => {
    if (!boardId) return { success: false, error: 'No board ID provided' }

    setError(null)
    
    try {
      await api.deleteBoard(boardId)
      return { success: true }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to delete board'
      setError(message)
      console.error('Error deleting board:', error)
      return { success: false, error: message }
    }
  }, [boardId])

  /**
   * Add collaborator to board
   */
  const addCollaborator = useCallback(async (email: string, role: 'member' | 'admin' = 'member') => {
    if (!boardId) return { success: false, error: 'No board ID provided' }

    setError(null)
    
    try {
      await api.addBoardCollaborator(boardId, { email, role })
      // Refetch board to get updated collaborators
      await fetchBoard()
      return { success: true }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to add collaborator'
      setError(message)
      console.error('Error adding collaborator:', error)
      return { success: false, error: message }
    }
  }, [boardId, fetchBoard])

  /**
   * Remove collaborator from board
   */
  const removeCollaborator = useCallback(async (userId: string) => {
    if (!boardId) return { success: false, error: 'No board ID provided' }

    setError(null)
    
    try {
      await api.removeBoardCollaborator(boardId, userId)
      // Refetch board to get updated collaborators
      await fetchBoard()
      return { success: true }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to remove collaborator'
      setError(message)
      console.error('Error removing collaborator:', error)
      return { success: false, error: message }
    }
  }, [boardId, fetchBoard])

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
    deleteBoard,
    addCollaborator,
    removeCollaborator,
    clearError: () => setError(null)
  }
}