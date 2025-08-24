import { useState } from 'react'
import { Plus, MoreHorizontal } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { List } from '@/components/list'
import { Task } from '@/components/task'
import { useLists } from '@/hooks/useLists'
import { useBoardRealtime } from '@/hooks/useRealtime'
import { api } from '@/lib/api'
import type { Board as BoardType, Task as TaskType } from '@/types'
import { cn } from '@/utils/classNames'

interface BoardProps {
  board: BoardType
  className?: string
}

export function Board({ board, className }: BoardProps) {
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [activeTask, setActiveTask] = useState<TaskType | null>(null)

  // Fetch lists for this board
  const {
    lists,
    loading: listsLoading,
    error: listsError,
    createList,
    updateList,
    deleteList,
    fetchLists
  } = useLists(board.id)

  // Subscribe to real-time updates for this board
  useBoardRealtime(board.id, {
    onListChange: (payload) => {
      console.log('Real-time list change:', payload)
      // Refetch lists to get the latest data
      fetchLists()
    },
    onTaskChange: (payload) => {
      console.log('Real-time task change:', payload)
      // Refetch lists to get the latest tasks
      fetchLists()
    }
  })

  // For moving tasks between lists, we'll use API directly since we need cross-list operations
  const moveTaskBetweenLists = async (taskId: string, targetListId: string, position: number) => {
    try {
      console.log('Moving task', taskId, 'to list', targetListId, 'at position', position)
      
      await api.moveTask(taskId, {
        listId: targetListId,
        position: position
      })
      
      console.log('Task moved successfully')
      
      // Immediately refresh the UI to show the change
      await fetchLists()
      
      // Note: Real-time updates will also trigger for other users
    } catch (error) {
      console.error('Failed to move task:', error)
      // TODO: Show user-friendly error notification
    }
  }

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )


  const handleCreateList = async () => {
    if (!newListName.trim()) return

    setIsCreatingList(true)
    try {
      const result = await createList({
        name: newListName.trim(),
        boardId: board.id,
        position: lists.length
      })

      if (result.success) {
        setNewListName('')
        setIsCreateListModalOpen(false)
      }
    } catch (error) {
      console.error('Failed to create list:', error)
    } finally {
      setIsCreatingList(false)
    }
  }

  const handleCancelCreate = () => {
    setNewListName('')
    setIsCreateListModalOpen(false)
  }

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    
    if (active.data.current?.type === 'task') {
      setActiveTask(active.data.current.task)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    
    if (!over) return
    
    const activeId = active.id
    const overId = over.id
    
    if (activeId === overId) return
    
    const activeType = active.data.current?.type
    const overType = over.data.current?.type
    
    // Handle task over task (reordering within list or moving between lists)
    if (activeType === 'task' && overType === 'task') {
      const activeTask = active.data.current?.task
      const overTask = over.data.current?.task
      
      if (activeTask?.list_id !== overTask?.list_id) {
        // Moving between lists - we'll handle this in dragEnd
        return
      }
    }
    
    // Handle task over list (moving to empty list or end of list)
    if (activeType === 'task' && overType === 'list') {
      // We'll handle this in dragEnd
      return
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveTask(null)
    
    if (!over) return
    
    const activeType = active.data.current?.type
    const overType = over.data.current?.type
    
    // Handle task dropping
    if (activeType === 'task') {
      const activeTask = active.data.current?.task
      
      if (overType === 'task') {
        const overTask = over.data.current?.task
        
        // Move task to different list or reorder within same list
        if (activeTask && overTask) {
          // Calculate the correct position
          let newPosition = overTask.position
          
          // If moving to the same list and dragging downward, insert after the target
          if (activeTask.list_id === overTask.list_id && activeTask.position < overTask.position) {
            newPosition = overTask.position + 1
          }
          
          moveTaskBetweenLists(activeTask.id, overTask.list_id, newPosition)
        }
      } else if (overType === 'list') {
        const overListId = over.data.current?.list?.id
        
        // Move task to end of list
        if (activeTask && overListId) {
          // Only move if it's a different list or we want to move to end of same list
          const targetList = lists.find(list => list.id === overListId)
          if (targetList) {
            // Get tasks count for this list to position at the end
            // For now, use a large number to ensure it goes to the end
            moveTaskBetweenLists(activeTask.id, overListId, 999)
          }
        }
      }
    }
  }

  if (listsLoading) {
    return (
      <div className={cn(
        "flex-1 flex items-center justify-center",
        "bg-gradient-to-br from-blue-50 to-indigo-100",
        className
      )}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading board...</p>
        </div>
      </div>
    )
  }

  if (listsError) {
    return (
      <div className={cn(
        "flex-1 flex items-center justify-center",
        "bg-gradient-to-br from-red-50 to-pink-100",
        className
      )}>
        <div className="text-center">
          <p className="text-red-600 font-medium mb-2">Failed to load board</p>
          <p className="text-gray-600 text-sm">{listsError}</p>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={cn(
        "flex-1 overflow-hidden",
        "bg-gradient-to-br from-blue-50 to-indigo-100",
        className
      )}>
        {/* Board Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{board.name}</h1>
              {board.description && (
                <p className="text-gray-600 mt-1">{board.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="gap-2"
              >
                <MoreHorizontal className="w-4 h-4" />
                Board Menu
              </Button>
            </div>
          </div>
        </div>

        {/* Lists Container */}
        <div className="flex-1 overflow-x-auto">
          <SortableContext
            items={lists.map(list => list.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-6 p-6 min-h-full min-w-max">
              {/* Existing Lists */}
              {lists.map((list) => (
                <List
                  key={list.id}
                  list={list}
                  onUpdateList={updateList}
                  onDeleteList={deleteList}
                />
              ))}

              {/* Add List Button */}
              <div className="flex-shrink-0">
                <Button
                  variant="secondary"
                  onClick={() => setIsCreateListModalOpen(true)}
                  className="h-fit w-72 justify-start gap-2 bg-white/80 hover:bg-white"
                >
                  <Plus className="w-4 h-4" />
                  Add a list
                </Button>
              </div>
            </div>
          </SortableContext>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask ? (
          <Task task={activeTask} />
        ) : null}
      </DragOverlay>

      {/* Create List Modal */}
      <Modal
        isOpen={isCreateListModalOpen}
        onClose={handleCancelCreate}
        title="Create New List"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="listName" className="block text-sm font-medium text-gray-700 mb-2">
              List Name
            </label>
            <Input
              id="listName"
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Enter list name..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isCreatingList) {
                  handleCreateList()
                } else if (e.key === 'Escape') {
                  handleCancelCreate()
                }
              }}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={handleCancelCreate}
              disabled={isCreatingList}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateList}
              disabled={!newListName.trim() || isCreatingList}
              loading={isCreatingList}
            >
              Create List
            </Button>
          </div>
        </div>
      </Modal>
    </DndContext>
  )
}

