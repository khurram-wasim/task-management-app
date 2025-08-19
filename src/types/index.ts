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

// Enhanced Board Management Types
export interface BoardWithStats extends Board {
  lists_count: number
  tasks_count: number
  collaborators_count: number
  last_activity?: string
  is_owner: boolean
  role?: 'owner' | 'admin' | 'member'
}

export interface BoardMember {
  id: string
  user_id: string
  board_id: string
  role: 'owner' | 'admin' | 'member'
  email: string
  name?: string
  avatar_url?: string
  joined_at: string
}

export interface BoardActivity {
  id: string
  board_id: string
  user_id: string
  action: 'created' | 'updated' | 'deleted' | 'moved' | 'assigned' | 'commented'
  entity_type: 'board' | 'list' | 'task' | 'comment'
  entity_id: string
  entity_name: string
  description: string
  created_at: string
  user: {
    id: string
    name?: string
    email: string
    avatar_url?: string
  }
}

export interface BoardInvitation {
  id: string
  board_id: string
  email: string
  role: 'admin' | 'member'
  invited_by: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  expires_at: string
  created_at: string
}

// Board Hook State Types
export interface BoardsState {
  boards: BoardWithStats[]
  loading: boolean
  error: string | null
  total: number
  hasMore: boolean
}

export interface BoardState {
  board: BoardWithStats | null
  members: BoardMember[]
  activities: BoardActivity[]
  loading: boolean
  error: string | null
}

// Board Form Types
export interface CreateBoardForm {
  name: string
  description?: string
  template?: 'blank' | 'kanban' | 'scrum' | 'personal'
  isPrivate?: boolean
}

export interface UpdateBoardForm {
  name?: string
  description?: string
  isPrivate?: boolean
}

export interface BoardFilters {
  search?: string
  sortBy?: 'name' | 'created_at' | 'updated_at' | 'activity'
  sortOrder?: 'asc' | 'desc'
  showArchived?: boolean
  role?: 'owner' | 'admin' | 'member'
}

// Board Permission Types
export interface BoardPermissions {
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canInvite: boolean
  canManageMembers: boolean
  canArchive: boolean
  canChangeVisibility: boolean
}

// Board Template Types
export interface BoardTemplate {
  id: string
  name: string
  description: string
  category: 'productivity' | 'project-management' | 'personal' | 'team'
  thumbnail?: string
  lists: Array<{
    name: string
    position: number
    tasks?: Array<{
      title: string
      description?: string
      position: number
    }>
  }>
}

// Board Sharing Types
export interface BoardShareSettings {
  is_public: boolean
  allow_comments: boolean
  allow_voting: boolean
  share_link?: string
  link_expires_at?: string
}

// Export/Import Types
export interface BoardExport {
  board: Board
  lists: List[]
  tasks: Task[]
  labels: TaskLabel[]
  export_format: 'json' | 'csv' | 'pdf'
  exported_at: string
}