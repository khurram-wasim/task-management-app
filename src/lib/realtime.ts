import { websocketManager, type WebSocketMessage } from './websocket'

export type DatabaseEvent = 'INSERT' | 'UPDATE' | 'DELETE'
export type TableName = 'boards' | 'lists' | 'tasks' | 'task_labels' | 'board_collaborators'

export interface RealtimeSubscription {
  unsubscribe: () => void
}

// Compatibility interface to match Supabase format
export interface RealtimePostgresChangesPayload<T extends Record<string, any> = any> {
  eventType: DatabaseEvent
  new: T | null
  old: T | null
  table: string
}

// Convert WebSocket message to Supabase-compatible format
function convertWebSocketMessage(message: WebSocketMessage): RealtimePostgresChangesPayload {
  let table: string
  let eventType: DatabaseEvent = message.operation

  // Map WebSocket event types to table names
  switch (message.type) {
    case 'board_updated':
      table = 'boards'
      break
    case 'list_updated':
      table = 'lists'
      break
    case 'task_updated':
      table = 'tasks'
      break
    case 'task_label_updated':
      table = 'task_labels'
      break
    case 'collaborator_added':
    case 'collaborator_removed':
      table = 'board_collaborators'
      eventType = message.type === 'collaborator_added' ? 'INSERT' : 'DELETE'
      break
    default:
      table = 'unknown'
  }

  return {
    eventType,
    new: message.operation === 'DELETE' ? null : message.data,
    old: message.operation === 'INSERT' ? null : message.data,
    table
  }
}

/**
 * Subscribe to real-time changes on a specific table
 */
export function subscribeToTable<T extends Record<string, any> = any>(
  table: TableName,
  callback: (payload: RealtimePostgresChangesPayload<T>) => void,
  filter?: string
): RealtimeSubscription {
  // Map table name to WebSocket event types
  const eventTypes: string[] = []
  switch (table) {
    case 'boards':
      eventTypes.push('board_updated')
      break
    case 'lists':
      eventTypes.push('list_updated')
      break
    case 'tasks':
      eventTypes.push('task_updated')
      break
    case 'task_labels':
      eventTypes.push('task_label_updated')
      break
    case 'board_collaborators':
      eventTypes.push('collaborator_added', 'collaborator_removed')
      break
  }

  const subscriptions: RealtimeSubscription[] = []

  eventTypes.forEach(eventType => {
    const subscription = websocketManager.subscribeToEventType(eventType as any, (message: WebSocketMessage) => {
      // Apply filter if provided
      if (filter) {
        // Parse filter format: "field=eq.value" or "field=eq.{value}"
        const filterMatch = filter.match(/(\w+)=eq\.(.+)/)
        if (filterMatch) {
          const [, field, value] = filterMatch
          const cleanValue = value.replace(/[{}]/g, '') // Remove curly braces if present
          
          // Check if message data matches filter
          if (message.data && message.data[field] !== cleanValue) {
            // Also check specific ID fields in the message
            const idFields = {
              board_id: message.boardId,
              list_id: message.listId,
              task_id: message.taskId,
              user_id: message.userId,
              id: message.data?.id
            }
            
            if (idFields[field as keyof typeof idFields] !== cleanValue) {
              return // Skip this message as it doesn't match the filter
            }
          }
        }
      }

      // Convert and call the callback
      const payload = convertWebSocketMessage(message) as RealtimePostgresChangesPayload<T>
      callback(payload)
    })

    subscriptions.push(subscription)
  })

  return {
    unsubscribe: () => {
      subscriptions.forEach(sub => sub.unsubscribe())
    }
  }
}

/**
 * Subscribe to changes on a specific board and its related data
 */
