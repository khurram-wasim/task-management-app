# Task Management API Server

Node.js/Express backend server for the Task Management App (Trello clone).

## Features

- **TypeScript** - Full type safety and modern JavaScript features
- **Express.js** - Fast and minimalist web framework
- **Supabase** - Backend-as-a-Service for database and authentication
- **WebSocket** - Real-time collaboration features
- **Security** - Helmet, CORS, rate limiting, and input validation
- **Testing** - Vitest for unit and integration tests
- **Logging** - Structured logging with different levels
- **Path Mapping** - Clean imports with `@/` prefix

## Project Structure

```
server/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers and business logic
│   ├── middleware/     # Express middleware
│   ├── routes/         # API route definitions
│   ├── services/       # External service integrations
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions and helpers
│   ├── test/           # Test setup and utilities
│   └── index.ts        # Application entry point
├── dist/               # Compiled JavaScript output
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start development server:
```bash
npm run dev
```

The server will start on `http://localhost:3001`

## Environment Variables

```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run typecheck` - Run TypeScript type checking

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout

### Boards
- `GET /api/boards` - Get user boards
- `POST /api/boards` - Create new board
- `GET /api/boards/:id` - Get board details
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board

### Lists
- `GET /api/lists` - Get lists for a board
- `POST /api/lists` - Create new list
- `PUT /api/lists/:id` - Update list
- `DELETE /api/lists/:id` - Delete list

### Tasks
- `GET /api/tasks` - Get tasks for a list/board
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## Real-time Features

The server includes WebSocket support for real-time collaboration:

- Board updates (create, update, delete)
- List changes (create, rename, reorder)
- Task modifications (create, edit, move)
- User activity indicators

## Security Features

- **Helmet** - Security headers
- **CORS** - Cross-origin request handling
- **Rate Limiting** - Prevent abuse
- **Input Validation** - Joi schema validation
- **Authentication** - JWT token-based auth
- **Authorization** - Resource-level permissions

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Development

### Path Mapping

Use clean imports with the `@/` prefix:

```typescript
import { ResponseHelper } from '@/utils'
import { Board } from '@/types'
import { authMiddleware } from '@/middleware'
```

### Logging

Use the structured logger:

```typescript
import { logger } from '@/utils'

logger.info('User created', { userId, email })
logger.error('Database error', error, { operation: 'createBoard' })
```

### Error Handling

Use the standardized response helper:

```typescript
import { ResponseHelper } from '@/utils'

// Success response
return ResponseHelper.success(res, board, 'Board created successfully')

// Error response
return ResponseHelper.badRequest(res, 'Invalid board data')
```

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Set production environment variables

3. Start the server:
```bash
npm start
```

## Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Use the existing code style
4. Update documentation as needed