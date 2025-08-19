import { useState, useEffect, useCallback } from 'react'
import { api, ApiError } from '@/lib/api'
import type { Task, CreateTaskRequest, UpdateTaskRequest, MoveTaskRequest } from '@/types'

/**
 * Hook for managing tasks within a list
 */
export function useTasks(listId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch all tasks for a list
   */
  const fetchTasks = useCallback(async () => {
    if (!listId) return

    setLoading(true)
    setError(null)
    
    try {
      const tasksData = await api.getTasks(listId)
      setTasks(tasksData)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to fetch tasks'
      setError(message)
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }, [listId])

  /**
   * Create a new task
   */
  const createTask = useCallback(async (taskData: CreateTaskRequest) => {
    setError(null)
    
    try {
      const newTask = await api.createTask(taskData)
      setTasks(prev => [...prev, newTask].sort((a, b) => a.position - b.position))
      return { success: true, data: newTask }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to create task'
      setError(message)
      console.error('Error creating task:', error)
      return { success: false, error: message }
    }
  }, [])

  /**
   * Update an existing task
   */
  const updateTask = useCallback(async (taskId: string, updates: UpdateTaskRequest) => {
    setError(null)
    
    try {
      const updatedTask = await api.updateTask(taskId, updates)
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ).sort((a, b) => a.position - b.position))
      return { success: true, data: updatedTask }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to update task'
      setError(message)
      console.error('Error updating task:', error)
      return { success: false, error: message }
    }
  }, [])

  /**
   * Move a task to a different list and/or position
   */
  const moveTask = useCallback(async (taskId: string, moveData: MoveTaskRequest) => {
    setError(null)
    
    try {
      const updatedTask = await api.moveTask(taskId, moveData)
      
      // If task moved to a different list, remove it from current tasks
      if (updatedTask.list_id !== listId) {
        setTasks(prev => prev.filter(task => task.id !== taskId))
      } else {
        // Update task in current list
        setTasks(prev => prev.map(task => 
          task.id === taskId ? updatedTask : task
        ).sort((a, b) => a.position - b.position))
      }
      
      return { success: true, data: updatedTask }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to move task'
      setError(message)
      console.error('Error moving task:', error)
      return { success: false, error: message }
    }
  }, [listId])

  /**
   * Delete a task
   */
  const deleteTask = useCallback(async (taskId: string) => {
    setError(null)
    
    try {
      await api.deleteTask(taskId)
      setTasks(prev => prev.filter(task => task.id !== taskId))
      return { success: true }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to delete task'
      setError(message)
      console.error('Error deleting task:', error)
      return { success: false, error: message }
    }
  }, [])

  /**
   * Add a label to a task
   */
  const addTaskLabel = useCallback(async (taskId: string, label: { name: string; color: string }) => {
    setError(null)
    
    try {
      await api.addTaskLabel(taskId, label)
      // Refetch tasks to get updated labels
      await fetchTasks()
      return { success: true }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to add task label'
      setError(message)
      console.error('Error adding task label:', error)
      return { success: false, error: message }
    }
  }, [fetchTasks])

  /**
   * Remove a label from a task
   */
  const removeTaskLabel = useCallback(async (taskId: string, labelId: string) => {
    setError(null)
    
    try {
      await api.removeTaskLabel(taskId, labelId)
      // Refetch tasks to get updated labels
      await fetchTasks()
      return { success: true }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to remove task label'
      setError(message)
      console.error('Error removing task label:', error)
      return { success: false, error: message }
    }
  }, [fetchTasks])

  /**
   * Reorder tasks optimistically (for drag and drop)
   */
  const reorderTasks = useCallback((reorderedTasks: Task[]) => {
    setTasks(reorderedTasks)
  }, [])

  /**
   * Add task from another list (when task is moved in)
   */
  const addTask = useCallback((task: Task) => {
    setTasks(prev => [...prev, task].sort((a, b) => a.position - b.position))
  }, [])

  /**
   * Remove task (when moved to another list)
   */
  const removeTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId))
  }, [])

  // Auto-fetch tasks when listId changes
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    addTaskLabel,
    removeTaskLabel,
    reorderTasks,
    addTask,
    removeTask,
    clearError: () => setError(null)
  }
}

/**
 * Hook for managing a single task
 */
export function useTask(taskId: string | null) {
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch task details
   */
  const fetchTask = useCallback(async () => {
    if (!taskId) return

    setLoading(true)
    setError(null)
    
    try {
      const taskData = await api.getTask(taskId)
      setTask(taskData)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to fetch task'
      setError(message)
      console.error('Error fetching task:', error)
    } finally {
      setLoading(false)
    }
  }, [taskId])

  /**
   * Update the current task
   */
  const updateTask = useCallback(async (updates: UpdateTaskRequest) => {
    if (!taskId) return { success: false, error: 'No task ID provided' }

    setError(null)
    
    try {
      const updatedTask = await api.updateTask(taskId, updates)
      setTask(updatedTask)
      return { success: true, data: updatedTask }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to update task'
      setError(message)
      console.error('Error updating task:', error)
      return { success: false, error: message }
    }
  }, [taskId])

  // Auto-fetch task when taskId changes
  useEffect(() => {
    fetchTask()
  }, [fetchTask])

  return {
    task,
    loading,
    error,
    fetchTask,
    updateTask,
    clearError: () => setError(null)
  }
}