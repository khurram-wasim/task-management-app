// Supabase client configuration for backend
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { env } from './environment'
import { logger } from '@/utils'
import type { Database } from '@/types/database'

// Supabase client instances
let supabaseAdmin: SupabaseClient<Database> | null = null
let supabaseAnon: SupabaseClient<Database> | null = null

// Create admin client with service role key (full database access)
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        },
        db: {
          schema: 'public'
        },
        global: {
          headers: {
            'X-Client-Info': 'task-management-backend'
          }
        }
      }
    )
    
    logger.info('Supabase admin client initialized')
  }
  
  return supabaseAdmin
}

// Create anonymous client (respects RLS policies)
export function getSupabaseAnon(): SupabaseClient<Database> {
  if (!supabaseAnon) {
    supabaseAnon = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        },
        db: {
          schema: 'public'
        },
        global: {
          headers: {
            'X-Client-Info': 'task-management-backend'
          }
        }
      }
    )
    
    logger.info('Supabase anonymous client initialized')
  }
  
  return supabaseAnon
}

// Create authenticated client for a specific user
export function getSupabaseForUser(accessToken: string): SupabaseClient<Database> {
  return createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Client-Info': 'task-management-backend'
        }
      }
    }
  )
}

// Database connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const admin = getSupabaseAdmin()
    const { error } = await admin
      .from('boards')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      logger.error('Database connection check failed', error)
      return false
    }
    
    logger.info('Database connection verified')
    return true
  } catch (error) {
    logger.error('Database connection check error', error instanceof Error ? error : new Error(String(error)))
    return false
  }
}

// Initialize database connection
export async function initializeDatabase(): Promise<void> {
  try {
    logger.info('Initializing database connection...')
    
    // Check if we have a real service role key (not placeholder)
    const hasRealServiceKey = !env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')
    
    if (!hasRealServiceKey) {
      logger.warn('Using placeholder Supabase service role key - database operations will be limited')
      logger.info('Database initialized with limited functionality (placeholder service key)')
      return
    }
    
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      throw new Error('Failed to connect to database')
    }
    
    logger.info('Database initialized successfully')
  } catch (error) {
    logger.error('Database initialization failed', error instanceof Error ? error : new Error(String(error)))
    
    // In development, allow server to continue even if database connection fails
    if (env.NODE_ENV === 'development') {
      logger.warn('Continuing server startup in development mode despite database connection failure')
      return
    }
    
    throw error
  }
}

// Close database connections (for graceful shutdown)
export function closeDatabaseConnections(): void {
  if (supabaseAdmin) {
    // Supabase doesn't have explicit close method, but we can null the clients
    supabaseAdmin = null
    logger.info('Supabase admin client closed')
  }
  
  if (supabaseAnon) {
    supabaseAnon = null
    logger.info('Supabase anonymous client closed')
  }
}