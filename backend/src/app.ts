import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { config } from 'dotenv'
import routes from './routes'
import { errorHandler } from './middlewares/errorHandler'
import { ApiResponse } from './types'

config()

const app: Application = express()

// Trust proxy to allow express-rate-limit to read client IPs behind Render's load balancer
app.set('trust proxy', 1)

// Security Middleware
app.use(helmet())

// CORS Configuration
const corsOriginEnv = process.env.CORS_ORIGIN;
if (!corsOriginEnv) throw new Error('CORS_ORIGIN environment variable is required');

// Support comma-separated list of origins (e.g. "https://example.com,http://localhost:5173")
const allowedOrigins = corsOriginEnv.split(',').map((o) => o.trim())

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed`))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie'],
}
app.use(cors(corsOptions))

// Cookie Parser - Essential for httpOnly cookies
app.use(cookieParser())

// Body Parser Middleware
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

// Health Check Endpoint
app.get('/health', (_req: Request, res: Response<ApiResponse>) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
  })
})

// API Routes
app.use('/api', routes)

// 404 Handler
app.use((_req: Request, res: Response<ApiResponse>) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  })
})

// Global Error Handler
app.use(errorHandler)

export default app
