# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React application with TypeScript support, built using Vite as the build tool. The project is intended to become a Task Management Application (Trello clone) as outlined in the PRD. Currently it contains the default Vite + React template as a starting point.

## Development Commands

### Core Development
- `npm run dev` - Start development server with hot module replacement
- `npm run build` - Build for production (runs TypeScript compilation + Vite build)
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint for code quality checks

### Missing Commands (To Be Added)
Based on the project requirements, these commands should be added:
- `npm test` - Run tests (Jest/Vitest + React Testing Library)
- `npm run typecheck` - Run TypeScript type checking separately
- `npm run format` - Code formatting with Prettier

## Technology Stack

### Current Stack
- **React 19.1.1** - Latest React with modern hooks and concurrent features
- **TypeScript 5.8.3** - Strict type checking enabled
- **Vite 7.1.2** - Fast build tool and development server
- **ESLint 9.33.0** - Code linting with React-specific rules

### Planned Additions (Per PRD)
- **Supabase** - Backend as a service for database and real-time features
- **Drag & Drop Library** - @dnd-kit or react-dnd for Kanban functionality
- **CSS Framework** - CSS Modules, Styled Components, or Tailwind CSS
- **State Management** - Context API or Redux Toolkit for complex state
- **Testing** - Jest/Vitest + React Testing Library + Cypress for E2E

## Architecture Guidelines

### Current Structure
```
src/
├── App.tsx          # Main application component (currently default template)
├── main.tsx         # React application entry point
├── App.css          # Application styles
├── index.css        # Global styles
├── assets/          # Static assets (images, icons)
└── vite-env.d.ts    # Vite TypeScript declarations
```

### Planned Architecture (Task Management App)
Based on the PRD, the application should be structured as:
```
src/
├── components/      # Reusable UI components (Button, Card, Modal, etc.)
├── pages/          # Page components (Dashboard, Board, etc.)
├── hooks/          # Custom React hooks
├── services/       # API calls and Supabase integration
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── context/        # React Context providers for state management
└── constants/      # Application constants
```

### Key Components to Implement
- **Board Management**: Board list, Board view, Board creation/editing
- **List Management**: Kanban lists with CRUD operations
- **Task Management**: Task cards with drag & drop, labels, due dates
- **Authentication**: Login/register forms with Supabase Auth
- **Real-time Updates**: Supabase Realtime subscriptions for collaboration

## Build Configuration

### Vite Configuration
- Uses `@vitejs/plugin-react` for React support
- Hot Module Replacement enabled
- TypeScript compilation integrated

### TypeScript Configuration
- Project references architecture with separate configs:
  - `tsconfig.app.json` - Application code
  - `tsconfig.node.json` - Node.js/build tools
- Strict type checking recommended for production

### ESLint Configuration
- Modern flat config format
- React Hooks rules enforced
- React Refresh support for development
- TypeScript-aware linting rules

## Development Workflow

### Getting Started
1. `npm install` - Install dependencies
2. `npm run dev` - Start development server
3. Navigate to `http://localhost:5173`

### Code Quality Checks
1. `npm run lint` - Check for linting errors
2. `npm run build` - Verify production build works
3. TypeScript compilation happens during build

### Future Workflow (Post-Setup)
1. Run tests before committing
2. Use Supabase local development environment
3. Test drag & drop functionality across browsers
4. Verify real-time updates work correctly

## Project Requirements Context

This application is being built according to a comprehensive PRD that specifies:
- **Core Features**: Kanban boards, lists, tasks with drag & drop
- **Authentication**: User registration/login with Supabase
- **Real-time Collaboration**: Live updates when multiple users edit boards
- **Data Model**: Users → Boards → Lists → Tasks hierarchy
- **Performance**: Code splitting, lazy loading, optimal bundle size
- **Testing**: 80%+ coverage for critical functionality

The project emphasizes modern React patterns, TypeScript safety, and leveraging AI tools (including Claude with MCP integrations) for accelerated development.

## Immediate Next Steps

1. Set up testing framework (Jest/Vitest + React Testing Library)
2. Configure Prettier for code formatting
3. Integrate Supabase for backend services
4. Implement basic authentication flow
5. Create foundational UI components
6. Set up drag & drop functionality
7. Implement real-time subscriptions