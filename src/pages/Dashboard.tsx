import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useBoards } from '@/hooks/useBoards'
import { DashboardLayout } from '@/components/layout'
import { BoardList, CreateBoardModal, EditBoardModal, ShareBoardModal } from '@/components/board'
import type { BoardWithStats, CreateBoardForm, UpdateBoardForm, AddCollaboratorRequest } from '@/types'

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const {
    boards,
    loading,
    error,
    hasMore,
    createBoard,
    updateBoard,
    deleteBoard,
    addCollaborator,
    loadMore,
    searchBoards,
    refresh
  } = useBoards()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedBoard, setSelectedBoard] = useState<BoardWithStats | null>(null)

  const handleCreateBoard = () => {
    setShowCreateModal(true)
  }

  const handleCreateBoardSubmit = async (formData: CreateBoardForm) => {
    const result = await createBoard(formData)
    if (result.success) {
      setShowCreateModal(false)
    }
    return result
  }

  const handleViewBoard = (board: BoardWithStats) => {
    navigate(`/board/${board.id}`)
  }

  const handleEditBoard = (board: BoardWithStats) => {
    setSelectedBoard(board)
    setShowEditModal(true)
  }

  const handleEditBoardSubmit = async (boardId: string, formData: UpdateBoardForm) => {
    const result = await updateBoard(boardId, formData)
    if (result.success) {
      setShowEditModal(false)
      setSelectedBoard(null)
    }
    return result
  }

  const handleDeleteBoard = async (board: BoardWithStats) => {
    const result = await deleteBoard(board.id)
    if (result.success) {
      console.log('Board deleted successfully')
    }
  }

  const handleShareBoard = (board: BoardWithStats) => {
    setSelectedBoard(board)
    setShowShareModal(true)
  }

  const handleShareBoardSubmit = async (boardId: string, collaboratorData: AddCollaboratorRequest) => {
    const result = await addCollaborator(boardId, collaboratorData)
    if (result.success) {
      setShowShareModal(false)
      setSelectedBoard(null)
    }
    return result
  }

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle={`Welcome back, ${user?.user_metadata?.full_name || user?.email}!`}
    >
      <div className="space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
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
                  {boards.reduce((sum, board) => sum + board.tasks_count, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Collaborators</p>
                <p className="text-2xl font-bold text-gray-900">
                  {boards.reduce((sum, board) => sum + board.collaborators_count, 0)}
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

        {/* Boards List */}
        <div>
          <BoardList
            boards={boards}
            loading={loading}
            error={error}
            hasMore={hasMore}
            onBoardClick={handleViewBoard}
            onEditBoard={handleEditBoard}
            onDeleteBoard={handleDeleteBoard}
            onShareBoard={handleShareBoard}
            onCreateBoard={handleCreateBoard}
            onLoadMore={loadMore}
            onSearch={searchBoards}
            onRefresh={refresh}
          />
        </div>

        {/* Create Board Modal */}
        <CreateBoardModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateBoardSubmit}
          loading={loading}
        />

        {/* Edit Board Modal */}
        <EditBoardModal
          isOpen={showEditModal}
          board={selectedBoard}
          onClose={() => {
            setShowEditModal(false)
            setSelectedBoard(null)
          }}
          onSubmit={handleEditBoardSubmit}
          loading={loading}
        />

        {/* Share Board Modal */}
        <ShareBoardModal
          isOpen={showShareModal}
          board={selectedBoard}
          onClose={() => {
            setShowShareModal(false)
            setSelectedBoard(null)
          }}
          onSubmit={handleShareBoardSubmit}
          loading={loading}
        />
      </div>
    </DashboardLayout>
  )
}