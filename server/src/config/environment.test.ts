// Tests for environment configuration
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock dotenv with proper default export
vi.mock('dotenv', () => ({
  default: {
    config: vi.fn()
  },
  config: vi.fn()
}))

describe('Environment Configuration', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
    // Clear module cache to reload environment module
    vi.resetModules()
  })

  it('should validate required environment variables', async () => {
    // Set minimal required environment
    process.env = {
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_ANON_KEY: 'test_anon_key',
      SUPABASE_SERVICE_ROLE_KEY: 'test_service_key',
      JWT_SECRET: 'test_jwt_secret_minimum_32_chars_long'
    }

    const { env } = await import('./environment')
    
    expect(env.SUPABASE_URL).toBe('https://test.supabase.co')
    expect(env.SUPABASE_ANON_KEY).toBe('test_anon_key')
    expect(env.JWT_SECRET).toBe('test_jwt_secret_minimum_32_chars_long')
    expect(env.PORT).toBe(3001) // default
    expect(env.NODE_ENV).toBe('development') // default
  })

  it('should throw error when required variables are missing', async () => {
    process.env = {}

    await expect(() => import('./environment')).rejects.toThrow(
      'Missing required environment variables'
    )
  })

  it('should validate JWT secret length', async () => {
    process.env = {
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_ANON_KEY: 'test_anon_key',
      SUPABASE_SERVICE_ROLE_KEY: 'test_service_key',
      JWT_SECRET: 'short' // too short
    }

    await expect(() => import('./environment')).rejects.toThrow(
      'JWT_SECRET must be at least 32 characters long'
    )
  })

  it('should validate Supabase URL format', async () => {
    process.env = {
      SUPABASE_URL: 'invalid-url',
      SUPABASE_ANON_KEY: 'test_anon_key',
      SUPABASE_SERVICE_ROLE_KEY: 'test_service_key',
      JWT_SECRET: 'test_jwt_secret_minimum_32_chars_long'
    }

    await expect(() => import('./environment')).rejects.toThrow(
      'SUPABASE_URL must be a valid URL'
    )
  })

  it('should validate port number', async () => {
    process.env = {
      PORT: 'invalid',
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_ANON_KEY: 'test_anon_key',
      SUPABASE_SERVICE_ROLE_KEY: 'test_service_key',
      JWT_SECRET: 'test_jwt_secret_minimum_32_chars_long'
    }

    await expect(() => import('./environment')).rejects.toThrow(
      'PORT must be a valid port number'
    )
  })

  it('should validate NODE_ENV values', async () => {
    process.env = {
      NODE_ENV: 'invalid',
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_ANON_KEY: 'test_anon_key',
      SUPABASE_SERVICE_ROLE_KEY: 'test_service_key',
      JWT_SECRET: 'test_jwt_secret_minimum_32_chars_long'
    }

    await expect(() => import('./environment')).rejects.toThrow(
      'NODE_ENV must be one of: development, production, test'
    )
  })

  it('should use default values for optional variables', async () => {
    process.env = {
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_ANON_KEY: 'test_anon_key',
      SUPABASE_SERVICE_ROLE_KEY: 'test_service_key',
      JWT_SECRET: 'test_jwt_secret_minimum_32_chars_long'
    }

    const { env } = await import('./environment')
    
    expect(env.PORT).toBe(3001)
    expect(env.NODE_ENV).toBe('development')
    expect(env.FRONTEND_URL).toBe('http://localhost:5173')
    expect(env.JWT_EXPIRES_IN).toBe('7d')
  })

  it('should test environment helper functions', async () => {
    process.env = {
      NODE_ENV: 'production',
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_ANON_KEY: 'test_anon_key',
      SUPABASE_SERVICE_ROLE_KEY: 'test_service_key',
      JWT_SECRET: 'test_jwt_secret_minimum_32_chars_long'
    }

    const { isProduction, isDevelopment, isTest } = await import('./environment')
    
    expect(isProduction()).toBe(true)
    expect(isDevelopment()).toBe(false)
    expect(isTest()).toBe(false)
  })
})