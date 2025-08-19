// Test setup for backend API tests
import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import dotenv from 'dotenv'

// Load test environment variables
dotenv.config({ path: '.env.test' })

// Global test setup
beforeAll(() => {
  // Set test environment
  process.env['NODE_ENV'] = 'test'
  
  // Mock console methods for cleaner test output
  console.log = vi.fn()
  console.error = vi.fn()
  console.warn = vi.fn()
})

afterAll(() => {
  // Cleanup after all tests
})

beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks()
})

afterEach(() => {
  // Cleanup after each test
})

// Extend global object for test utilities
declare global {
  var testUtils: Record<string, any>
}

// Global test utilities
globalThis.testUtils = {
  // Add any global test utilities here
}