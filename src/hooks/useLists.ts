import { useState, useEffect, useCallback } from 'react'
import { api, ApiError } from '@/lib/api'
import type { List, CreateListRequest, UpdateListRequest } from '@/types'

/**
 * Hook for managing lists within a board
 */
export function useLists(boardId: string | null) {
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch all lists for a board
   */
  const fetchLists = useCallback(async () => {
    if (!boardId) return

    setLoading(true)
    setError(null)
    
    try {
      const listsData = await api.getLists(boardId)
      setLists(listsData)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to fetch lists'
      setError(message)
      console.error('Error fetching lists:', error)
    } finally {
      setLoading(false)
    }
  }, [boardId])

  /**
   * Create a new list
   */
  const createList = useCallback(async (listData: CreateListRequest) => {
    setError(null)
    
    try {
      const newList = await api.createList(listData)
      setLists(prev => [...prev, newList].sort((a, b) => a.position - b.position))
      return { success: true, data: newList }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to create list'
      setError(message)
      console.error('Error creating list:', error)
      return { success: false, error: message }
    }
  }, [])

  /**
   * Update an existing list
   */
  const updateList = useCallback(async (listId: string, updates: UpdateListRequest) => {
    setError(null)
    
    try {
      const updatedList = await api.updateList(listId, updates)
      setLists(prev => prev.map(list => 
        list.id === listId ? updatedList : list
      ).sort((a, b) => a.position - b.position))
      return { success: true, data: updatedList }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to update list'
      setError(message)
      console.error('Error updating list:', error)
      return { success: false, error: message }
    }
  }, [])

  /**
   * Move a list to a new position
   */
  const moveList = useCallback(async (listId: string, newPosition: number) => {
    setError(null)
    
    try {
      const updatedList = await api.moveList(listId, newPosition)
      setLists(prev => prev.map(list => 
        list.id === listId ? updatedList : list
      ).sort((a, b) => a.position - b.position))
      return { success: true, data: updatedList }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to move list'
      setError(message)
      console.error('Error moving list:', error)
      return { success: false, error: message }
    }
  }, [])

  /**
   * Delete a list
   */
  const deleteList = useCallback(async (listId: string) => {
    setError(null)
    
    try {
      await api.deleteList(listId)
      setLists(prev => prev.filter(list => list.id !== listId))
      return { success: true }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to delete list'
      setError(message)
      console.error('Error deleting list:', error)
      return { success: false, error: message }
    }
  }, [])

  /**
   * Reorder lists optimistically (for drag and drop)
   */
  const reorderLists = useCallback((reorderedLists: List[]) => {
    setLists(reorderedLists)
  }, [])

  // Auto-fetch lists when boardId changes
  useEffect(() => {
    fetchLists()
  }, [fetchLists])

  return {
    lists,
    loading,
    error,
    fetchLists,
    createList,
    updateList,
    moveList,
    deleteList,
    reorderLists,
    clearError: () => setError(null)
  }
}

/**
 * Hook for managing a single list
 */
export function useList(listId: string | null) {
  const [list, setList] = useState<List | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch list details
   */
  const fetchList = useCallback(async () => {
    if (!listId) return

    setLoading(true)
    setError(null)
    
    try {
      const listData = await api.getList(listId)
      setList(listData)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to fetch list'
      setError(message)
      console.error('Error fetching list:', error)
    } finally {
      setLoading(false)
    }
  }, [listId])

  /**
   * Update the current list
   */
  const updateList = useCallback(async (updates: UpdateListRequest) => {
    if (!listId) return { success: false, error: 'No list ID provided' }

    setError(null)
    
    try {
      const updatedList = await api.updateList(listId, updates)
      setList(updatedList)
      return { success: true, data: updatedList }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to update list'
      setError(message)
      console.error('Error updating list:', error)
      return { success: false, error: message }
    }
  }, [listId])

  // Auto-fetch list when listId changes
  useEffect(() => {
    fetchList()
  }, [fetchList])

  return {
    list,
    loading,
    error,
    fetchList,
    updateList,
    clearError: () => setError(null)
  }
}