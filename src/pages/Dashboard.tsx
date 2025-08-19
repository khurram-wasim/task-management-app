import { useAuth } from '@/hooks/useAuth'
import { DashboardLayout } from '@/components/layout'
import { Button, BoardCard } from '@/components/ui'
import { useState } from 'react'

export function Dashboard() {
  const { user } = useAuth()
  const [boards] = useState([
    {
      id: '1',
      title: 'Project Alpha',
      description: 'Main development project for Q1 2024',
      tasksCount: 23,
      listsCount: 4,
      lastUpdated: new Date('2024-01-15')
    },
    {
      id: '2',
      title: 'Marketing Campaign',
      description: 'Social media and content strategy',
      tasksCount: 12,
      listsCount: 3,
      lastUpdated: new Date('2024-01-14')
    },
    {
      id: '3',
      title: 'Design System',
      description: 'UI components and design guidelines',
      tasksCount: 8,
      listsCount: 2,
      lastUpdated: new Date('2024-01-13')
    }
  ])

  const handleCreateBoard = () => {
    // TODO: Implement board creation
    console.log('Create board clicked')
  }

  const handleViewBoard = (boardId: string) => {
    window.location.href = `/board/${boardId}`
  }

  const handleEditBoard = (boardId: string) => {
    // TODO: Implement board editing
    console.log('Edit board:', boardId)
  }

  const handleDeleteBoard = (boardId: string) => {
    // TODO: Implement board deletion
    console.log('Delete board:', boardId)
  }

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle={`Welcome back, ${user?.user_metadata?.full_name || user?.email}!`}
      actions={
        <Button onClick={handleCreateBoard}>
          Create Board
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span className="text-gray-600">
                <span className="font-medium text-gray-900">You</span> completed "Design homepage wireframes" in Project Alpha
              </span>
              <span className="text-gray-400 ml-auto">2 hours ago</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-gray-600">
                <span className="font-medium text-gray-900">Sarah</span> added "Content review" to Marketing Campaign
              </span>
              <span className="text-gray-400 ml-auto">4 hours ago</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
              <span className="text-gray-600">
                <span className="font-medium text-gray-900">Mike</span> moved "Button component" to Done in Design System
              </span>
              <span className="text-gray-400 ml-auto">1 day ago</span>
            </div>
          </div>
        </div>

        {/* Boards Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Boards</h2>
            <span className="text-sm text-gray-500">{boards.length} boards</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <BoardCard
                key={board.id}
                title={board.title}
                description={board.description}
                tasksCount={board.tasksCount}
                listsCount={board.listsCount}
                lastUpdated={board.lastUpdated}
                onClick={() => handleViewBoard(board.id)}
                onEdit={() => handleEditBoard(board.id)}
                onDelete={() => handleDeleteBoard(board.id)}
              />
            ))}
            
            {/* Create Board Card */}
            <div 
              onClick={handleCreateBoard}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-center min-h-[200px]"
            >
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="mt-2 block text-sm font-medium text-gray-900">Create new board</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </div>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Boards</p>
                <p className="text-2xl font-bold text-gray-900">{boards.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {boards.reduce((sum, board) => sum + board.tasksCount, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Active Today</p>
                <p className="text-2xl font-bold text-gray-900">5</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}