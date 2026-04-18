import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AuthenticationError } from './errorHandler';
import { AuthenticatedRequest } from '../types';

/**
 * JWT Authentication Middleware
 * Xác thực Access Token từ Authorization Header
 * Header format: "Bearer <token>"
 */
export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AuthenticationError('No authorization header provided');
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AuthenticationError('Invalid authorization header format. Use: Bearer <token>');
    }

    const token = parts[1];

    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    const payload = verifyAccessToken(token);
    req.user = payload;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional Authentication Middleware
 * Cho phép request đi qua dù có token hay không
 * Nếu có token thì gắn user vào request, không thì bỏ qua
 */
export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }

    const token = parts[1];

    if (!token) {
      return next();
    }

    try {
      const payload = verifyAccessToken(token);
      req.user = payload;
    } catch {
      // Token không hợp lệ nhưng middleware là optional nên vẫn cho đi qua
    }

    next();
  } catch (error) {
    next(error);
  }
};
