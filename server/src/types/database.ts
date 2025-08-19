// Supabase Database Types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      boards: {
        Row: {
          id: string
          owner_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      board_collaborators: {
        Row: {
          id: string
          board_id: string
          user_id: string
          role: 'member' | 'admin'
          created_at: string
        }
        Insert: {
          id?: string
          board_id: string
          user_id: string
          role: 'member' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          user_id?: string
          role?: 'member' | 'admin'
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      lists: {
        Row: {
          id: string
          board_id: string
          name: string
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          board_id: string
          name: string
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          name?: string
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          list_id: string
          title: string
          description: string | null
          due_date: string | null
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          list_id: string
          title: string
          description?: string | null
          due_date?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      task_labels: {
        Row: {
          id: string
          task_id: string
          label_name: string
          label_color: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          label_name: string
          label_color: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          label_name?: string
          label_color?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types for database tables
export type Board = Database['public']['Tables']['boards']['Row']
export type BoardInsert = Database['public']['Tables']['boards']['Insert']
export type BoardUpdate = Database['public']['Tables']['boards']['Update']

export type BoardCollaborator = Database['public']['Tables']['board_collaborators']['Row']
export type BoardCollaboratorInsert = Database['public']['Tables']['board_collaborators']['Insert']
export type BoardCollaboratorUpdate = Database['public']['Tables']['board_collaborators']['Update']

export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type List = Database['public']['Tables']['lists']['Row']
export type ListInsert = Database['public']['Tables']['lists']['Insert']
export type ListUpdate = Database['public']['Tables']['lists']['Update']

export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export type TaskLabel = Database['public']['Tables']['task_labels']['Row']
export type TaskLabelInsert = Database['public']['Tables']['task_labels']['Insert']
export type TaskLabelUpdate = Database['public']['Tables']['task_labels']['Update']

// Supabase Auth User type
export interface SupabaseUser {
  id: string
  aud: string
  role: string
  email: string
  email_confirmed_at?: string
  phone?: string
  confirmed_at?: string
  last_sign_in_at?: string
  app_metadata: Record<string, any>
  user_metadata: Record<string, any>
  identities?: Array<{
    id: string
    user_id: string
    identity_data: Record<string, any>
    provider: string
    created_at: string
    updated_at: string
  }>
  created_at: string
  updated_at: string
}

// Extended types with relationships
export interface BoardWithDetails extends Board {
  lists_count?: number
  tasks_count?: number
  collaborators?: Array<{
    id: string
    email: string
    full_name?: string
  }>
}

export interface ListWithTasks extends List {
  tasks?: Task[]
  tasks_count?: number
}

export interface TaskWithLabels extends Task {
  labels?: Array<{
    id: string
    label_name: string
    label_color: string
  }>
}

// Query filter types
export interface BoardFilters {
  user_id?: string
  search?: string
  collaborator_id?: string
}

export interface ListFilters {
  board_id: string
}

export interface TaskFilters {
  list_id?: string
  board_id?: string
  due_date_from?: string
  due_date_to?: string
  search?: string
  has_labels?: boolean
}

// Service data types
export interface CreateBoardData {
  name: string
  description?: string | undefined
}

export interface UpdateBoardData {
  name?: string
  description?: string | null
}

export interface CreateListData {
  name: string
  board_id: string
  position?: number
}

export interface UpdateListData {
  name?: string
  position?: number
}

export interface CreateTaskData {
  title: string
  description?: string
  list_id: string
  due_date?: string
  position?: number
}

export interface UpdateTaskData {
  title?: string
  description?: string | null
  due_date?: string | null
  position?: number
  list_id?: string
}

export interface BoardWithCollaborators extends Board {
  board_collaborators: Array<{
    user_id: string
    role: string
    users: {
      id: string
      email: string
      full_name: string | null
    }
  }>
  lists?: Array<{
    id: string
    name: string
    position: number
    tasks: Array<{
      id: string
      title: string
      position: number
    }>
  }>
}

// Auth user type for tokens
export interface AuthUser {
  id: string
  email: string
  fullName?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
  expiresIn: string
}