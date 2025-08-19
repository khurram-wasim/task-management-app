// API client for backend communication
import type { 
  ApiUser,
  Board, 
  List, 
  Task,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  CreateBoardRequest,
  UpdateBoardRequest,
  CreateListRequest,
  UpdateListRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  MoveTaskRequest,
  AddCollaboratorRequest,
} from '@/types'

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Token management
let authToken: string | null = null

export const setAuthToken = (token: string | null) => {
  authToken = token
  if (token) {
    localStorage.setItem('auth_token', token)
  } else {
    localStorage.removeItem('auth_token')
  }
}

export const getAuthToken = (): string | null => {
  if (authToken) return authToken
  return localStorage.getItem('auth_token')
}

// API Error class
export class ApiError extends Error {
  status: number
  code?: string
  details?: any

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: any
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

// Base API client
class ApiClient {
  private baseUrl: string
  private authChangeCallbacks: Set<(user: ApiUser | null) => void> = new Set()

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  // Auth change management
  onAuthChange(callback: (user: ApiUser | null) => void): () => void {
    this.authChangeCallbacks.add(callback)
    return () => {
      this.authChangeCallbacks.delete(callback)
    }
  }

  private notifyAuthChange(user: ApiUser | null): void {
    this.authChangeCallbacks.forEach(callback => {
      try {
        callback(user)
      } catch (error) {
        console.error('Error in auth change callback:', error)
      }
    })
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const token = getAuthToken()

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        let errorCode = response.status.toString()
        let errorDetails = null

        try {
          const errorData = await response.json()
          if (errorData.message) {
            errorMessage = errorData.message
          }
          if (errorData.error?.code) {
            errorCode = errorData.error.code
          }
          if (errorData.error?.details) {
            errorDetails = errorData.error.details
          }
        } catch {
          // If JSON parsing fails, use default error message
        }

        throw new ApiError(errorMessage, response.status, errorCode, errorDetails)
      }

      const data = await response.json()
      
      // For successful responses, return the data payload
      if (data.success && data.data !== undefined) {
        return data.data
      }
      
      return data
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      
      // Handle network or other errors
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error occurred',
        0,
        'NETWORK_ERROR'
      )
    }
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    
    // Set token and notify auth change
    setAuthToken(response.token)
    this.notifyAuthChange(response.user)
    
    return response
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
    
    // Set token and notify auth change
    setAuthToken(response.token)
    this.notifyAuthChange(response.user)
    
    return response
  }

  async logout(): Promise<void> {
    await this.request<void>('/auth/logout', {
      method: 'POST',
    })
    
    // Clear token and notify auth change
    setAuthToken(null)
    this.notifyAuthChange(null)
  }

  async refreshToken(refreshToken: string): Promise<{ token: string; expiresIn: string }> {
    return this.request<{ token: string; expiresIn: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
  }

  async getCurrentUser(): Promise<ApiUser> {
    return this.request<ApiUser>('/auth/me')
  }

  async verifyToken(): Promise<{ valid: boolean; user: ApiUser }> {
    return this.request<{ valid: boolean; user: ApiUser }>('/auth/verify')
  }

  // Board endpoints
  async getBoards(page = 1, limit = 20): Promise<{ boards: Board[]; total: number }> {
    return this.request<{ boards: Board[]; total: number }>(`/boards?page=${page}&limit=${limit}`)
  }

  async getBoard(id: string): Promise<Board> {
    return this.request<Board>(`/boards/${id}`)
  }

  async createBoard(boardData: CreateBoardRequest): Promise<Board> {
    return this.request<Board>('/boards', {
      method: 'POST',
      body: JSON.stringify(boardData),
    })
  }

  async updateBoard(id: string, updates: UpdateBoardRequest): Promise<Board> {
    return this.request<Board>(`/boards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async deleteBoard(id: string): Promise<void> {
    return this.request<void>(`/boards/${id}`, {
      method: 'DELETE',
    })
  }

  async addBoardCollaborator(boardId: string, collaboratorData: AddCollaboratorRequest): Promise<void> {
    return this.request<void>(`/boards/${boardId}/collaborators`, {
      method: 'POST',
      body: JSON.stringify(collaboratorData),
    })
  }

  async removeBoardCollaborator(boardId: string, userId: string): Promise<void> {
    return this.request<void>(`/boards/${boardId}/collaborators/${userId}`, {
      method: 'DELETE',
    })
  }

  // List endpoints
  async getLists(boardId: string): Promise<List[]> {
    return this.request<List[]>(`/lists?boardId=${boardId}`)
  }

  async getList(id: string): Promise<List> {
    return this.request<List>(`/lists/${id}`)
  }

  async createList(listData: CreateListRequest): Promise<List> {
    return this.request<List>('/lists', {
      method: 'POST',
      body: JSON.stringify(listData),
    })
  }

  async updateList(id: string, updates: UpdateListRequest): Promise<List> {
    return this.request<List>(`/lists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async moveList(id: string, position: number): Promise<List> {
    return this.request<List>(`/lists/${id}/move`, {
      method: 'PUT',
      body: JSON.stringify({ position }),
    })
  }

  async deleteList(id: string): Promise<void> {
    return this.request<void>(`/lists/${id}`, {
      method: 'DELETE',
    })
  }

  // Task endpoints
  async getTasks(listId: string): Promise<Task[]> {
    return this.request<Task[]>(`/tasks?listId=${listId}`)
  }

  async getTask(id: string): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`)
  }

  async createTask(taskData: CreateTaskRequest): Promise<Task> {
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    })
  }

  async updateTask(id: string, updates: UpdateTaskRequest): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async moveTask(id: string, moveData: MoveTaskRequest): Promise<Task> {
    return this.request<Task>(`/tasks/${id}/move`, {
      method: 'PUT',
      body: JSON.stringify(moveData),
    })
  }

  async deleteTask(id: string): Promise<void> {
    return this.request<void>(`/tasks/${id}`, {
      method: 'DELETE',
    })
  }

  async addTaskLabel(taskId: string, label: { name: string; color: string }): Promise<void> {
    return this.request<void>(`/tasks/${taskId}/labels`, {
      method: 'POST',
      body: JSON.stringify(label),
    })
  }

  async removeTaskLabel(taskId: string, labelId: string): Promise<void> {
    return this.request<void>(`/tasks/${taskId}/labels/${labelId}`, {
      method: 'DELETE',
    })
  }

  // Health check
  async healthCheck(): Promise<{ status: string; message: string; timestamp: string; version: string }> {
    return this.request<{ status: string; message: string; timestamp: string; version: string }>('/health')
  }
}

// Create and export API client instance
export const api = new ApiClient(API_BASE_URL)