import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import {
  AUTH_RATE_WINDOW_MS,
  AUTH_RATE_MAX_ATTEMPTS,
  SEARCH_RATE_WINDOW_MS,
  SEARCH_RATE_MAX_REQUESTS,
  REFRESH_RATE_WINDOW_MS,
  REFRESH_RATE_MAX_REQUESTS,
} from '../config/constants';

export const authRateLimiter = rateLimit({
  windowMs: AUTH_RATE_WINDOW_MS,
  max: AUTH_RATE_MAX_ATTEMPTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many attempts. Please try again later.',
    });
  },
});

export const searchRateLimiter = rateLimit({
  windowMs: SEARCH_RATE_WINDOW_MS,
  max: SEARCH_RATE_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many search requests. Please slow down.',
    });
  },
});

export const refreshRateLimiter = rateLimit({
  windowMs: REFRESH_RATE_WINDOW_MS,
  max: REFRESH_RATE_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many token refresh attempts.',
    });
  },
});
