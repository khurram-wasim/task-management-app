// Central configuration exports
export { env, isProduction, isDevelopment, isTest, logConfig } from './environment'
export { getSupabaseAdmin, getSupabaseAnon, getSupabaseForUser, checkDatabaseConnection, initializeDatabase, closeDatabaseConnections } from './database'

// Configuration constants
export const CONFIG = {
  // Server settings
  REQUEST_TIMEOUT: 30000, // 30 seconds
  MAX_REQUEST_SIZE: '10mb',
  CORS_MAX_AGE: 86400, // 24 hours
  
  // Rate limiting
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit for development
  
  // Authentication
  JWT_ALGORITHM: 'HS256' as const,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  
  // Database
  CONNECTION_POOL_MIN: 2,
  CONNECTION_POOL_MAX: 10,
  QUERY_TIMEOUT: 10000, // 10 seconds
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // WebSocket
  WS_HEARTBEAT_INTERVAL: 30000, // 30 seconds
  WS_CONNECTION_TIMEOUT: 60000, // 60 seconds
  
  // Logging
  LOG_LEVEL: 'info' as const,
  LOG_FORMAT: 'json' as const,
  
  // File uploads (if needed later)
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  
  // Cache settings (if needed later)
  CACHE_TTL: 300, // 5 minutes
  CACHE_MAX_SIZE: 100
} as const

// Validation constants
export const VALIDATION = {
  UUID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  COLOR_REGEX: /^#[0-9A-Fa-f]{6}$/,
  STRONG_PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/
} as const