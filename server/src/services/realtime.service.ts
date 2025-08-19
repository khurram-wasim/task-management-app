// Real-time WebSocket broadcasting service
import { WebSocket, WebSocketServer } from 'ws'
import { logger } from '@/utils'
import { 
  WebSocketMessage, 
  BoardUpdateMessage, 
  ListUpdateMessage, 
  TaskUpdateMessage,
  BoardResponse,
  ListResponse,
  TaskResponse 
} from '@/types'

export class RealtimeService {
  private wss: WebSocketServer | null = null
  private connections = new Map<string, Set<WebSocket>>() // boardId -> Set of WebSockets

  constructor() {
    logger.debug('RealtimeService initialized')
  }

  // Initialize with WebSocket server
  setWebSocketServer(wss: WebSocketServer) {
    this.wss = wss
    logger.info('RealtimeService connected to WebSocket server')
  }

  // Subscribe client to board updates
  subscribeToBoard(ws: WebSocket, boardId: string, userId: string) {
    if (!this.connections.has(boardId)) {
      this.connections.set(boardId, new Set())
    }
    
    this.connections.get(boardId)!.add(ws)
    
    // Store metadata on the WebSocket
    ;(ws as any).boardId = boardId
    ;(ws as any).userId = userId
    
    logger.realtime('Client subscribed to board', boardId, userId, this.getConnectionCount(boardId))
    
    // Send confirmation to client
    this.sendToClient(ws, {
      type: 'subscription_confirmed',
      payload: { boardId },
      boardId,
      userId,
      timestamp: new Date().toISOString()
    })
  }

  // Unsubscribe client from board updates
  unsubscribeFromBoard(ws: WebSocket, boardId?: string) {
    const targetBoardId = boardId || (ws as any).boardId
    
    if (targetBoardId && this.connections.has(targetBoardId)) {
      this.connections.get(targetBoardId)!.delete(ws)
      
      // Clean up empty sets
      if (this.connections.get(targetBoardId)!.size === 0) {
        this.connections.delete(targetBoardId)
      }
      
      logger.realtime('Client unsubscribed from board', targetBoardId, (ws as any).userId, this.getConnectionCount(targetBoardId))
    }
  }

  // Broadcast board update to all subscribed clients
  broadcastBoardUpdate(boardId: string, action: 'created' | 'updated' | 'deleted', board: BoardResponse, excludeUserId?: string) {
    const message: BoardUpdateMessage = {
      type: 'board_update',
      payload: { action, board },
      boardId,
      timestamp: new Date().toISOString()
    }

    this.broadcastToBoard(boardId, message, excludeUserId)
    logger.realtime('Board update broadcasted', boardId, excludeUserId, this.getConnectionCount(boardId))
  }

  // Broadcast list update to all subscribed clients
  broadcastListUpdate(boardId: string, action: 'created' | 'updated' | 'deleted' | 'moved', list: ListResponse, excludeUserId?: string) {
    const message: ListUpdateMessage = {
      type: 'list_update',
      payload: { action, list },
      boardId,
      timestamp: new Date().toISOString()
    }

    this.broadcastToBoard(boardId, message, excludeUserId)
    logger.realtime('List update broadcasted', boardId, excludeUserId, this.getConnectionCount(boardId))
  }

  // Broadcast task update to all subscribed clients
  broadcastTaskUpdate(
    boardId: string, 
    action: 'created' | 'updated' | 'deleted' | 'moved', 
    task: TaskResponse, 
    oldListId?: string,
    newListId?: string,
    excludeUserId?: string
  ) {
    const message: TaskUpdateMessage = {
      type: 'task_update',
      payload: { 
        action, 
        task,
        ...(oldListId && { oldListId }),
        ...(newListId && { newListId })
      },
      boardId,
      timestamp: new Date().toISOString()
    }

    this.broadcastToBoard(boardId, message, excludeUserId)
    logger.realtime('Task update broadcasted', boardId, excludeUserId, this.getConnectionCount(boardId))
  }

