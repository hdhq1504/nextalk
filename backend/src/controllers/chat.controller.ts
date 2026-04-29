import { Response } from 'express'
import { z } from 'zod'
import { chatService } from '../services/chat.service'
import { asyncHandler, ValidationError } from '../middlewares/errorHandler'
import { ApiResponse, AuthenticatedRequest } from '../types'

const directConversationSchema = z.object({
  friendId: z.string().uuid('Invalid friend ID'),
})

const conversationIdSchema = z.object({
  id: z.string().uuid('Invalid conversation ID'),
})

function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const messages = result.error.issues
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ')
    throw new ValidationError(messages)
  }
  return result.data
}

export const getConversations = asyncHandler(
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const conversations = await chatService.getConversations(req.user!.userId)

    res.status(200).json({
      success: true,
      data: conversations,
    })
  }
)

export const createDirectConversation = asyncHandler(
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { friendId } = validate(directConversationSchema, req.body)
    const conversation = await chatService.getOrCreateDirectConversation(
      req.user!.userId,
      friendId
    )

    res.status(200).json({
      success: true,
      data: conversation,
    })
  }
)

export const getMessages = asyncHandler(
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { id } = validate(conversationIdSchema, req.params)
    const messages = await chatService.getMessages(id, req.user!.userId)

    res.status(200).json({
      success: true,
      data: messages,
    })
  }
)
