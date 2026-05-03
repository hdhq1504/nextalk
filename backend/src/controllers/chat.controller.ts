import { Response } from 'express'
import { z } from 'zod'
import { chatService } from '../services/chat.service'
import { asyncHandler, ValidationError } from '../middlewares/errorHandler'
import { ApiResponse, AuthenticatedRequest } from '../types'
import { upload } from '../utils/fileUpload'
import {
  getConversationRoom,
  getSocketServer,
  getUserRoom,
} from '../socket'

const directConversationSchema = z.object({
  friendId: z.string().uuid('Invalid friend ID'),
})

const conversationIdSchema = z.object({
  id: z.string().uuid('Invalid conversation ID'),
})

const messageIdSchema = z.object({
  messageId: z.string().uuid('Invalid message ID'),
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

export const sendImageMessage = [
  upload.array('images', 10),
  asyncHandler(async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const files = req.files as Express.Multer.File[] | undefined

    if (!files || files.length === 0) {
      throw new ValidationError('At least one image file is required')
    }

    const { id } = validate(conversationIdSchema, req.params)
    const replyToId = req.body.replyToId
    const content =
      typeof req.body.content === 'string' ? req.body.content : undefined

    const message = await chatService.sendImageMessage(
      id,
      req.user!.userId,
      files.map((f) => ({ buffer: f.buffer, mimetype: f.mimetype })),
      content,
      replyToId || undefined
    )
    const conversation = await chatService.getConversationForMember(
      id,
      req.user!.userId
    )
    const io = getSocketServer()

    if (io) {
      const room = getConversationRoom(id)
      const memberRooms =
        conversation.members?.map((member) => getUserRoom(member.userId)) ?? []

      io.to([room, ...memberRooms]).emit('message:new', message)
      io.to([room, ...memberRooms]).emit('conversation:update', conversation)
    }

    res.status(201).json({
      success: true,
      data: message,
    })
  }),
]

export const recallMessage = asyncHandler(
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { messageId } = validate(messageIdSchema, req.params)
    const message = await chatService.recallMessage(messageId, req.user!.userId)

    res.status(200).json({
      success: true,
      data: message,
    })
  }
)

export const reactMessage = asyncHandler(
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { messageId } = validate(messageIdSchema, req.params)
    const { emoji } = z.object({
      emoji: z.string().min(1, 'Emoji is required'),
    }).parse(req.body)

    const result = await chatService.reactMessage(messageId, req.user!.userId, emoji)

    res.status(200).json({
      success: true,
      data: result,
    })
  }
)
