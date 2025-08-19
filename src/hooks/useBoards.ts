import { useState, useEffect, useCallback } from 'react'
import { api, ApiError } from '@/lib/api'
import type { Board, CreateBoardRequest, UpdateBoardRequest, AddCollaboratorRequest } from '@/types'

/**
 * Hook for managing boards data and operations
 */
export function useBoards() {
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch all boards for the current user
   */
  const fetchBoards = useCallback(async (page = 1, limit = 20) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await api.getBoards(page, limit)
      setBoards(response.boards)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to fetch boards'
      setError(message)
      console.error('Error fetching boards:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Create a new board
   */
  const createBoard = useCallback(async (boardData: CreateBoardRequest) => {
    setError(null)
    
    try {
      const newBoard = await api.createBoard(boardData)
      setBoards(prev => [...prev, newBoard])
      return { success: true, data: newBoard }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to create board'
      setError(message)
      console.error('Error creating board:', error)
      return { success: false, error: message }
    }
  }, [])

  /**
   * Update an existing board
   */
  const updateBoard = useCallback(async (boardId: string, updates: UpdateBoardRequest) => {
    setError(null)
    
    try {
      const updatedBoard = await api.updateBoard(boardId, updates)
      setBoards(prev => prev.map(board => 
        board.id === boardId ? updatedBoard : board
      ))
      return { success: true, data: updatedBoard }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to update board'
      setError(message)
      console.error('Error updating board:', error)
      return { success: false, error: message }
    }
  }, [])

  /**
   * Delete a board
   */
  const deleteBoard = useCallback(async (boardId: string) => {
    setError(null)
    
    try {
      await api.deleteBoard(boardId)
      setBoards(prev => prev.filter(board => board.id !== boardId))
      return { success: true }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to delete board'
      setError(message)
      console.error('Error deleting board:', error)
      return { success: false, error: message }
    }
  }, [])

  /**
   * Add a collaborator to a board
   */
  const addCollaborator = useCallback(async (boardId: string, collaboratorData: AddCollaboratorRequest) => {
    setError(null)
    
    try {
      await api.addBoardCollaborator(boardId, collaboratorData)
      return { success: true }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to add collaborator'
      setError(message)
      console.error('Error adding collaborator:', error)
      return { success: false, error: message }
    }
  }, [])

  /**
   * Remove a collaborator from a board
   */
  const removeCollaborator = useCallback(async (boardId: string, userId: string) => {
    setError(null)
    
    try {
      await api.removeBoardCollaborator(boardId, userId)
      return { success: true }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to remove collaborator'
      setError(message)
      console.error('Error removing collaborator:', error)
      return { success: false, error: message }
    }
  }, [])

  // Auto-fetch boards on mount
  useEffect(() => {
    fetchBoards()
  }, [fetchBoards])

  return {
    boards,
    loading,
    error,
    fetchBoards,
    createBoard,
    updateBoard,
    deleteBoard,
    addCollaborator,
    removeCollaborator,
    clearError: () => setError(null)
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