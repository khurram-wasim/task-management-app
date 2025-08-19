import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { env, logConfig, CONFIG, initializeDatabase, closeDatabaseConnections } from '@/config'
import { setupSwagger } from '@/config/swagger'
import { logger, requestLogger } from '@/utils'
import { errorHandler, notFoundHandler, timeoutHandler, rateLimitHandler } from '@/middleware/errorHandler'
import { requestId, httpsRedirect, validateContentType } from '@/middleware/security'
import apiRoutes from '@/routes'
import { realtimeService } from '@/services/realtime.service'

const app = express()
const PORT = env.PORT

// Create HTTP server and WebSocket server for real-time features
const server = createServer(app)
const wss = new WebSocketServer({ server })

// Request ID and HTTPS redirect (security)
app.use(requestId)
app.use(httpsRedirect)

// Request timeout middleware
app.use(timeoutHandler(CONFIG.REQUEST_TIMEOUT || 30000))

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

// Request logging middleware
app.use(requestLogger())

// CORS configuration
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: CONFIG.CORS_MAX_AGE,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: CONFIG.RATE_LIMIT_WINDOW,
  max: CONFIG.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
})
app.use(limiter)

// Body parsing middleware
app.use(compression())
app.use(express.json({ limit: CONFIG.MAX_REQUEST_SIZE }))
app.use(express.urlencoded({ extended: true, limit: CONFIG.MAX_REQUEST_SIZE }))

// Content type validation for API routes (excluding GET requests)
app.use('/api/*', validateContentType(['application/json']))

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV
  })
})

// Setup API documentation
setupSwagger(app)

// Mount API routes
app.use('/api', apiRoutes)

// Initialize realtime service with WebSocket server
realtimeService.setWebSocketServer(wss)

// WebSocket connection handling for real-time features
wss.on('connection', (ws) => {
  realtimeService.handleConnection(ws)
})

// 404 handler for undefined routes (must come before global error handler)
app.use('*', notFoundHandler)

// Global error handler (must be last middleware)
app.use(errorHandler)

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database connection
    await initializeDatabase()
    
    // Start HTTP server
    server.listen(PORT, () => {
      logger.info('Task Management API Server started', {
        port: PORT,
        environment: env.NODE_ENV,
        frontend: env.FRONTEND_URL
      })
      
      console.log(`🚀 Task Management API Server running on port ${PORT}`)
      console.log(`📡 Health check: http://localhost:${PORT}/health`)
      console.log(`🔗 API endpoint: http://localhost:${PORT}/api`)
      console.log(`🌐 WebSocket server running on port ${PORT}`)
      
      // Log environment configuration
      logConfig()
    })
  } catch (error) {
    logger.error('Failed to start server', error instanceof Error ? error : new Error(String(error)))
    process.exit(1)
  }
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    realtimeService.cleanup()
    closeDatabaseConnections()
    logger.info('Server shut down complete')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  server.close(() => {
    realtimeService.cleanup()
    closeDatabaseConnections()
    logger.info('Server shut down complete')
    process.exit(0)
  })
})

// Start the server
startServer()

export default app