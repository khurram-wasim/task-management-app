import { useState } from 'react'
import { Modal, ModalActions } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import type { CreateBoardForm } from '@/types'

interface CreateBoardModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateBoardForm) => Promise<{ success: boolean; error?: string }>
  loading?: boolean
}

export function CreateBoardModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false
}: CreateBoardModalProps) {
  const [formData, setFormData] = useState<CreateBoardForm>({
    name: '',
    description: ''
  })
  const [errors, setErrors] = useState<Partial<CreateBoardForm>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: keyof CreateBoardForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateBoardForm> = {}

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

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      const result = await onSubmit({
        name: formData.name.trim(),
        description: formData.description?.trim() || ''
      })

      if (result.success) {
        handleClose()
      } else {
        // Handle server-side errors
        if (result.error) {
          setErrors({ name: result.error })
        }
      }
    } catch (error) {
      console.error('Failed to create board:', error)
      setErrors({ name: 'Failed to create board. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitting) return // Prevent closing during submission
    
    // Reset form data and errors
    setFormData({ name: '', description: '' })
    setErrors({})
    setIsSubmitting(false)
    onClose()
  }

  const isFormDisabled = loading || isSubmitting

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Board"
      size="md"
      closeOnOverlayClick={!isSubmitting}
      closeOnEsc={!isSubmitting}
      actions={
        <ModalActions>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isFormDisabled}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-board-form"
            loading={isSubmitting}
            disabled={isFormDisabled || !formData.name.trim()}
          >
            Create Board
          </Button>
        </ModalActions>
      }
    >
      <form id="create-board-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Board Name"
          placeholder="Enter board name..."
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          error={errors.name}
          disabled={isFormDisabled}
          autoFocus
          required
          maxLength={100}
        />

        <Textarea
          label="Description (Optional)"
          placeholder="Enter board description..."
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          error={errors.description}
          disabled={isFormDisabled}
          rows={3}
          maxLength={500}
          helperText={`${formData.description?.length || 0}/500 characters`}
        />
      </form>
    </Modal>
  )
}