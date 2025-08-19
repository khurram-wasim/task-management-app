// Database entity types matching Supabase schema

export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

// API User type (returned from backend)
export interface ApiUser {
  id: string
  email: string
  fullName?: string
}

export interface Board {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface BoardCollaborator {
  id: string
  board_id: string
  user_id: string
  created_at: string
}

export interface List {
  id: string
  board_id: string
  name: string
  position: number
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  list_id: string
  title: string
  description: string | null
  due_date: string | null
  position: number
  created_at: string
  updated_at: string
}

export interface TaskLabel {
  id: string
  task_id: string
  label_name: string
  label_color: string // Hex color format: #RRGGBB
  created_at: string
}

// Extended types with relationships for UI components
export interface BoardWithCollaborators extends Board {
  collaborators?: BoardCollaborator[]
  lists?: ListWithTasks[]
}

export interface ListWithTasks extends List {
  tasks?: TaskWithLabels[]
}

export interface TaskWithLabels extends Task {
  labels?: TaskLabel[]
}

// Form types for creating/updating entities
export interface CreateBoardInput {
  name: string
  description?: string
}

export interface UpdateBoardInput {
  name?: string
  description?: string
}

export interface CreateListInput {
  board_id: string
  name: string
  position?: number
}

export interface UpdateListInput {
  name?: string
  position?: number
}

export interface CreateTaskInput {
  list_id: string
  title: string
  description?: string
  due_date?: string
  position?: number
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  due_date?: string
  position?: number
  list_id?: string // For moving tasks between lists
}

export interface CreateTaskLabelInput {
  task_id: string
  label_name: string
  label_color: string
}

// API response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  error: string | null
}

// Drag and drop types
export interface DragItem {
  id: string
  type: 'task' | 'list'
  source: {
    listId?: string
    boardId?: string
    index: number
  }
}

export interface DropResult {
  dragId: string
  type: 'task' | 'list'
  destination: {
    listId?: string
    boardId?: string
    index: number
  }
}

// Common props for components
export interface ComponentWithChildren {
  children: React.ReactNode
}

// Authentication types
export interface AuthUser {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

export interface AuthState {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

// API Request/Response types for backend communication
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
    fullName?: string
  }
  token: string
  expiresIn: string
}

export interface CreateBoardRequest {
  name: string
  description?: string
}

export interface UpdateBoardRequest {
  name?: string
  description?: string
}

export interface CreateListRequest {
  name: string
  boardId: string
  position?: number
}

export interface UpdateListRequest {
  name?: string
  position?: number
}

export interface CreateTaskRequest {
  title: string
  listId: string
  description?: string
  dueDate?: string
  position?: number
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  dueDate?: string
  position?: number
  listId?: string
}

export interface MoveTaskRequest {
  listId: string
  position: number
}

export interface AddCollaboratorRequest {
  email: string
  role?: 'member' | 'admin'
}