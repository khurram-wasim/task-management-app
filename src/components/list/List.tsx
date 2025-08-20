import { useState } from 'react'
import { Plus, MoreHorizontal, Edit3, Trash2 } from 'lucide-react'
import {
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Task, TaskModal } from '@/components/task'
import { useTasks } from '@/hooks/useTasks'
import { useLists } from '@/hooks/useLists'
import type { List as ListType } from '@/types'
import { cn } from '@/utils/classNames'

interface ListProps {
  list: ListType
  boardId: string
  className?: string
}

export function List({ list, boardId, className }: ListProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(list.name)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  // Make the list droppable
  const { setNodeRef, isOver } = useDroppable({
    id: list.id,
    data: {
      type: 'list',
      list,
    },
  })

  // Task management for this list
  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    createTask
  } = useTasks(list.id)

  // List management hooks (from board context)
  const { updateList, deleteList } = useLists(boardId)

  const handleSaveName = async () => {
    if (editedName.trim() && editedName !== list.name) {
      const result = await updateList(list.id, { name: editedName.trim() })
      if (result.success) {
        setIsEditingName(false)
      } else {
        setEditedName(list.name) // Reset on error
      }
    } else {
      setEditedName(list.name)
      setIsEditingName(false)
    }
  }

  const handleCancelEditName = () => {
    setEditedName(list.name)
    setIsEditingName(false)
  }

  const handleDeleteList = async () => {
    if (tasks.length > 0) {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${list.name}"? This will also delete all ${tasks.length} tasks in this list.`
      )
      if (!confirmed) return
    }

    const result = await deleteList(list.id)
    if (result.success) {
      setShowMenu(false)
    }
  }

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return

    const result = await createTask({
      title: newTaskTitle.trim(),
      listId: list.id,
      position: tasks.length
    })

    if (result.success) {
      setNewTaskTitle('')
      setIsAddingTask(false)
    }
  }

  const handleCancelAddTask = () => {
    setNewTaskTitle('')
    setIsAddingTask(false)
  }

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-72 bg-gray-100 rounded-lg p-3 h-full max-h-full flex flex-col",
        isOver && "ring-2 ring-blue-400 bg-blue-50",
        className
      )}
    >
      {/* List Header */}
      <div className="flex items-center justify-between mb-3 relative">
        {isEditingName ? (
          <Input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveName()
              } else if (e.key === 'Escape') {
                handleCancelEditName()
              }
            }}
            className="text-sm font-semibold"
            autoFocus
          />
        ) : (
          <h3 
            className="font-semibold text-gray-900 flex-1 cursor-pointer hover:bg-gray-200 px-2 py-1 rounded"
            onClick={() => setIsEditingName(true)}
          >
            {list.name}
          </h3>
        )}

        <div className="relative">
          <button 
            className="p-1 rounded hover:bg-gray-200 text-gray-500"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border py-1 z-10 min-w-36">
              <button
                onClick={() => {
                  setIsEditingName(true)
                  setShowMenu(false)
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                <Edit3 className="w-4 h-4" />
                Rename List
              </button>
              <button
                onClick={handleDeleteList}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
              >
                <Trash2 className="w-4 h-4" />
                Delete List
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tasks Container */}
      <div className="flex-1 space-y-2 overflow-y-auto min-h-0">
        {tasksLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : tasksError ? (
          <div className="text-center py-4">
            <p className="text-red-600 text-sm">Failed to load tasks</p>
            <p className="text-gray-500 text-xs">{tasksError}</p>
          </div>
        ) : (
          <SortableContext
            items={tasks.map(task => task.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <Task 
                key={task.id} 
                task={task} 
                onTaskClick={(taskId) => setSelectedTaskId(taskId)}
              />
            ))}
          </SortableContext>
        )}

        {/* Add Task Form */}
        {isAddingTask ? (
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <Input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Enter a title for this card..."
              className="mb-2"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddTask()
                } else if (e.key === 'Escape') {
                  handleCancelAddTask()
                }
              }}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim()}
              >
                Add card
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancelAddTask}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            onClick={() => setIsAddingTask(true)}
            className="w-full justify-start text-gray-600 hover:bg-gray-200 mt-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add a card
          </Button>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={() => {
          // The useTasks hook should automatically refresh
          // when a task is updated via the API
        }}
        onTaskDeleted={() => {
          setSelectedTaskId(null)
          // The deleteTask function would need to be called here
          // For now, the task will be removed when the list refreshes
        }}
      />

      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  )
}