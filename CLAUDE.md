# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack Task Management Application (Trello clone) built with React + TypeScript frontend, Node.js + Express backend, and Supabase as the database. The project is in active development with authentication, core data models, and testing infrastructure already implemented.

## Development Commands

### Frontend (React App)
- `npm run dev` - Start development server with hot module replacement
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint for code quality checks
- `npm test` - Run Vitest tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:ui` - Run tests with UI interface

### Backend (server/ directory)
- `npm run dev` - Start backend development server with tsx watch
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start production server from compiled JS
- `npm test` - Run backend tests with Vitest
- `npm run test:watch` - Run backend tests in watch mode
- `npm run lint` - Run ESLint on backend code
- `npm run typecheck` - Run TypeScript type checking without emitting files

## Architecture Overview

### Full-Stack Architecture
The application uses a **client-server architecture** with:
- **Frontend**: React SPA that communicates with backend API
- **Backend**: Node.js Express server handling API routes and business logic
- **Database**: Supabase PostgreSQL with Row Level Security
- **Real-time**: Supabase Realtime for live collaboration features

### Project Structure
```
/
├── src/                    # Frontend React application
│   ├── components/         # UI components (auth/, ui/, layout/)
│   ├── contexts/          # React Context providers (AuthContext)
│   ├── hooks/             # Custom hooks (useAuth, useRealtime)
│   ├── lib/               # Third-party integrations (supabase, auth, realtime)
│   ├── types/             # TypeScript definitions for entities
│   └── utils/             # Utility functions (classNames, dateHelpers)
│
├── server/                # Backend Node.js application
│   ├── src/
│   │   ├── config/        # Database and environment configuration
│   │   ├── controllers/   # Route handlers (planned)
│   │   ├── middleware/    # Auth, security, error handling
│   │   ├── routes/        # API route definitions (auth, boards)
│   │   ├── services/      # Business logic (auth, database operations)
│   │   └── types/         # Backend TypeScript types
│
└── tasks/                 # Development task tracking and PRD documentation
```

## Key Technology Decisions

### Frontend Stack
- **React 19.1.1** with functional components and hooks
- **TypeScript** with strict mode and path mapping (`@/` aliases)
- **Vite** for fast development and optimized builds
- **@dnd-kit** for drag and drop functionality
- **Vitest + React Testing Library** for comprehensive testing
- **date-fns** for date manipulation, **clsx** for conditional classes

### Backend Stack  
- **Node.js 18+** with **Express.js** framework
- **TypeScript** with strict configuration
- **Supabase client** for database operations
- **JWT + bcrypt** for authentication
- **Helmet + CORS + Rate limiting** for security
- **WebSockets (ws)** for real-time features

### Database Design
Supabase PostgreSQL schema with these core entities:
- **users** (managed by Supabase Auth)
- **boards** (user-owned with collaborators)
- **lists** (ordered within boards)  
- **tasks** (ordered within lists with labels)
- **board_collaborators** (many-to-many user-board relationship)
- **task_labels** (flexible labeling system)

## Path Mapping and Import Conventions

The project uses path mapping for clean imports:
```typescript
// Instead of relative imports:
import { cn } from '../../../utils/classNames'

// Use absolute imports with @ alias:
import { cn } from '@/utils/classNames'
import { supabase } from '@/lib/supabase'
import { AuthContext } from '@/contexts/AuthContext'
```

Available path aliases:
- `@/*` → `src/*`
- `@/components/*` → `src/components/*`
- `@/pages/*` → `src/pages/*`
- `@/hooks/*` → `src/hooks/*`
- `@/utils/*` → `src/utils/*`
- `@/types/*` → `src/types/*`
- `@/lib/*` → `src/lib/*`
- `@/contexts/*` → `src/contexts/*`

## Authentication Architecture

The app uses **Supabase Auth** with a custom backend layer:
- **Frontend**: AuthContext provides user state and auth methods
- **Backend**: Auth middleware validates JWT tokens for protected routes
- **Database**: RLS policies secure data access per user
- **Flow**: Frontend → Backend API → Supabase (with user context)

Key files:
- `src/contexts/AuthContext.tsx` - React authentication context
- `src/hooks/useAuth.ts` - Authentication hook
- `src/lib/auth.ts` - Auth utilities and Supabase integration
- `server/src/services/auth.service.ts` - Backend auth logic
- `server/src/middleware/auth.ts` - JWT validation middleware

## Real-time Features

Real-time collaboration uses **Supabase Realtime**:
- `src/lib/realtime.ts` - Realtime subscription utilities
- `src/hooks/useRealtime.ts` - Hooks for subscribing to changes
- Subscriptions for boards, lists, and tasks tables
- Optimistic updates for better UX

## Testing Strategy

**Frontend Testing:**
- **Vitest** as test runner with jsdom environment
- **React Testing Library** for component testing
- **@testing-library/jest-dom** matchers
- Tests co-located with components (`.test.tsx` files)
- Setup file: `src/test/setup.ts`

**Backend Testing:**
- **Vitest** for unit and integration tests
- Database service and auth service testing
- Environment-specific test configuration

## Development Workflow

### Initial Setup
1. `npm install` in root (frontend dependencies)
2. `cd server && npm install` (backend dependencies) 
3. Set up `.env.local` with Supabase credentials
4. Set up `server/.env` with backend environment variables

### Working with the Codebase
1. **Use TypeScript types** - All entities are strongly typed in `src/types/index.ts`
2. **Follow path mapping** - Use `@/` imports instead of relative paths
3. **Test-driven development** - Write tests alongside implementation
4. **Supabase MCP integration** - Use MCP tools for database operations when available
5. **Real-time first** - Consider real-time implications for all data changes

### Code Quality Standards
- **TypeScript strict mode** enabled with comprehensive type checking
- **ESLint** configured for React and backend patterns
- **Vitest** for fast unit and integration testing
- **Co-location** - Keep tests next to the code they test

## Current Implementation Status

**Completed:**
- ✅ Project setup and dependencies (React, Node.js, Supabase)
- ✅ TypeScript configuration with path mapping
- ✅ Testing infrastructure (Vitest + React Testing Library)
- ✅ Database schema and Row Level Security policies
- ✅ Authentication system (frontend + backend)
- ✅ Real-time utilities and hooks
- ✅ Basic utility functions and helpers
- ✅ Backend API architecture with auth routes

**In Progress:**
- 🚧 Backend API routes (boards completed, lists/tasks pending)
- 🚧 Frontend-backend integration
- 🚧 Core UI components

**Next Priority:**
- List and Task API routes
- Board management UI components  
- Drag and drop implementation
- Real-time collaboration features