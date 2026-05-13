import { Response } from 'express'
import { z } from 'zod'
import { chatService } from '../services/chat.service'
import { asyncHandler, ValidationError } from '../middlewares/errorHandler'
import { validate } from '../utils/validate'
import { ApiResponse, AuthenticatedRequest } from '../types'
import { upload } from '../utils/fileUpload'
import {
  emitToConversationMembers,
  getConversationRoom,
  getSocketServer,
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
    const cursor = req.query.cursor as string | undefined
    const limit = parseInt(req.query.limit as string) || 50
    const result = await chatService.getMessages(id, req.user!.userId, cursor, limit)

    res.status(200).json({
      success: true,
      data: result,
    })
  }
)

export const searchMessages = asyncHandler(
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { id } = validate(conversationIdSchema, req.params)
    const query = req.query.q as string | undefined
    const cursor = req.query.cursor as string | undefined
    const limit = parseInt(req.query.limit as string) || 50

    if (!query || !query.trim()) {
      res.status(200).json({
        success: true,
        data: { messages: [], nextCursor: undefined },
      })
      return
    }

    const result = await chatService.searchMessages(
      id,
      req.user!.userId,
      query,
      limit
    )

    res.status(200).json({
      success: true,
      data: result,
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
      emitToConversationMembers(io, conversation, 'message:new', message)
      emitToConversationMembers(io, conversation, 'conversation:update', conversation)
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

const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100, 'Group name too long'),
  memberIds: z.array(z.string().uuid()).min(2, 'At least 2 members required'),
})

const addMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
})

const leaveGroupSchema = z.object({
  newAdminId: z.string().uuid('Invalid admin ID').optional(),
})

const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
})

export const createGroupConversation = asyncHandler(
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { name, memberIds } = validate(createGroupSchema, req.body)
    const conversation = await chatService.createGroupConversation(
      req.user!.userId,
      name,
      memberIds
    )

    res.status(201).json({
      success: true,
      data: conversation,
    })
  }
)

export const addGroupMember = asyncHandler(
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { id } = validate(conversationIdSchema, req.params)
    const { userId } = validate(addMemberSchema, req.body)
    const conversation = await chatService.addGroupMember(
      id,
      req.user!.userId,
      userId
    )

    const io = getSocketServer()
    if (io) {
      emitToConversationMembers(io, conversation, 'conversation:member_added', {
        conversationId: id,
        userId,
        conversation,
      })
    }

    res.status(200).json({
      success: true,
      data: conversation,
    })
  }
)

export const removeGroupMember = asyncHandler(
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { id, userId } = validate(
      conversationIdSchema.merge(
        z.object({ userId: z.string().uuid('Invalid user ID') })
      ),
      { ...req.params, userId: req.params.userId }
    )
    await chatService.removeGroupMember(id, req.user!.userId, userId)

    const io = getSocketServer()
    if (io) {
      io.to(getConversationRoom(id)).emit('conversation:member_removed', {
        conversationId: id,
        userId,
      })
    }

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
    })
  }
)

export const updateGroupInfo = asyncHandler(
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { id } = validate(conversationIdSchema, req.params)
    const data = validate(updateGroupSchema, req.body)
    const conversation = await chatService.updateGroupInfo(id, req.user!.userId, data)

    const io = getSocketServer()
    if (io) {
      io.to(getConversationRoom(id)).emit('conversation:updated', conversation)
    }

    res.status(200).json({
      success: true,
      data: conversation,
    })
  }
)

export const deleteConversation = asyncHandler(
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { id } = validate(conversationIdSchema, req.params)
    await chatService.deleteConversation(id, req.user!.userId)

    const io = getSocketServer()
    if (io) {
      io.to(getConversationRoom(id)).emit('conversation:deleted', {
        conversationId: id,
      })
    }

    res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully',
    })
  }
)

export const removeConversation = asyncHandler(
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { id } = validate(conversationIdSchema, req.params)
    await chatService.removeConversation(id, req.user!.userId)

    res.status(200).json({
      success: true,
      message: 'Conversation removed successfully',
    })
  }
)

export const leaveGroup = asyncHandler(
  async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
    const { id } = validate(conversationIdSchema, req.params)
    const { newAdminId } = validate(leaveGroupSchema, req.body ?? {})
    const conversation = await chatService.leaveGroup(id, req.user!.userId, newAdminId)

    const io = getSocketServer()
    if (io) {
      io.to(getConversationRoom(id)).emit('conversation:member_removed', {
        conversationId: id,
        userId: req.user!.userId,
      })

      if (conversation) {
        emitToConversationMembers(io, conversation, 'conversation:updated', conversation)
      }
    }

    res.status(200).json({
      success: true,
      message: 'Left the group successfully',
    })
  }
)
