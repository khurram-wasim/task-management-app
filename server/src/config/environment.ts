// Environment configuration with validation
import dotenv from 'dotenv'
import { EnvConfig } from '@/types'

// Load environment variables
dotenv.config()

// Environment validation function
function validateEnv(): EnvConfig {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET'
  ]

  // Check for required environment variables
  const missing = requiredEnvVars.filter(key => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  // Validate URLs
  const supabaseUrl = process.env['SUPABASE_URL']!
  try {
    new URL(supabaseUrl)
  } catch {
    throw new Error('SUPABASE_URL must be a valid URL')
  }

  // Validate JWT secret length
  const jwtSecret = process.env['JWT_SECRET']!
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long')
  }

  // Parse numeric values with defaults
  const port = parseInt(process.env['PORT'] || '3001', 10)
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid port number (1-65535)')
  }

  // Validate NODE_ENV
  const nodeEnv = process.env['NODE_ENV'] || 'development'
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be one of: development, production, test')
  }

  return {
    PORT: port,
    NODE_ENV: nodeEnv as 'development' | 'production' | 'test',
    FRONTEND_URL: process.env['FRONTEND_URL'] || 'http://localhost:5173',
    SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: process.env['SUPABASE_ANON_KEY']!,
    SUPABASE_SERVICE_ROLE_KEY: process.env['SUPABASE_SERVICE_ROLE_KEY']!,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] || '7d',
    DATABASE_URL: process.env['DATABASE_URL']
  }
}

// Validate and export configuration
export const env = validateEnv()

// Helper functions
export function isProduction(): boolean {
  return env.NODE_ENV === 'production'
}

export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development'
}

export function isTest(): boolean {
  return env.NODE_ENV === 'test'
}

// Log configuration (excluding sensitive values)
export function logConfig(): void {
  console.log('🔧 Environment Configuration:')
  console.log(`   NODE_ENV: ${env.NODE_ENV}`)
  console.log(`   PORT: ${env.PORT}`)
  console.log(`   FRONTEND_URL: ${env.FRONTEND_URL}`)
  console.log(`   SUPABASE_URL: ${env.SUPABASE_URL}`)
  console.log(`   JWT_EXPIRES_IN: ${env.JWT_EXPIRES_IN}`)
  console.log(`   SUPABASE_ANON_KEY: ${env.SUPABASE_ANON_KEY.slice(0, 20)}...`)
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${env.SUPABASE_SERVICE_ROLE_KEY.slice(0, 20)}...`)
  console.log(`   JWT_SECRET: ${'*'.repeat(env.JWT_SECRET.length)}`)
}