import { Response } from 'express'
import { z } from 'zod'
import { authService, AuthResponse } from '../services/auth.service'
import { asyncHandler, ValidationError } from '../middlewares/errorHandler'
import { AuthenticatedRequest, ApiResponse } from '../types/index'
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ACCESS_TOKEN_COOKIE_OPTIONS,
  REFRESH_TOKEN_COOKIE_OPTIONS,
  buildCookieHeader,
  buildClearCookieHeader,
} from '../utils/cookies'

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

const checkEmailSchema = z.object({
  email: z.string().min(1, 'Email is required').regex(EMAIL_REGEX, 'Invalid email format'),
})

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(2, 'Username must be at least 2 characters').max(50, 'Username too long'),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

function validateBody<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    const result = schema.safeParse(data)
    if (!result.success) {
      const messages = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      throw new ValidationError(messages)
    }
    return result.data
  }
}

const validateRegister = validateBody(registerSchema)
const validateLogin = validateBody(loginSchema)
const validateRefreshToken = validateBody(refreshTokenSchema)

function setTokenCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.setHeader('Set-Cookie', [
    buildCookieHeader(ACCESS_TOKEN_COOKIE, accessToken, ACCESS_TOKEN_COOKIE_OPTIONS),
    buildCookieHeader(REFRESH_TOKEN_COOKIE, refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS),
  ])
}

function clearTokenCookies(res: Response): void {
  res.setHeader('Set-Cookie', [
    buildClearCookieHeader(ACCESS_TOKEN_COOKIE, { path: '/' }),
    buildClearCookieHeader(REFRESH_TOKEN_COOKIE, { path: '/api/auth/refresh' }),
  ])
}

export const register = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<AuthResponse>>) => {
  const { email, password, username } = validateRegister(req.body)

  const result = await authService.register(email, password, username)

  setTokenCookies(res, result.tokens.accessToken, result.tokens.refreshToken)

  res.status(201).json({
    success: true,
    data: result,
    message: 'Registration successful',
  })
})

export const login = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<AuthResponse>>) => {
  const { email, password } = validateLogin(req.body)

  const result = await authService.login(email, password)

  setTokenCookies(res, result.tokens.accessToken, result.tokens.refreshToken)

  res.status(200).json({
    success: true,
    data: result,
    message: 'Login successful',
  })
})

export const refreshToken = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  let refreshTokenValue: string

  // Support both body and cookie for refresh token
  if (req.body?.refreshToken) {
    refreshTokenValue = req.body.refreshToken
  } else if (req.cookies?.refreshToken) {
    refreshTokenValue = req.cookies.refreshToken
  } else {
    throw new ValidationError('Refresh token is required')
  }

  const tokens = await authService.refreshToken(refreshTokenValue)

  setTokenCookies(res, tokens.accessToken, tokens.refreshToken)

  res.status(200).json({
    success: true,
    data: tokens,
    message: 'Token refreshed successfully',
  })
})

export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const userId = req.user?.userId
  await authService.logout(userId!)

  clearTokenCookies(res)

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  })
})

export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const userId = req.user?.userId
  const user = await authService.getUserDetailById(userId!)

  res.status(200).json({
    success: true,
    data: user,
  })
})

const updateProfileSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters').max(50, 'Username too long').optional(),
  phone: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  bio: z.string().max(500, 'Bio is too long').nullable().optional(),
})

export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const userId = req.user?.userId
  const parsed = updateProfileSchema.safeParse(req.body)

  if (!parsed.success) {
    const messages = parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
    throw new ValidationError(messages)
  }

  const { username, phone, dateOfBirth, bio } = parsed.data
  const updated = await authService.updateUser(userId!, {
    username,
    phone,
    dateOfBirth,
    bio,
  })

  res.status(200).json({
    success: true,
    data: updated,
    message: 'Profile updated successfully',
  })
})

export const checkEmail = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const { email } = validateBody(checkEmailSchema)(req.body)

  const exists = await authService.checkEmail(email)

  res.status(200).json({
    success: true,
    data: { exists },
  })
})
