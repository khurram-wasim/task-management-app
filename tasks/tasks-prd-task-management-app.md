# Tasks: Task Management App (Trello Clone)

Generated from: `prd-task-management-app.md`

## Relevant Files

- `src/lib/supabase.ts` - Supabase client configuration and initialization ✓
- `.env.local` - Environment variables for Supabase configuration ✓
- `.env.example` - Template for environment variables ✓
- `.gitignore` - Git ignore file including environment variables ✓
- `src/lib/supabase.test.ts` - Unit tests for Supabase configuration
- `src/test/setup.ts` - Vitest test setup with jest-dom matchers ✓
- `src/App.test.tsx` - Example test file demonstrating testing configuration ✓
- `vite.config.ts` - Updated with Vitest configuration and path mapping ✓
- `tsconfig.app.json` - Updated with path mapping for cleaner imports ✓
- `README.md` - Updated project documentation with path mapping examples ✓
- `src/types/index.ts` - TypeScript type definitions for Board, List, Task, User entities ✓
- `src/hooks/useAuth.ts` - Custom hook for authentication state management ✓
- `src/hooks/useAuth.test.ts` - Unit tests for authentication hook (integrated into auth.test.ts) ✓
- `src/lib/auth.ts` - Authentication utilities with Supabase integration ✓
- `src/lib/auth.test.ts` - Unit tests for authentication utilities ✓
- `src/contexts/AuthContext.tsx` - Authentication context provider ✓
- `src/contexts/AuthContext.test.tsx` - Unit tests for authentication context ✓
- `src/components/auth/ProtectedRoute.tsx` - Component for route protection ✓
- `src/lib/realtime.ts` - Realtime utilities for Supabase subscriptions ✓
- `src/lib/realtime.test.ts` - Unit tests for realtime utilities ✓
- `src/hooks/useRealtime.ts` - Custom hooks for realtime subscriptions ✓
- `src/hooks/useRealtime.test.ts` - Unit tests for realtime hooks ✓
- `src/hooks/useBoard.ts` - Custom hook for board operations and real-time updates
- `src/hooks/useBoard.test.ts` - Unit tests for board hook
- `src/contexts/AuthContext.tsx` - Authentication context provider
- `src/contexts/AuthContext.test.tsx` - Unit tests for authentication context
- `src/components/ui/Button.tsx` - Reusable button component
- `src/components/ui/Button.test.tsx` - Unit tests for button component
- `src/components/ui/Modal.tsx` - Reusable modal component
- `src/components/ui/Modal.test.tsx` - Unit tests for modal component
- `src/components/ui/Card.tsx` - Reusable card component
- `src/components/ui/Card.test.tsx` - Unit tests for card component
- `src/components/auth/LoginForm.tsx` - Login form component
- `src/components/auth/LoginForm.test.tsx` - Unit tests for login form
- `src/components/auth/RegisterForm.tsx` - Registration form component
- `src/components/auth/RegisterForm.test.tsx` - Unit tests for registration form
- `src/components/layout/Header.tsx` - Application header with navigation
- `src/components/layout/Header.test.tsx` - Unit tests for header component
- `src/components/layout/Layout.tsx` - Main layout wrapper component
- `src/components/layout/Layout.test.tsx` - Unit tests for layout component
- `src/components/board/BoardCard.tsx` - Individual board card in board list
- `src/components/board/BoardCard.test.tsx` - Unit tests for board card
- `src/components/board/BoardList.tsx` - List of all user boards
- `src/components/board/BoardList.test.tsx` - Unit tests for board list
- `src/components/board/Board.tsx` - Main board view with lists and tasks
- `src/components/board/Board.test.tsx` - Unit tests for board component
- `src/components/list/List.tsx` - Individual list component within board
- `src/components/list/List.test.tsx` - Unit tests for list component
- `src/components/task/Task.tsx` - Individual task card component
- `src/components/task/Task.test.tsx` - Unit tests for task component
- `src/components/task/TaskModal.tsx` - Task details/edit modal
- `src/components/task/TaskModal.test.tsx` - Unit tests for task modal
- `src/pages/Dashboard.tsx` - Main dashboard page showing user boards
- `src/pages/Dashboard.test.tsx` - Unit tests for dashboard page
- `src/pages/BoardView.tsx` - Individual board page with lists and tasks
- `src/pages/BoardView.test.tsx` - Unit tests for board view page
- `src/pages/Login.tsx` - Login page component
- `src/pages/Login.test.tsx` - Unit tests for login page
- `src/pages/Register.tsx` - Registration page component
- `src/pages/Register.test.tsx` - Unit tests for registration page
- `src/utils/dragDrop.ts` - Utility functions for drag and drop operations
- `src/utils/dragDrop.test.ts` - Unit tests for drag and drop utilities
- `src/utils/dateHelpers.ts` - Utility functions for date formatting and manipulation ✓
- `src/utils/dateHelpers.test.ts` - Unit tests for date helpers ✓
- `src/utils/classNames.ts` - Utility for conditional class name joining with clsx ✓
- `src/utils/classNames.test.ts` - Unit tests for class name utilities ✓
- `server/src/services/list.service.ts` - List service for CRUD operations and business logic ✓
- `server/src/routes/list.routes.ts` - List API routes with authentication and validation ✓
- `server/src/services/task.service.ts` - Task service for CRUD operations and label management ✓
- `server/src/routes/task.routes.ts` - Task API routes with move and label endpoints ✓
- `server/src/config/swagger.ts` - Comprehensive OpenAPI 3.0 specification with all endpoints ✓
- `server/src/utils/validation.ts` - Enhanced Joi validation schemas with detailed error messages ✓
- `src/lib/api.ts` - Complete API client for backend communication with auth management ✓
- `src/lib/websocket.ts` - WebSocket client for real-time features with auto-reconnection ✓
- `src/hooks/useBoards.ts` - Board management hook using backend API ✓
- `src/hooks/useLists.ts` - List management hook using backend API ✓
- `src/hooks/useTasks.ts` - Task management hook using backend API ✓
- `supabase/migrations/001_initial_schema.sql` - Initial database schema migration
- `supabase/migrations/002_rls_policies.sql` - Row Level Security policies migration
- `supabase/seed.sql` - Sample data for development and testing
- `src/components/board/CreateBoardModal.tsx` - Modal component for creating new boards ✓
- `src/components/board/EditBoardModal.tsx` - Modal component for editing existing boards ✓
- `src/components/board/ShareBoardModal.tsx` - Modal component for sharing boards with collaborators ✓
- `src/components/ui/Input.tsx` - Reusable input component with error handling ✓
- `server/src/services/board.service.ts` - Backend board service with CRUD operations and collaborator management ✓
- `server/src/routes/board.routes.ts` - Backend board API routes with validation and auth ✓

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npm test` to run tests. The project will need Jest or Vitest configured for testing.
- Database schema and operations will be managed through Supabase MCP server integration for efficient development.
- Real-time subscriptions will be implemented using Supabase's Realtime feature.

## Tasks

- [x] 1.0 Project Setup and Dependencies
  - [x] 1.1 Install and configure Supabase client library (@supabase/supabase-js)
  - [x] 1.2 Install drag and drop library (@dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities)
  - [x] 1.3 Install and configure testing framework (Vitest + @testing-library/react)
  - [x] 1.4 Install additional UI dependencies (date-fns for date handling, clsx for conditional classes)
  - [x] 1.5 Set up environment variables file (.env.local) for Supabase configuration
  - [x] 1.6 Update tsconfig.json with path mapping for cleaner imports

- [x] 2.0 Supabase Backend Configuration
  - [x] 2.1 Create Supabase project and obtain API keys
  - [x] 2.2 Design and create database schema using MCP tools (Users, Boards, Lists, Tasks, Board_Collaborators, Task_Labels)
  - [x] 2.3 Set up Row Level Security (RLS) policies using MCP for data protection
  - [x] 2.4 Configure Supabase authentication settings (email/password)
  - [x] 2.5 Enable Realtime subscriptions for boards, lists, and tasks tables
  - [x] 2.6 Create seed data for development and testing using MCP

- [x] 2.1 Node.js Backend Architecture Setup
  - [x] 2.1.1 Create Express.js server with TypeScript configuration
  - [x] 2.1.2 Set up backend project structure and dependencies
  - [x] 2.1.3 Configure environment variables for backend
  - [x] 2.1.4 Set up Supabase client in backend (move from frontend)
  - [x] 2.1.5 Create authentication middleware for protected routes
  - [x] 2.1.6 Set up error handling middleware and request validation

- [x] 2.2 Backend API Routes Implementation
  - [x] 2.2.1 Create authentication routes (POST /auth/login, /auth/register, /auth/logout)
  - [x] 2.2.2 Create board routes (GET, POST, PUT, DELETE /api/boards)
  - [x] 2.2.3 Create list routes (GET, POST, PUT, DELETE /api/lists)
  - [x] 2.2.4 Create task routes (GET, POST, PUT, DELETE /api/tasks)
  - [x] 2.2.5 Implement real-time WebSocket or Server-Sent Events for live updates
  - [x] 2.2.6 Add API documentation and validation schemas

- [x] 2.3 Frontend Integration with Backend
  - [x] 2.3.1 Create API client utility for backend communication
  - [x] 2.3.2 Update authentication context to use backend API
  - [x] 2.3.3 Update existing Supabase hooks to use backend API
  - [x] 2.3.4 Modify real-time subscriptions to work with backend
  - [x] 2.3.5 Update environment variables for API URL configuration
  - [x] 2.3.6 Test end-to-end authentication and data flow

- [x] 3.0 Authentication System Implementation
  - [x] 3.1 Create TypeScript types for User and authentication states
  - [x] 3.2 Implement AuthContext with login, logout, and user state management
  - [x] 3.3 Create useAuth custom hook for authentication operations
  - [x] 3.4 Build LoginForm component with email/password validation
  - [x] 3.5 Build RegisterForm component with email/password validation
  - [x] 3.6 Create Login and Register page components
  - [x] 3.7 Implement protected route wrapper for authenticated pages
  - [x] 3.8 Add user session persistence and automatic logout handling

- [x] 4.0 Core Component Architecture and UI Foundation
  - [x] 4.1 Create reusable UI components (Button, Modal, Card, Input, Textarea)
  - [x] 4.2 Implement Layout component with Header and main content area
  - [x] 4.3 Create Header component with navigation and user menu
  - [x] 4.4 Set up routing with React Router (Dashboard, BoardView, Login, Register)
  - [x] 4.5 Implement global CSS styles and design system variables
  - [x] 4.6 Create loading and error state components
  - [x] 4.7 Set up responsive design foundations for desktop-first approach

- [x] 5.0 Board Management Features
  - [x] 5.1 Create TypeScript types for Board entity and related operations
  - [x] 5.2 Implement useBoard custom hook for board CRUD operations (leveraging MCP for database operations)
  - [x] 5.3 Build BoardCard component for displaying individual boards
  - [x] 5.4 Create BoardList component for displaying all user boards
  - [x] 5.5 Implement Dashboard page with board creation and management
  - [x] 5.6 Add board creation modal with name and description fields
  - [x] 5.7 Implement board editing functionality (rename, update description)
  - [x] 5.8 Add board deletion with confirmation dialog
  - [x] 5.9 Implement basic board sharing functionality (invite collaborators)

- [x] 6.0 List and Task Management with Drag & Drop
  - [x] 6.1 Create TypeScript types for List and Task entities
  - [x] 6.2 Implement Board component to display individual board with lists
  - [x] 6.3 Create List component with inline editing and task display
  - [x] 6.4 Build Task component with title, description, due date, and labels
  - [x] 6.5 Implement TaskModal for detailed task editing
  - [x] 6.6 Set up @dnd-kit for drag and drop functionality
  - [x] 6.7 Implement drag and drop for tasks between lists
  - [x] 6.8 Add drag and drop for reordering lists within boards
  - [x] 6.9 Create task creation, editing, and deletion functionality
  - [x] 6.10 Implement due date picker and label management for tasks
  - [x] 6.11 Add list creation, renaming, and deletion functionality

- [ ] 7.0 Real-time Collaboration Features
  - [ ] 7.1 Set up Supabase Realtime subscriptions for board changes
  - [ ] 7.2 Implement real-time updates for task creation, editing, and deletion
  - [ ] 7.3 Add real-time updates for list changes (create, rename, delete, reorder)
  - [ ] 7.4 Implement real-time board updates (title, description changes)
  - [ ] 7.5 Add visual indicators for other users currently viewing the board
  - [ ] 7.6 Implement optimistic updates for better user experience
  - [ ] 7.7 Handle real-time subscription cleanup and error states
  - [ ] 7.8 Add conflict resolution for simultaneous edits
  - [ ] 7.9 Test and optimize real-time performance across multiple users