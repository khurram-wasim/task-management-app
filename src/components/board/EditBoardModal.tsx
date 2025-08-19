import { useState, useEffect } from 'react'
import { Modal, ModalActions } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import type { BoardWithStats, UpdateBoardForm } from '@/types'

interface EditBoardModalProps {
  isOpen: boolean
  board: BoardWithStats | null
  onClose: () => void
  onSubmit: (boardId: string, data: UpdateBoardForm) => Promise<{ success: boolean; error?: string }>
  loading?: boolean
}

export function EditBoardModal({
  isOpen,
  board,
  onClose,
  onSubmit,
  loading = false
}: EditBoardModalProps) {
  const [formData, setFormData] = useState<UpdateBoardForm>({
    name: '',
    description: ''
  })
  const [errors, setErrors] = useState<Partial<UpdateBoardForm>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form data when board changes
  useEffect(() => {
    if (board) {
      setFormData({
        name: board.name,
        description: board.description || ''
      })
      setErrors({})
    }
  }, [board])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '', description: '' })
      setErrors({})
      setIsSubmitting(false)
    }
  }, [isOpen])

  const handleInputChange = (field: keyof UpdateBoardForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<UpdateBoardForm> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Board name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Board name must be at least 2 characters'
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Board name must be less than 100 characters'
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!board || !validateForm() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const result = await onSubmit(board.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      })

      if (result.success) {
        onClose()
      } else if (result.error) {
        // Show API error
        setErrors({ name: result.error })
      }
    } catch (error) {
      setErrors({ name: 'An unexpected error occurred' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormChanged = board && (
    formData.name.trim() !== board.name ||
    (formData.description || '').trim() !== (board.description || '')
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Board"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Board Name */}
          <div>
            <label htmlFor="boardName" className="block text-sm font-medium text-gray-700 mb-2">
              Board Name
            </label>
            <Input
              id="boardName"
              type="text"
              placeholder="Enter board name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={errors.name}
              disabled={isSubmitting || loading}
              autoFocus
              maxLength={100}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Board Description */}
          <div>
            <label htmlFor="boardDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <Textarea
              id="boardDescription"
              placeholder="Enter board description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              error={errors.description}
              disabled={isSubmitting || loading}
              rows={3}
              maxLength={500}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/500 characters
            </p>
          </div>
        </div>

        <ModalActions>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || loading || !formData.name.trim() || !isFormChanged}
            loading={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Board'}
          </Button>
        </ModalActions>
      </form>
    </Modal>
  )
}