export function subscribeToBoardChanges(
  boardId: string,
  callbacks: {
    onBoardChange?: (payload: RealtimePostgresChangesPayload<any>) => void
    onListChange?: (payload: RealtimePostgresChangesPayload<any>) => void
    onTaskChange?: (payload: RealtimePostgresChangesPayload<any>) => void
    onTaskLabelChange?: (payload: RealtimePostgresChangesPayload<any>) => void
    onCollaboratorChange?: (payload: RealtimePostgresChangesPayload<any>) => void
  }
): RealtimeSubscription {
  const subscription = websocketManager.subscribeToBoard(boardId, (message: WebSocketMessage) => {
    const payload = convertWebSocketMessage(message)

    // Route message to appropriate callback based on type
    switch (message.type) {
      case 'board_updated':
        if (callbacks.onBoardChange && message.boardId === boardId) {
          callbacks.onBoardChange(payload)
        }
        break
      case 'list_updated':
        if (callbacks.onListChange && message.boardId === boardId) {
          callbacks.onListChange(payload)
        }
        break
      case 'task_updated':
        if (callbacks.onTaskChange && message.boardId === boardId) {
          callbacks.onTaskChange(payload)
        }
        break
      case 'task_label_updated':
        if (callbacks.onTaskLabelChange && message.boardId === boardId) {
          callbacks.onTaskLabelChange(payload)
        }
        break
      case 'collaborator_added':
      case 'collaborator_removed':
        if (callbacks.onCollaboratorChange && message.boardId === boardId) {
          callbacks.onCollaboratorChange(payload)
        }
        break
    }
  })

  return subscription
}

/**
 * Subscribe to changes for a specific list and its tasks
 */
export function subscribeToListChanges(
  listId: string,
  callbacks: {
    onListChange?: (payload: RealtimePostgresChangesPayload<any>) => void
    onTaskChange?: (payload: RealtimePostgresChangesPayload<any>) => void
    onTaskLabelChange?: (payload: RealtimePostgresChangesPayload<any>) => void
  }
): RealtimeSubscription {
  const subscription = websocketManager.subscribeToList(listId, (message: WebSocketMessage) => {
    const payload = convertWebSocketMessage(message)

    // Route message to appropriate callback based on type
    switch (message.type) {
      case 'list_updated':
        if (callbacks.onListChange && message.listId === listId) {
          callbacks.onListChange(payload)
        }
        break
      case 'task_updated':
        if (callbacks.onTaskChange && message.listId === listId) {
          callbacks.onTaskChange(payload)
        }
        break
      case 'task_label_updated':
        if (callbacks.onTaskLabelChange && message.listId === listId) {
          callbacks.onTaskLabelChange(payload)
        }
        break
    }
  })

  return subscription
}

/**
 * Subscribe to changes for a specific task
 */
export function subscribeToTaskChanges(
  taskId: string,
  callbacks: {
    onTaskChange?: (payload: RealtimePostgresChangesPayload<any>) => void
    onTaskLabelChange?: (payload: RealtimePostgresChangesPayload<any>) => void
  }
): RealtimeSubscription {
  const subscription = websocketManager.subscribeToTask(taskId, (message: WebSocketMessage) => {
    const payload = convertWebSocketMessage(message)

    // Route message to appropriate callback based on type
    switch (message.type) {
      case 'task_updated':
        if (callbacks.onTaskChange && message.taskId === taskId) {
          callbacks.onTaskChange(payload)
        }
        break
      case 'task_label_updated':
        if (callbacks.onTaskLabelChange && message.taskId === taskId) {
          callbacks.onTaskLabelChange(payload)
        }
        break
    }
  })

  return subscription
}

/**
 * Utility to get the changed record from a realtime payload
 */
export function getChangedRecord<T extends Record<string, any>>(payload: RealtimePostgresChangesPayload<T>): T | null {
  switch (payload.eventType) {
    case 'INSERT':
      return payload.new as T
    case 'UPDATE':
      return payload.new as T
    case 'DELETE':
      return payload.old as T
    default:
      return null
  }
}

/**
 * Utility to check if a specific column was updated
 */
export function wasColumnUpdated(payload: RealtimePostgresChangesPayload<Record<string, any>>, columnName: string): boolean {
  if (payload.eventType !== 'UPDATE') return false
  
  const oldValue = payload.old?.[columnName]
  const newValue = payload.new?.[columnName]
  
  return oldValue !== newValue
}