  // Broadcast user activity (user joined/left board)
  broadcastUserActivity(boardId: string, userId: string, activity: 'joined' | 'left') {
    const message: WebSocketMessage = {
      type: 'user_activity',
      payload: { userId, activity, connectionCount: this.getConnectionCount(boardId) },
      boardId,
      userId,
      timestamp: new Date().toISOString()
    }

    this.broadcastToBoard(boardId, message, userId) // Exclude the user who triggered the activity
    logger.realtime('User activity broadcasted', boardId, userId, this.getConnectionCount(boardId))
  }

  // Private method to broadcast message to all clients subscribed to a board
  private broadcastToBoard(boardId: string, message: WebSocketMessage, excludeUserId?: string) {
    const connections = this.connections.get(boardId)
    if (!connections || connections.size === 0) {
      logger.debug('No connections found for board', { boardId })
      return
    }

    const messageStr = JSON.stringify(message)
    let broadcastCount = 0

    connections.forEach(ws => {
      // Skip if this is the user who triggered the update (to avoid echo)
      if (excludeUserId && (ws as any).userId === excludeUserId) {
        return
      }

      // Only send to open connections
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr)
          broadcastCount++
        } catch (error) {
          logger.error('Failed to send WebSocket message', error as Error, { 
            boardId, 
            userId: (ws as any).userId 
          })
          // Remove failed connection
          connections.delete(ws)
        }
      } else {
        // Clean up closed connections
        connections.delete(ws)
      }
    })

    logger.debug('Message broadcasted to clients', { 
      boardId, 
      broadcastCount, 
      excludeUserId,
      messageType: message.type 
    })
  }

  // Send message to specific client
  private sendToClient(ws: WebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message))
      } catch (error) {
        logger.error('Failed to send message to client', error as Error)
      }
    }
  }

  // Get number of connections for a board
  private getConnectionCount(boardId: string): number {
    const connections = this.connections.get(boardId)
    return connections ? connections.size : 0
  }

  // Get all active board connections (for debugging)
  getActiveConnections(): Record<string, number> {
    const result: Record<string, number> = {}
    this.connections.forEach((connections, boardId) => {
      result[boardId] = connections.size
    })
    return result
  }

  // Clean up all connections (for server shutdown)
  cleanup() {
    this.connections.clear()
    logger.info('RealtimeService cleaned up all connections')
  }

  // Handle WebSocket connection
  handleConnection(ws: WebSocket) {
    logger.realtime('WebSocket connection established')
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString())
        logger.realtime('WebSocket message received', data.boardId, data.userId, this.wss?.clients.size)
        
        // Handle different message types
        switch (data.type) {
          case 'subscribe_board':
            if (data.boardId && data.userId) {
              this.subscribeToBoard(ws, data.boardId, data.userId)
            }
            break
            
          case 'unsubscribe_board':
            this.unsubscribeFromBoard(ws, data.boardId)
            break
            
          case 'ping':
            this.sendToClient(ws, {
              type: 'pong',
              payload: { timestamp: new Date().toISOString() },
              timestamp: new Date().toISOString()
            })
            break
            
          default:
            logger.warn('Unknown WebSocket message type', { 
              type: data.type,
              userId: data.userId,
              boardId: data.boardId
            })
        }
        
      } catch (error) {
        logger.error('WebSocket message parsing failed', error as Error)
        this.sendToClient(ws, {
          type: 'error',
          payload: { message: 'Invalid message format' },
          timestamp: new Date().toISOString()
        })
      }
    })
    
    ws.on('close', () => {
      this.unsubscribeFromBoard(ws)
      logger.realtime('WebSocket connection closed', (ws as any).boardId, (ws as any).userId, this.wss?.clients.size)
    })
    
    ws.on('error', (error) => {
      logger.error('WebSocket error', error instanceof Error ? error : new Error(String(error)))
      this.unsubscribeFromBoard(ws)
    })
    
    // Send welcome message
    this.sendToClient(ws, {
      type: 'connection',
      payload: { message: 'Connected to Task Management WebSocket server' },
      timestamp: new Date().toISOString()
    })
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService()