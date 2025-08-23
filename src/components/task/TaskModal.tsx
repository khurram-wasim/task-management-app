import { useState, useEffect } from 'react'
import { X, Calendar, Tag, FileText, Trash2, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useTask, useTasks } from '@/hooks/useTasks'
import type { Task, TaskLabel, UpdateTaskRequest } from '@/types'
import { cn } from '@/utils/classNames'

interface TaskModalProps {
  taskId: string | null
  isOpen: boolean
  onClose: () => void
  onTaskUpdated?: (task: Task) => void
  onTaskDeleted?: (taskId: string) => void
}

export function TaskModal({ 
  taskId, 
  isOpen, 
  onClose, 
  onTaskUpdated, 
  onTaskDeleted 
}: TaskModalProps) {
  const { task, loading, error, updateTask, fetchTask } = useTask(taskId)
  const { deleteTask, addTaskLabel, removeTaskLabel } = useTasks(task?.list_id || null)
  
  const [editedTitle, setEditedTitle] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedDueDate, setEditedDueDate] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showAddLabel, setShowAddLabel] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#3b82f6')

  // Update form when task loads
  useEffect(() => {
    if (task) {
      setEditedTitle(task.title)
      setEditedDescription(task.description || '')
      setEditedDueDate(task.due_date ? task.due_date.split('T')[0] : '')
      setHasChanges(false)
    }
  }, [task])

  // Track changes
  useEffect(() => {
    if (task) {
      const titleChanged = editedTitle !== task.title
      const descriptionChanged = editedDescription !== (task.description || '')
      const dueDateChanged = editedDueDate !== (task.due_date ? task.due_date.split('T')[0] : '')
      
      setHasChanges(titleChanged || descriptionChanged || dueDateChanged)
    }
  }, [editedTitle, editedDescription, editedDueDate, task])

  const handleSave = async () => {
    if (!task || !hasChanges) return

    setIsSaving(true)
    try {
      const updates: UpdateTaskRequest = {}
      
      if (editedTitle !== task.title) {
        updates.title = editedTitle.trim()
      }
      
      if (editedDescription !== (task.description || '')) {
        updates.description = editedDescription.trim() || undefined
      }
      
      if (editedDueDate !== (task.due_date ? task.due_date.split('T')[0] : '')) {
        updates.dueDate = editedDueDate ? `${editedDueDate}T23:59:59.999Z` : undefined
      }

      const result = await updateTask(updates)
      if (result.success && result.data) {
        onTaskUpdated?.(result.data)
        setHasChanges(false)
      }
    } catch (error) {
      console.error('Failed to save task:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!task) return

    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"? This action cannot be undone.`
    )
    
    if (confirmed) {
      const result = await deleteTask(task.id)
      if (result.success) {
        onTaskDeleted?.(task.id)
        onClose()
      }
    }
  }

  const handleAddLabel = async () => {
    if (!task || !newLabelName.trim()) return

    const result = await addTaskLabel(task.id, {
      name: newLabelName.trim(),
      color: newLabelColor
    })

    if (result.success) {
      setNewLabelName('')
      setNewLabelColor('#3b82f6')
      setShowAddLabel(false)
      // Refresh the individual task to show the new label in the modal
      await fetchTask()
    }
  }

  const handleRemoveLabel = async (labelId: string) => {
    if (!task) return
    
    const result = await removeTaskLabel(task.id, labelId)
    if (result.success) {
      // Refresh the individual task to show the updated labels in the modal
      await fetchTask()
    }
  }

  const handleClose = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to close without saving?'
      )
      if (!confirmed) return
    }
    setShowAddLabel(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="">
      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 font-medium mb-2">Failed to load task</p>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        ) : task ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-gray-600 mt-1" />
                <div className="flex-1">
                  <Input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-xl font-semibold border-none p-0 bg-transparent focus:bg-white focus:border focus:p-3"
                    placeholder="Task title..."
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Task Labels */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Labels</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setShowAddLabel(!showAddLabel)}
                >
                  Add Label
                </Button>
              </div>
              <div className="ml-6">
                {(task as any).labels && (task as any).labels.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {(task as any).labels.map((label: TaskLabel) => (
                      <div
                        key={label.id}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: `${label.label_color}20`,
                          color: label.label_color,
                          border: `1px solid ${label.label_color}40`
                        }}
                      >
                        {label.label_name}
                        <button
                          onClick={() => handleRemoveLabel(label.id)}
                          className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No labels yet</p>
                )}
                
                {/* Add Label Form */}
                {showAddLabel && (
                  <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="labelName" className="block text-xs font-medium text-gray-700 mb-1">
                          Label Name
                        </label>
                        <Input
                          id="labelName"
                          type="text"
                          value={newLabelName}
                          onChange={(e) => setNewLabelName(e.target.value)}
                          placeholder="Enter label name..."
                          className="text-sm"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label htmlFor="labelColor" className="block text-xs font-medium text-gray-700 mb-1">
                          Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            id="labelColor"
                            type="color"
                            value={newLabelColor}
                            onChange={(e) => setNewLabelColor(e.target.value)}
                            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                          />
                          <div className="flex gap-1">
                            {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'].map((color) => (
                              <button
                                key={color}
                                onClick={() => setNewLabelColor(color)}
                                className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            setShowAddLabel(false)
                            setNewLabelName('')
                            setNewLabelColor('#3b82f6')
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="text-xs"
                          onClick={handleAddLabel}
                          disabled={!newLabelName.trim()}
                        >
                          Add Label
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Description</span>
              </div>
              <div className="ml-6">
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Add a more detailed description..."
                  className={cn(
                    "w-full min-h-24 p-3 border border-gray-300 rounded-lg text-gray-900",
                    "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                    "resize-none"
                  )}
                />
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Due Date</span>
                </div>
                {editedDueDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-red-600 hover:text-red-700"
                    onClick={() => setEditedDueDate('')}
                  >
                    Remove Date
                  </Button>
                )}
              </div>
              <div className="ml-6">
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={editedDueDate}
                    onChange={(e) => setEditedDueDate(e.target.value)}
                    className={cn(
                      "px-3 py-2 border border-gray-300 rounded-lg",
                      "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                      "text-sm"
                    )}
                  />
                  {editedDueDate && (
                    <div className="text-xs text-gray-500">
                      {new Date(editedDueDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  )}
                </div>
                {!editedDueDate && (
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="ghost" 
                      size="sm"
                      className="text-xs"
                      onClick={() => setEditedDueDate(new Date().toISOString().split('T')[0])}
                    >
                      Today
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm" 
                      className="text-xs"
                      onClick={() => {
                        const tomorrow = new Date()
                        tomorrow.setDate(tomorrow.getDate() + 1)
                        setEditedDueDate(tomorrow.toISOString().split('T')[0])
                      }}
                    >
                      Tomorrow
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        const nextWeek = new Date()
                        nextWeek.setDate(nextWeek.getDate() + 7)
                        setEditedDueDate(nextWeek.toISOString().split('T')[0])
                      }}
                    >
                      Next Week
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="secondary"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Task
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || !editedTitle.trim() || isSaving}
                  loading={isSaving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}

// Quick Edit Modal for simple task editing
export function QuickEditTaskModal({
  task,
  isOpen,
  onClose,
  onSave
}: {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onSave: (updates: UpdateTaskRequest) => Promise<void>
}) {
  const [title, setTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
    }
  }, [task])

  const handleSave = async () => {
    if (!title.trim() || !task) return

    setIsSaving(true)
    try {
      await onSave({ title: title.trim() })
      onClose()
    } catch (error) {
      console.error('Failed to save task:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!task) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Task">
      <div className="space-y-4">
        <div>
          <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700 mb-2">
            Task Title
          </label>
          <Input
            id="taskTitle"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isSaving) {
                handleSave()
              } else if (e.key === 'Escape') {
                onClose()
              }
            }}
          />
        </div>
        
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            loading={isSaving}
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  )
}