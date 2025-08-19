import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { BoardLayout } from '@/components/layout'
import { Button } from '@/components/ui/Button'

interface Board {
  id: string
  name: string
  description?: string
}

export function BoardView() {
  const { boardId } = useParams<{ boardId: string }>()
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch board data from API
    // For now, mock the data
    setTimeout(() => {
      setBoard({
        id: boardId || '1',
        name: 'Project Board',
        description: 'Track progress on our latest project'
      })
      setLoading(false)
    }, 500)
  }, [boardId])

  const handleInviteMembers = () => {
    // TODO: Implement invite members functionality
    console.log('Invite members clicked')
  }

  const handleBoardSettings = () => {
    // TODO: Implement board settings functionality
    console.log('Board settings clicked')
  }

  if (loading) {
    return (
      <BoardLayout 
        boardTitle="Loading..." 
        boardDescription=""
      >
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </BoardLayout>
    )
  }

  if (!board) {
    return (
      <BoardLayout 
        boardTitle="Board Not Found" 
        boardDescription=""
      >
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Board not found</h3>
          <p className="mt-1 text-gray-500">The board you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </BoardLayout>
    )
  }

  return (
    <BoardLayout 
      boardTitle={board.name} 
      boardDescription={board.description}
      actions={
        <>
          <Button variant="outline" onClick={handleInviteMembers}>
            Invite Members
          </Button>
          <Button variant="outline" onClick={handleBoardSettings}>
            Settings
          </Button>
        </>
      }
    >
      {/* Board content will go here */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 min-h-[500px]">
        {/* TODO List */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-gray-200/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">To Do</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow">
              <h4 className="text-sm font-medium text-gray-900">Design homepage wireframes</h4>
              <p className="text-xs text-gray-500 mt-1">Create initial wireframes for the new homepage layout</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow">
              <h4 className="text-sm font-medium text-gray-900">Set up project repository</h4>
              <p className="text-xs text-gray-500 mt-1">Initialize Git repository and set up initial project structure</p>
            </div>
          </div>
          <button className="w-full mt-4 py-2 px-3 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            + Add a card
          </button>
        </div>

        {/* In Progress List */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-gray-200/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">In Progress</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow">
              <h4 className="text-sm font-medium text-gray-900">Implement user authentication</h4>
              <p className="text-xs text-gray-500 mt-1">Build login and registration functionality</p>
              <div className="flex items-center mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  In Progress
                </span>
              </div>
            </div>
          </div>
          <button className="w-full mt-4 py-2 px-3 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            + Add a card
          </button>
        </div>

        {/* Done List */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-gray-200/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Done</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow">
              <h4 className="text-sm font-medium text-gray-900">Project planning</h4>
              <p className="text-xs text-gray-500 mt-1">Define project scope and requirements</p>
              <div className="flex items-center mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Complete
                </span>
              </div>
            </div>
          </div>
          <button className="w-full mt-4 py-2 px-3 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            + Add a card
          </button>
        </div>

        {/* Add List */}
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer">
          <button className="w-full h-full flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 min-h-[200px]">
            <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-sm font-medium">Add another list</span>
          </button>
        </div>
      </div>
    </BoardLayout>
  )
}