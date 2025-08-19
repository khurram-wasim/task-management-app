// API Request and Response Types
import { Request } from 'express'

// Extended Express Request with user authentication
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    aud: string
    role: string
  }
  accessToken?: string
  requestId?: string
}

// Standard API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    timestamp: string
    requestId?: string
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
}

// Authentication related types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  fullName?: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    fullName?: string | undefined
  }
  token: string
  refreshToken?: string
  expiresIn: string
}

// Board related types
export interface CreateBoardRequest {
  name: string
  description?: string
}

export interface UpdateBoardRequest {
  name?: string
  description?: string
}

export interface BoardResponse {
  id: string
  name: string
  description?: string | null
  userId: string
  createdAt: string
  updatedAt: string
  listsCount?: number
  tasksCount?: number
  collaborators?: Array<{
    id: string
    email: string
    fullName?: string
  }>
}

// List related types
export interface CreateListRequest {
  name: string
  boardId: string
  position?: number
}

export interface UpdateListRequest {
  name?: string
  position?: number
}

export interface ListResponse {
  id: string
  name: string
  boardId: string
  position: number
  createdAt: string
  updatedAt: string
  tasksCount?: number
  tasks?: TaskResponse[]
}

// Task related types
export interface CreateTaskRequest {
  title: string
  description?: string
  listId: string
  dueDate?: string
  position?: number
  labels?: Array<{
    name: string
    color: string
  }>
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  listId?: string
  dueDate?: string
  position?: number
}

export interface TaskResponse {
  id: string
  title: string
  description?: string | null
  listId: string
  dueDate?: string | null
  position: number
  createdAt: string
  updatedAt: string
  labels?: Array<{
    id: string
    name: string
    color: string
  }>
}

// Collaboration types
export interface AddCollaboratorRequest {
  email: string
  boardId: string
  role?: 'member' | 'admin'
}

export interface CollaboratorResponse {
  id: string
  boardId: string
  userId: string
  user: {
    id: string
    email: string
    fullName?: string
  }
  createdAt: string
}

// Real-time WebSocket message types
export interface WebSocketMessage {
  type: 'board_update' | 'list_update' | 'task_update' | 'user_activity' | 'error' | 'subscription_confirmed' | 'pong' | 'connection'
  payload: any
  boardId?: string
  userId?: string
  timestamp: string
}

export interface BoardUpdateMessage extends WebSocketMessage {
  type: 'board_update'
  payload: {
    action: 'created' | 'updated' | 'deleted'
    board: BoardResponse
  }
}

export interface ListUpdateMessage extends WebSocketMessage {
  type: 'list_update'
  payload: {
    action: 'created' | 'updated' | 'deleted' | 'moved'
    list: ListResponse
  }
}

export interface TaskUpdateMessage extends WebSocketMessage {
  type: 'task_update'
  payload: {
    action: 'created' | 'updated' | 'deleted' | 'moved' | 'label_added' | 'label_removed'
    task: TaskResponse
    oldListId?: string
    newListId?: string
  }
}

// Error types
export interface ApiError {
  code: string
  message: string
  statusCode: number
  details?: any
}

// Validation error details
export interface ValidationError {
  field: string
  message: string
  value?: any
}

// Pagination types
export interface PaginationQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    timestamp: string
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
}