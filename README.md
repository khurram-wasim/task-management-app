# Task Management App (Trello Clone)

A modern React application built with TypeScript, Vite, and Supabase for creating Kanban-style task management boards.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your Supabase credentials
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:ui` - Run tests with UI

## Project Structure

The project uses path mapping for cleaner imports:

```
src/
├── @/components/  # Reusable UI components
├── @/pages/      # Page components
├── @/hooks/      # Custom React hooks
├── @/utils/      # Utility functions
├── @/types/      # TypeScript type definitions
├── @/lib/        # Third-party library configurations
├── @/services/   # API and external services
├── @/contexts/   # React Context providers
└── @/constants/  # Application constants
```

## Path Mapping Examples

Instead of relative imports:
```typescript
import { cn } from '../../../utils/classNames'
import { supabase } from '../../lib/supabase'
```

Use clean absolute imports:
```typescript
import { cn } from '@/utils/classNames'
import { supabase } from '@/lib/supabase'
```

## Technology Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Supabase** for backend and real-time features
- **@dnd-kit** for drag and drop functionality
- **Vitest** with React Testing Library for testing
- **date-fns** for date manipulation
- **clsx** for conditional class names

## Development

This project follows modern React patterns with:
- Functional components and hooks
- TypeScript for type safety
- Comprehensive testing setup
- Path mapping for clean imports
- Environment-based configuration