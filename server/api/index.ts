import express from 'express'
import cors from 'cors'
import { VercelRequest, VercelResponse } from '@vercel/node'

const app = express()

// CORS configuration for production - allow all Vercel deployments
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    // Allow localhost for development
    if (origin.startsWith('http://localhost')) {
      return callback(null, true)
    }
    
    // Allow all Vercel deployments for this project
    if (origin.includes('vercel.app') && 
        (origin.includes('react-') || 
         origin.includes('task-management') || 
         origin.includes('khurrams-projects'))) {
      return callback(null, true)
    }
    
    // Allow specific frontend URL if set
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return callback(null, true)
    }
    
    // Reject other origins
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Body parsing middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production',
    message: 'Backend API is running'
  })
})

// Import API routes (now with resolved paths)
try {
  const apiRoutes = require('../dist/routes/index.js').default
  app.use('/api', apiRoutes)
  console.log('✅ API routes loaded successfully')
} catch (error) {
  console.error('❌ Failed to load API routes:', error.message)
  console.error('Full error:', error)
  
  // Fallback health endpoint
  app.get('/api/health', (_req, res) => {
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      message: 'API health check (routes failed to load)',
      error: error.message
    })
  })

  // Return proper error for auth endpoints
  app.all('/api/*', (_req, res) => {
    res.status(503).json({ 
      error: 'Service temporarily unavailable',
      message: `Failed to load routes: ${error.message}`,
      timestamp: new Date().toISOString()
    })
  })
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.originalUrl,
    message: 'The requested endpoint does not exist'
  })
})

// Error handler
app.use((error: any, _req: any, res: any, _next: any) => {
  console.error('API Error:', error)
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: error.message || 'Something went wrong'
  })
})

// Vercel serverless function handler
export default (req: VercelRequest, res: VercelResponse) => {
  return app(req, res)
}