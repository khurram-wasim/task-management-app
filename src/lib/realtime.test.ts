import { describe, it, expect } from 'vitest'
import { getChangedRecord, wasColumnUpdated } from './realtime'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

describe('realtime utilities', () => {
  describe('getChangedRecord', () => {
    it('should return new record for INSERT event', () => {
      const payload: RealtimePostgresChangesPayload<any> = {
        eventType: 'INSERT',
        new: { id: '1', name: 'Test Board' },
        old: {},
        schema: 'public',
        table: 'boards',
        commit_timestamp: new Date().toISOString(),
        errors: []
      }

      const result = getChangedRecord(payload)
      expect(result).toEqual({ id: '1', name: 'Test Board' })
    })

    it('should return new record for UPDATE event', () => {
      const payload: RealtimePostgresChangesPayload<any> = {
        eventType: 'UPDATE',
        new: { id: '1', name: 'Updated Board' },
        old: { id: '1', name: 'Test Board' },
        schema: 'public',
        table: 'boards',
        commit_timestamp: new Date().toISOString(),
        errors: []
      }

      const result = getChangedRecord(payload)
      expect(result).toEqual({ id: '1', name: 'Updated Board' })
    })

    it('should return old record for DELETE event', () => {
      const payload: RealtimePostgresChangesPayload<any> = {
        eventType: 'DELETE',
        new: {},
        old: { id: '1', name: 'Test Board' },
        schema: 'public',
        table: 'boards',
        commit_timestamp: new Date().toISOString(),
        errors: []
      }

      const result = getChangedRecord(payload)
      expect(result).toEqual({ id: '1', name: 'Test Board' })
    })

    it('should return null for unknown event type', () => {
      const payload: RealtimePostgresChangesPayload<any> = {
        eventType: 'UNKNOWN' as any,
        new: { id: '1', name: 'Test Board' },
        old: {},
        schema: 'public',
        table: 'boards',
        commit_timestamp: new Date().toISOString(),
        errors: []
      }

      const result = getChangedRecord(payload)
      expect(result).toBeNull()
    })
  })

  describe('wasColumnUpdated', () => {
    it('should return true when column value changed', () => {
      const payload: RealtimePostgresChangesPayload<any> = {
        eventType: 'UPDATE',
        new: { id: '1', name: 'Updated Board', description: 'Same description' },
        old: { id: '1', name: 'Test Board', description: 'Same description' },
        schema: 'public',
        table: 'boards',
        commit_timestamp: new Date().toISOString(),
        errors: []
      }

      expect(wasColumnUpdated(payload, 'name')).toBe(true)
      expect(wasColumnUpdated(payload, 'description')).toBe(false)
    })

    it('should return false for non-UPDATE events', () => {
      const payload: RealtimePostgresChangesPayload<any> = {
        eventType: 'INSERT',
        new: { id: '1', name: 'Test Board' },
        old: {},
        schema: 'public',
        table: 'boards',
        commit_timestamp: new Date().toISOString(),
        errors: []
      }

      expect(wasColumnUpdated(payload, 'name')).toBe(false)
    })

    it('should handle null/undefined values', () => {
      const payload: RealtimePostgresChangesPayload<any> = {
        eventType: 'UPDATE',
        new: { id: '1', name: 'Test Board', description: null },
        old: { id: '1', name: 'Test Board', description: 'Old description' },
        schema: 'public',
        table: 'boards',
        commit_timestamp: new Date().toISOString(),
        errors: []
      }

      expect(wasColumnUpdated(payload, 'description')).toBe(true)
    })
  })
})