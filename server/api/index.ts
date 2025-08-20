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

// Basic API routes placeholder
app.get('/api/health', (_req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'API endpoint is working'
  })
})

// Temporary auth endpoint for testing
app.post('/api/auth/login', (req, res) => {
  res.status(501).json({ 
    error: 'Authentication not yet configured',
    message: 'Please set up environment variables',
    timestamp: new Date().toISOString()
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.originalUrl,
    message: 'The requested endpoint does not exist'
  })
})

// Error handler
app.use((error: any, req: any, res: any, next: any) => {
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