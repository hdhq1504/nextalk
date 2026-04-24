import { Router } from 'express';
import { register, login, refreshToken, logout, getProfile, checkEmail, updateProfile } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private (requires authentication)
 */
router.post('/logout', authenticate, logout);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private (requires authentication)
 */
router.get('/profile', authenticate, getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile
 * @access  Private (requires authentication)
 */
router.put('/profile', authenticate, updateProfile);

/**
 * @route   POST /api/auth/check-email
 * @desc    Check if email is already registered
 * @access  Public
 */
router.post('/check-email', checkEmail);

export default router;
