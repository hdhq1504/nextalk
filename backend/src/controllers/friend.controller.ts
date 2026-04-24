import { Response } from 'express'
import { z } from 'zod'
import { friendService } from '../services/friend.service'
import { asyncHandler, ValidationError } from '../middlewares/errorHandler'
import { AuthenticatedRequest, ApiResponse } from '../types/index'

const searchUsersSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Query too long'),
})

const sendRequestSchema = z.object({
  receiverId: z.string().uuid('Invalid user ID'),
})

const requestIdSchema = z.object({
  id: z.string().uuid('Invalid request ID'),
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

const validateSearch = validateBody(searchUsersSchema)
const validateSendRequest = validateBody(sendRequestSchema)
const validateRequestId = validateBody(requestIdSchema)

export const searchUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const userId = req.user?.userId
  const { query } = validateSearch(req.body)

  const users = await friendService.searchUsers(userId!, query)

  res.status(200).json({
    success: true,
    data: users,
  })
})

export const sendFriendRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const userId = req.user?.userId
  const { receiverId } = validateSendRequest(req.body)

  const request = await friendService.sendFriendRequest(userId!, receiverId)

  res.status(201).json({
    success: true,
    data: request,
    message: 'Friend request sent successfully',
  })
})

export const getReceivedRequests = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const userId = req.user?.userId

  const requests = await friendService.getReceivedRequests(userId!)

  res.status(200).json({
    success: true,
    data: requests,
  })
})

export const acceptRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const userId = req.user?.userId
  const { id } = validateRequestId(req.params)

  const request = await friendService.acceptRequest(id, userId!)

  res.status(200).json({
    success: true,
    data: request,
    message: 'Friend request accepted',
  })
})

export const rejectRequest = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const userId = req.user?.userId
  const { id } = validateRequestId(req.params)

  const request = await friendService.rejectRequest(id, userId!)

  res.status(200).json({
    success: true,
    data: request,
    message: 'Friend request rejected',
  })
})

export const getFriends = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const userId = req.user?.userId

  const friends = await friendService.getFriends(userId!)

  res.status(200).json({
    success: true,
    data: friends,
  })
})

export const getPendingRequestsCount = asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  const userId = req.user?.userId

  const count = await friendService.getPendingRequestsCount(userId!)

  res.status(200).json({
    success: true,
    data: { count },
  })
})
