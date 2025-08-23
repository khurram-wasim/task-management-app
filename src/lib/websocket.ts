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
    return wsUrl // WebSocket server runs directly on the server port, not on /api/ws
  }

  private getUserId(): string | null {
    // Try to get user ID from localStorage or API client
    try {
      // Use the same localStorage key as the API client
      const tokenData = localStorage.getItem('auth_token') // Fixed: was 'token', now 'auth_token'
      if (tokenData) {
        // Decode JWT token to get user ID (simple base64 decode)
        const payload = JSON.parse(atob(tokenData.split('.')[1]))
        console.log('Full JWT payload structure:', JSON.stringify(payload, null, 2)) // Enhanced debug log
        
        // Try multiple possible field names for user ID
        const possibleUserIdFields = [
          'sub',           // Standard JWT subject
          'userId',        // Common custom field
          'user_id',       // Snake case variant
          'id',            // Direct ID field
          'uid',           // Short user ID
          'user',          // User object
          'email'          // Sometimes email is used as identifier
        ]
        
        for (const field of possibleUserIdFields) {
          const value = payload[field]
          if (value) {
            console.log(`Found user ID in field '${field}':`, value)
            // If it's an object (like user), try to extract ID from it
            if (typeof value === 'object' && value.id) {
              return value.id
            }
            // If it's a string or number, use it directly
            if (typeof value === 'string' || typeof value === 'number') {
              return String(value)
            }
          }
        }
        
        console.warn('No user ID found in any expected JWT fields')
        return null
      }
    } catch (error) {
      console.warn('Could not get user ID from token:', error)
    }
    return null
  }

  async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return
    }

    this.isConnecting = true
    this.shouldConnect = true

    try {
      const token = localStorage.getItem('auth_token') // Fixed: was 'token', now 'auth_token'
      if (!token) {
        console.warn('No auth token found for WebSocket connection')
        // Continue anyway for testing
      }

      const wsUrl = token ? 
        `${this.getWebSocketUrl()}?token=${encodeURIComponent(token)}` : 
        this.getWebSocketUrl()
      
      console.log('Attempting WebSocket connection to:', wsUrl)
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.isConnecting = false
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        try {
          console.log('🔔 Frontend received WebSocket message:', event.data)
          const message: WebSocketMessage = JSON.parse(event.data)
          console.log('🔔 Parsed message:', message)
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
    // Ensure connection is established
    this.connect()

    // Send subscription message when connection is ready
    const sendSubscription = () => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const userId = this.getUserId()
        console.log('=== WEBSOCKET SUBSCRIPTION DEBUG ===')
        console.log('Board ID:', boardId)
        console.log('User ID from getUserId():', userId)
        console.log('Raw token from localStorage:', localStorage.getItem('auth_token')) // Fixed: was 'token', now 'auth_token'
        
        if (!userId) {
          console.error('❌ CRITICAL: userId is null - WebSocket subscription will fail!')
          console.log('Let me try parsing the token again...')
          
          const token = localStorage.getItem('auth_token') // Fixed: was 'token', now 'auth_token'
          if (token) {
            try {
              const parts = token.split('.')
              const payload = JSON.parse(atob(parts[1]))
              console.log('Manual JWT decode result:', JSON.stringify(payload, null, 2))
            } catch (e) {
              console.error('Manual JWT decode failed:', e)
            }
          }
        }
        
        console.log('Sending subscription message:', {
          type: 'subscribe_board',
          boardId: boardId,
          userId: userId
        })
        console.log('=====================================')
        
        this.ws.send(JSON.stringify({
          type: 'subscribe_board',
          boardId: boardId,
          userId: userId
        }))
      }
    }

    // If already connected, send immediately
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      sendSubscription()
    } else {
      // Wait for connection to open
      const originalOnOpen = this.ws?.onopen
      if (this.ws) {
        this.ws.onopen = (event) => {
          if (originalOnOpen) originalOnOpen.call(this.ws, event)
          sendSubscription()
        }
      }
    }

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