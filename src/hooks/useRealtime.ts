import { useEffect, useRef } from 'react'
import { 
  subscribeToTable, 
  subscribeToBoardChanges, 
  subscribeToListChanges, 
  subscribeToTaskChanges,
  type RealtimePostgresChangesPayload,
  type TableName,
  type RealtimeSubscription
} from '@/lib/realtime'

/**
 * Hook for subscribing to real-time changes on a table
 */
export function useRealtimeSubscription<T extends Record<string, any> = any>(
  table: TableName,
  callback: (payload: RealtimePostgresChangesPayload<T>) => void,
  filter?: string
) {
  const subscriptionRef = useRef<RealtimeSubscription | null>(null)

  useEffect(() => {
    // Subscribe to table changes
    subscriptionRef.current = subscribeToTable(table, callback, filter)

    // Cleanup subscription on unmount
    return () => {
      subscriptionRef.current?.unsubscribe()
    }
  }, [table, filter]) // Note: callback is intentionally not in deps to avoid re-subscriptions

  // Return unsubscribe function for manual cleanup
  return () => {
    subscriptionRef.current?.unsubscribe()
    subscriptionRef.current = null
  }
}

/**
 * Hook for subscribing to all changes related to a board
 */
export function useBoardRealtime(
  boardId: string | null,
  callbacks: {
    onBoardChange?: (payload: RealtimePostgresChangesPayload<any>) => void
    onListChange?: (payload: RealtimePostgresChangesPayload<any>) => void
    onTaskChange?: (payload: RealtimePostgresChangesPayload<any>) => void
    onTaskLabelChange?: (payload: RealtimePostgresChangesPayload<any>) => void
    onCollaboratorChange?: (payload: RealtimePostgresChangesPayload<any>) => void
  }
) {
  const subscriptionRef = useRef<RealtimeSubscription | null>(null)

  useEffect(() => {
    if (!boardId) return

    // Subscribe to board and related changes
    subscriptionRef.current = subscribeToBoardChanges(boardId, callbacks)

    // Cleanup subscription on unmount or boardId change
    return () => {
      subscriptionRef.current?.unsubscribe()
    }
  }, [boardId])

  // Return unsubscribe function for manual cleanup
  return () => {
    subscriptionRef.current?.unsubscribe()
    subscriptionRef.current = null
  }
}

/**
 * Hook for subscribing to changes related to a specific list
 */
export function useListRealtime(
  listId: string | null,
  callbacks: {
    onListChange?: (payload: RealtimePostgresChangesPayload<any>) => void
    onTaskChange?: (payload: RealtimePostgresChangesPayload<any>) => void
    onTaskLabelChange?: (payload: RealtimePostgresChangesPayload<any>) => void
  }
) {
  const subscriptionRef = useRef<RealtimeSubscription | null>(null)

  useEffect(() => {
    if (!listId) return

    // Subscribe to list and related changes
    subscriptionRef.current = subscribeToListChanges(listId, callbacks)

    // Cleanup subscription on unmount or listId change
    return () => {
      subscriptionRef.current?.unsubscribe()
    }
  }, [listId])

  // Return unsubscribe function for manual cleanup
  return () => {
    subscriptionRef.current?.unsubscribe()
    subscriptionRef.current = null
  }
}

/**
 * Hook for subscribing to changes related to a specific task
 */
export function useTaskRealtime(
  taskId: string | null,
  callbacks: {
    onTaskChange?: (payload: RealtimePostgresChangesPayload<any>) => void
    onTaskLabelChange?: (payload: RealtimePostgresChangesPayload<any>) => void
  }
) {
  const subscriptionRef = useRef<RealtimeSubscription | null>(null)

  useEffect(() => {
    if (!taskId) return

    // Subscribe to task and related changes
    subscriptionRef.current = subscribeToTaskChanges(taskId, callbacks)

    // Cleanup subscription on unmount or taskId change
    return () => {
      subscriptionRef.current?.unsubscribe()
    }
  }, [taskId])

  // Return unsubscribe function for manual cleanup
  return () => {
    subscriptionRef.current?.unsubscribe()
    subscriptionRef.current = null
  }
}

/**
 * Hook for subscribing to user's boards (for dashboard view)
 */
export function useUserBoardsRealtime(
  userId: string | null,
  onBoardsChange: (payload: RealtimePostgresChangesPayload<any>) => void
) {
  return useRealtimeSubscription(
    'boards',
    onBoardsChange,
    userId ? `user_id=eq.${userId}` : undefined
  )
}

/**
 * Hook for subscribing to board collaborations (when user is added/removed)
 */
export function useCollaborationRealtime(
  userId: string | null,
  onCollaborationChange: (payload: RealtimePostgresChangesPayload<any>) => void
) {
  return useRealtimeSubscription(
    'board_collaborators',
    onCollaborationChange,
    userId ? `user_id=eq.${userId}` : undefined
  )
}