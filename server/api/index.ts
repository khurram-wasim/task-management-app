import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { env, CONFIG, initializeDatabase } from '../src/config'
import { setupSwagger } from '../src/config/swagger'
import { logger, requestLogger } from '../src/utils'
import { errorHandler, notFoundHandler, timeoutHandler, rateLimitHandler } from '../src/middleware/errorHandler'
import { requestId, httpsRedirect, validateContentType } from '../src/middleware/security'
import apiRoutes from '../src/routes'

const app = express()

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

// 404 handler for undefined routes (must come before global error handler)
app.use('*', notFoundHandler)

// Global error handler (must be last middleware)
app.use(errorHandler)

// Initialize database on cold start
let dbInitialized = false
async function ensureDbInit() {
  if (!dbInitialized) {
    try {
      await initializeDatabase()
      dbInitialized = true
      logger.info('Database initialized for serverless function')
    } catch (error) {
      logger.error('Failed to initialize database', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }
}

// Vercel serverless function handler
export default async (req: any, res: any) => {
  try {
    await ensureDbInit()
    return app(req, res)
  } catch (error) {
    logger.error('Serverless function error', error instanceof Error ? error : new Error(String(error)))
    return res.status(500).json({ error: 'Internal server error' })
  }
}