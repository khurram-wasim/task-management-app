// Central exports for services
export { DatabaseService, databaseService } from './database.service'
export { AuthService, authService } from './auth.service'
export type { AuthUser, AuthTokens, RegisterData, LoginData } from './auth.service'

// Service response helpers
export type { ServiceResponse } from '@/types'

// Re-export commonly used database types
export type { Board, BoardInsert, BoardUpdate, List, ListInsert, ListUpdate, Task, TaskInsert, TaskUpdate, TaskLabel, TaskLabelInsert, BoardCollaborator, BoardCollaboratorInsert } from '@/types/database'