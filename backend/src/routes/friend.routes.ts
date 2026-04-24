import { Router } from 'express';
import {
  searchUsers,
  sendFriendRequest,
  getReceivedRequests,
  acceptRequest,
  rejectRequest,
  getFriends,
  getPendingRequestsCount,
} from '../controllers/friend.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/friends/search
 * @desc    Search users by username or email
 * @access  Private
 */
router.post('/search', authenticate, searchUsers);

/**
 * @route   POST /api/friends/request
 * @desc    Send a friend request
 * @access  Private
 */
router.post('/request', authenticate, sendFriendRequest);

/**
 * @route   GET /api/friends/requests
 * @desc    Get received friend requests
 * @access  Private
 */
router.get('/requests', authenticate, getReceivedRequests);

/**
 * @route   POST /api/friends/accept/:id
 * @desc    Accept a friend request
 * @access  Private
 */
router.post('/accept/:id', authenticate, acceptRequest);

/**
 * @route   POST /api/friends/reject/:id
 * @desc    Reject a friend request
 * @access  Private
 */
router.post('/reject/:id', authenticate, rejectRequest);

/**
 * @route   GET /api/friends
 * @desc    Get list of friends
 * @access  Private
 */
router.get('/', authenticate, getFriends);

/**
 * @route   GET /api/friends/requests/count
 * @desc    Get count of pending friend requests
 * @access  Private
 */
router.get('/requests/count', authenticate, getPendingRequestsCount);

export default router;
