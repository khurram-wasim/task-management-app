import { useState } from 'react'
import { Modal, ModalActions } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { BoardWithStats, AddCollaboratorRequest } from '@/types'

interface ShareBoardForm {
  email: string
  role: 'member' | 'admin'
}

interface ShareBoardModalProps {
  isOpen: boolean
  board: BoardWithStats | null
  onClose: () => void
  onSubmit: (boardId: string, collaboratorData: AddCollaboratorRequest) => Promise<{ success: boolean; error?: string }>
  loading?: boolean
}

export function ShareBoardModal({
  isOpen,
  board,
  onClose,
  onSubmit,
  loading = false
}: ShareBoardModalProps) {
  const [formData, setFormData] = useState<ShareBoardForm>({
    email: '',
    role: 'member'
  })
  const [submitLoading, setSubmitLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<ShareBoardForm>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!board) return

    // Validate form
    const newErrors: Partial<ShareBoardForm> = {}
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSubmitLoading(true)
    setErrors({})

    try {
      const result = await onSubmit(board.id, {
        email: formData.email.trim().toLowerCase(),
        role: formData.role
      })

      if (result.success) {
        // Reset form and close modal
        setFormData({ email: '', role: 'member' })
        onClose()
      } else {
        // Handle API errors
        if (result.error?.includes('already a collaborator')) {
          setErrors({ email: 'This user is already a collaborator on this board' })
        } else if (result.error?.includes('User not found')) {
          setErrors({ email: 'No user found with this email address. They must register first.' })
        } else {
          setErrors({ email: result.error || 'Failed to add collaborator' })
        }
      }
    } catch (error) {
      console.error('Error adding collaborator:', error)
      setErrors({ email: 'An unexpected error occurred' })
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ email: '', role: 'member' })
    setErrors({})
    onClose()
  }

  const isFormValid = formData.email.trim() !== '' && !Object.keys(errors).length
  const isLoading = loading || submitLoading

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Share "${board?.name}"`}
      size="md"
      actions={
        <ModalActions>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="share-board-form"
            disabled={!isFormValid || isLoading}
            loading={isLoading}
          >
            Add Collaborator
          </Button>
        </ModalActions>
      }
    >
      <form id="share-board-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, email: e.target.value }))
              if (errors.email) {
                setErrors(prev => ({ ...prev, email: undefined }))
              }
            }}
            placeholder="Enter collaborator's email address"
            error={errors.email}
            disabled={isLoading}
            autoFocus
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter the email address of the person you want to invite. They must already have an account.
          </p>
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            id="role"
            value={formData.role}
            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'member' | 'admin' }))}
            disabled={isLoading}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {formData.role === 'admin' 
              ? 'Admins can manage board settings and add/remove other collaborators.'
              : 'Members can create and edit lists and tasks on this board.'
            }
          </p>
        </div>
      </form>
    </Modal>
  )
}