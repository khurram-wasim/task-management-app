import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, cleanup } from '@testing-library/react'
import { useRealtimeSubscription, useBoardRealtime } from './useRealtime'

// Mock the realtime module
vi.mock('@/lib/realtime', () => ({
  subscribeToTable: vi.fn(),
  subscribeToBoardChanges: vi.fn(),
  subscribeToListChanges: vi.fn(),
  subscribeToTaskChanges: vi.fn(),
}))

describe('useRealtime hooks', () => {
  const mockUnsubscribe = vi.fn()
  const mockSubscription = { unsubscribe: mockUnsubscribe }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('useRealtimeSubscription', () => {
    it('should subscribe to table on mount', async () => {
      const { subscribeToTable } = await import('@/lib/realtime')
      vi.mocked(subscribeToTable).mockReturnValue(mockSubscription)

      const callback = vi.fn()
      renderHook(() => useRealtimeSubscription('boards', callback, 'id=eq.1'))

      expect(subscribeToTable).toHaveBeenCalledWith('boards', callback, 'id=eq.1')
    })

    it('should unsubscribe on unmount', async () => {
      const { subscribeToTable } = await import('@/lib/realtime')
      vi.mocked(subscribeToTable).mockReturnValue(mockSubscription)

      const callback = vi.fn()
      const { unmount } = renderHook(() => useRealtimeSubscription('boards', callback))

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })

    it('should return unsubscribe function', async () => {
      const { subscribeToTable } = await import('@/lib/realtime')
      vi.mocked(subscribeToTable).mockReturnValue(mockSubscription)

      const callback = vi.fn()
      const { result } = renderHook(() => useRealtimeSubscription('boards', callback))

      // Call the returned unsubscribe function
      result.current()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })

  describe('useBoardRealtime', () => {
    it('should subscribe when boardId is provided', async () => {
      const { subscribeToBoardChanges } = await import('@/lib/realtime')
      vi.mocked(subscribeToBoardChanges).mockReturnValue(mockSubscription)

      const callbacks = {
        onBoardChange: vi.fn(),
        onListChange: vi.fn(),
      }

      renderHook(() => useBoardRealtime('board-123', callbacks))

      expect(subscribeToBoardChanges).toHaveBeenCalledWith('board-123', callbacks)
    })

    it('should not subscribe when boardId is null', async () => {
      const { subscribeToBoardChanges } = await import('@/lib/realtime')
      vi.mocked(subscribeToBoardChanges).mockReturnValue(mockSubscription)

      const callbacks = {
        onBoardChange: vi.fn(),
      }

      renderHook(() => useBoardRealtime(null, callbacks))

      expect(subscribeToBoardChanges).not.toHaveBeenCalled()
    })

    it('should resubscribe when boardId changes', async () => {
      const { subscribeToBoardChanges } = await import('@/lib/realtime')
      vi.mocked(subscribeToBoardChanges).mockReturnValue(mockSubscription)

      const callbacks = {
        onBoardChange: vi.fn(),
      }

      const { rerender } = renderHook(
        ({ boardId }) => useBoardRealtime(boardId, callbacks),
        { initialProps: { boardId: 'board-1' } }
      )

      expect(subscribeToBoardChanges).toHaveBeenCalledWith('board-1', callbacks)

      // Change boardId
      rerender({ boardId: 'board-2' })

      // Should unsubscribe from old and subscribe to new
      expect(mockUnsubscribe).toHaveBeenCalled()
      expect(subscribeToBoardChanges).toHaveBeenCalledWith('board-2', callbacks)
    })

    it('should unsubscribe on unmount', async () => {
      const { subscribeToBoardChanges } = await import('@/lib/realtime')
      vi.mocked(subscribeToBoardChanges).mockReturnValue(mockSubscription)

      const callbacks = {
        onBoardChange: vi.fn(),
      }

      const { unmount } = renderHook(() => useBoardRealtime('board-123', callbacks))

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })
})