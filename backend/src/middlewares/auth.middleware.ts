import { Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt'
import { AuthenticationError } from './errorHandler'
import { AuthenticatedRequest } from '../types'

/**
 * JWT Authentication Middleware
 * Supports both Authorization Header and Cookie-based authentication
 */
export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    let token: string | undefined

    // Try to get token from Authorization header first
    const authHeader = req.headers.authorization
    if (authHeader) {
      const parts = authHeader.split(' ')
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1]
      }
    }

    // Fallback to cookie
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken
    }

    if (!token) {
      throw new AuthenticationError('No authentication token provided')
    }

    const payload = verifyAccessToken(token)
    req.user = payload

    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Optional Authentication Middleware
 * Allows request to pass through regardless of token presence
 * Attaches user to request if token is valid
 */
export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    let token: string | undefined

    // Try Authorization header first
    const authHeader = req.headers.authorization
    if (authHeader) {
      const parts = authHeader.split(' ')
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1]
      }
    }

    // Fallback to cookie
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken
    }

    if (!token) {
      return next()
    }

    try {
      const payload = verifyAccessToken(token)
      req.user = payload
    } catch {
      // Token invalid but middleware is optional, continue
    }

    next()
  } catch (error) {
    next(error)
  }
}
