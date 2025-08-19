import { describe, it, expect } from 'vitest'
import { cn, commonStyles } from './classNames'

describe('classNames', () => {
  describe('cn', () => {
    it('should combine class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
    })

    it('should handle objects', () => {
      expect(cn({
        'active': true,
        'inactive': false,
        'default': true
      })).toBe('active default')
    })

    it('should handle arrays', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3')
    })

    it('should handle duplicate classes', () => {
      // clsx doesn't automatically deduplicate, but that's expected behavior
      expect(cn('duplicate', 'other', 'duplicate')).toBe('duplicate other duplicate')
    })
  })

  describe('commonStyles', () => {
    it('should have button base styles', () => {
      expect(commonStyles.button.base).toContain('inline-flex')
      expect(commonStyles.button.base).toContain('rounded-md')
    })

    it('should have card styles', () => {
      expect(commonStyles.card.base).toContain('rounded-lg')
      expect(commonStyles.card.base).toContain('border')
    })

    it('should have input styles', () => {
      expect(commonStyles.input.base).toContain('rounded-md')
      expect(commonStyles.input.base).toContain('border')
    })

    it('should have status styles', () => {
      expect(commonStyles.status.success).toContain('text-green-600')
      expect(commonStyles.status.error).toContain('text-red-600')
    })
  })
})