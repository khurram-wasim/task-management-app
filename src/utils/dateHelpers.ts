import { format, isToday, isTomorrow, isYesterday, parseISO, isPast } from 'date-fns'

/**
 * Format a date for display in the UI
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (isToday(dateObj)) {
    return 'Today'
  }
  
  if (isTomorrow(dateObj)) {
    return 'Tomorrow'
  }
  
  if (isYesterday(dateObj)) {
    return 'Yesterday'
  }

  return format(dateObj, 'MMM d, yyyy')
}

/**
 * Format a date for form inputs (YYYY-MM-DD)
 */
export const formatDateForInput = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'yyyy-MM-dd')
}

/**
 * Check if a due date is overdue
 */
export const isOverdue = (dueDate: Date | string): boolean => {
  const dateObj = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate
  return isPast(dateObj) && !isToday(dateObj)
}

/**
 * Get days until due date
 */
export const getDaysUntilDue = (dueDate: Date | string): number => {
  const dateObj = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate
  const today = new Date()
  const diffTime = dateObj.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}