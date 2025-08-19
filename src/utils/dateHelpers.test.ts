import { describe, it, expect } from 'vitest'
import { formatDate, formatDateForInput, getDaysUntilDue } from './dateHelpers'

describe('dateHelpers', () => {
  describe('formatDate', () => {
    it('should return "Today" for today\'s date', () => {
      const today = new Date()
      expect(formatDate(today)).toBe('Today')
    })

    it('should return "Tomorrow" for tomorrow\'s date', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      expect(formatDate(tomorrow)).toBe('Tomorrow')
    })

    it('should return "Yesterday" for yesterday\'s date', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(formatDate(yesterday)).toBe('Yesterday')
    })

    it('should format other dates as "MMM d, yyyy"', () => {
      const date = new Date('2024-06-15')
      expect(formatDate(date)).toBe('Jun 15, 2024')
    })

    it('should handle ISO string input', () => {
      const isoString = '2024-06-15T10:00:00Z'
      expect(formatDate(isoString)).toBe('Jun 15, 2024')
    })
  })

  describe('formatDateForInput', () => {
    it('should format date for HTML input', () => {
      const date = new Date('2024-06-15')
      expect(formatDateForInput(date)).toBe('2024-06-15')
    })

    it('should handle ISO string input', () => {
      const isoString = '2024-06-15T10:00:00Z'
      expect(formatDateForInput(isoString)).toBe('2024-06-15')
    })
  })

  describe('getDaysUntilDue', () => {
    it('should return positive number for future dates', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 3)
      const days = getDaysUntilDue(tomorrow)
      expect(days).toBeGreaterThan(0)
    })

    it('should return negative number for past dates', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 2)
      const days = getDaysUntilDue(yesterday)
      expect(days).toBeLessThan(0)
    })
  })
})