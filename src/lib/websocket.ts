import { api } from './api'

export type WebSocketEventType = 'board_updated' | 'list_updated' | 'task_updated' | 'task_label_updated' | 'collaborator_added' | 'collaborator_removed'
export type WebSocketOperation = 'INSERT' | 'UPDATE' | 'DELETE'

export interface WebSocketMessage {
  type: WebSocketEventType
  operation: WebSocketOperation
  data: any
  boardId?: string
  listId?: string
  taskId?: string
  userId?: string
  timestamp: string
}

export interface RealtimeSubscription {
  unsubscribe: () => void
}

class WebSocketManager {
  private ws: WebSocket | null = null
  private subscribers = new Map<string, Set<(message: WebSocketMessage) => void>>()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnecting = false
  private shouldConnect = false

  private getWebSocketUrl(): string {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const wsUrl = apiUrl.replace('http', 'ws')
    return `${wsUrl}/api/ws`
  }

  async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return
    }

    this.isConnecting = true
    this.shouldConnect = true

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.warn('No auth token found for WebSocket connection')
        return
      }

      const wsUrl = `${this.getWebSocketUrl()}?token=${encodeURIComponent(token)}`
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.isConnecting = false
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        this.ws = null
        this.isConnecting = false

        if (this.shouldConnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++
            this.connect()
          }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts))
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.isConnecting = false
      }

    } catch (error) {
      console.error('Error connecting to WebSocket:', error)
      this.isConnecting = false
    }
  }

  disconnect(): void {
    this.shouldConnect = false
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.subscribers.clear()
  }

  private handleMessage(message: WebSocketMessage): void {
    // Notify all subscribers
    this.subscribers.forEach((callbacks) => {
      callbacks.forEach(callback => callback(message))
    })

    // Notify specific subscribers based on message type and IDs
    const keys = [
      message.type,
      `${message.type}:${message.boardId}`,
      `${message.type}:${message.listId}`,
      `${message.type}:${message.taskId}`,
      `board:${message.boardId}`,
      `list:${message.listId}`,
      `task:${message.taskId}`
    ].filter(Boolean)

    keys.forEach(key => {
      const keyCallbacks = this.subscribers.get(key)
      if (keyCallbacks) {
        keyCallbacks.forEach(callback => callback(message))
      }
    })
  }

  subscribe(key: string, callback: (message: WebSocketMessage) => void): RealtimeSubscription {
    // Ensure connection is established
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect()
    }

    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set())
    }
    this.subscribers.get(key)!.add(callback)

    return {
      unsubscribe: () => {
        const callbacks = this.subscribers.get(key)
        if (callbacks) {
          callbacks.delete(callback)
          if (callbacks.size === 0) {
            this.subscribers.delete(key)
          }
        }
      }
    }
  }

  subscribeToBoard(boardId: string, callback: (message: WebSocketMessage) => void): RealtimeSubscription {
    return this.subscribe(`board:${boardId}`, callback)
  }

  subscribeToList(listId: string, callback: (message: WebSocketMessage) => void): RealtimeSubscription {
    return this.subscribe(`list:${listId}`, callback)
  }

  subscribeToTask(taskId: string, callback: (message: WebSocketMessage) => void): RealtimeSubscription {
    return this.subscribe(`task:${taskId}`, callback)
  }

  subscribeToEventType(eventType: WebSocketEventType, callback: (message: WebSocketMessage) => void): RealtimeSubscription {
    return this.subscribe(eventType, callback)
  }
}

// Create singleton instance
export const websocketManager = new WebSocketManager()

// Auto-connect when authenticated
api.onAuthChange((user) => {
  if (user) {
    websocketManager.connect()
  } else {
    websocketManager.disconnect()
  }
})