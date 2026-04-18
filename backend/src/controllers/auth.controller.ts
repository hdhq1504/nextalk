import { Response } from 'express';
import { z } from 'zod';
import { authService, AuthResponse } from '../services/auth.service';
import { asyncHandler, ValidationError } from '../middlewares/errorHandler';
import { AuthenticatedRequest, ApiResponse } from '../types/index';

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(2, 'Username must be at least 2 characters').max(50, 'Username too long'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

function validateBody<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    const result = schema.safeParse(data);
    if (!result.success) {
      const messages = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new ValidationError(messages);
    }
    return result.data;
  };
}

const validateRegister = validateBody(registerSchema);
const validateLogin = validateBody(loginSchema);
const validateRefreshToken = validateBody(refreshTokenSchema);

export const register = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<AuthResponse>>) => {
  const { email, password, username } = validateRegister(req.body);

  const result = await authService.register(email, password, username);

  res.status(201).json({
    success: true,
    data: result,
    message: 'Registration successful',
  });
});

export const login = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse<AuthResponse>>) => {
  const { email, password } = validateLogin(req.body);

  const result = await authService.login(email, password);

  res.status(200).json({
    success: true,
    data: result,
    message: 'Login successful',
  });
});

export const refreshToken = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const { refreshToken } = validateRefreshToken(req.body);

  const tokens = await authService.refreshToken(refreshToken);

  res.status(200).json({
    success: true,
    data: tokens,
    message: 'Token refreshed successfully',
  });
});

export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const userId = req.user?.userId;
  await authService.logout(userId!);

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const userId = req.user?.userId;
  const user = await authService.getUserById(userId!);

  res.status(200).json({
    success: true,
    data: user,
  });
});
