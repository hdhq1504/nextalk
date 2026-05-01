import prisma from '../config/database'
import { uploadImageBuffer } from '../config/cloudinary'
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../middlewares/errorHandler'
import {
  ConversationListItem,
  ConversationResponse,
  ConversationType,
  MemberRole,
  MessageResponse,
  MessageType,
  ReactionSummary,
} from '../types'

const userSelect = {
  id: true,
  email: true,
  username: true,
  avatarUrl: true,
  isOnline: true,
  lastSeen: true,
  createdAt: true,
} as const

const messageInclude = {
  sender: {
    select: userSelect,
  },
  replyTo: {
    include: {
      sender: { select: userSelect },
    },
  },
  reactions: {
    include: {
      user: { select: { id: true } },
    },
  },
} as const

const conversationInclude = {
  members: {
    include: {
      user: {
        select: userSelect,
      },
    },
    orderBy: {
      joinedAt: 'asc' as const,
    },
  },
  messages: {
    include: messageInclude,
    orderBy: {
      createdAt: 'desc' as const,
    },
    take: 1,
  },
} as const

class ChatService {
  async getConversations(userId: string): Promise<ConversationListItem[]> {
    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: {
            userId,
            isHidden: false,
          },
        },
      },
      include: conversationInclude,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return conversations
      .map((conversation) => this.formatConversationListItem(conversation))
      .sort((a, b) => {
        const aDate = a.lastMessage?.createdAt ?? a.createdAt
        const bDate = b.lastMessage?.createdAt ?? b.createdAt
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      })
  }

  async getOrCreateDirectConversation(
    userId: string,
    friendId: string
  ): Promise<ConversationListItem> {
    if (userId === friendId) {
      throw new ConflictError('You cannot create a conversation with yourself')
    }

    const friendship = await prisma.friendship.findUnique({
      where: {
        userId_friendId: {
          userId,
          friendId,
        },
      },
    })

    if (!friendship) {
      throw new AuthorizationError('You can only chat with friends')
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        type: ConversationType.Direct,
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: friendId } } },
        ],
      },
      include: conversationInclude,
    })

    if (existing && existing.members.length === 2) {
      return this.formatConversationListItem(existing)
    }

    const conversation = await prisma.conversation.create({
      data: {
        type: ConversationType.Direct,
        createdById: userId,
        members: {
          create: [
            { userId, role: MemberRole.Member },
            { userId: friendId, role: MemberRole.Member },
          ],
        },
      },
      include: conversationInclude,
    })

    return this.formatConversationListItem(conversation)
  }

  async getMessages(
    conversationId: string,
    userId: string
  ): Promise<MessageResponse[]> {
    await this.assertConversationMember(conversationId, userId)

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      include: messageInclude,
      orderBy: {
        createdAt: 'asc',
      },
    })

    return messages.map((message) => this.formatMessage(message))
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    replyToId?: string
  ): Promise<MessageResponse> {
    const trimmedContent = content.trim()
    if (!trimmedContent) {
      throw new ValidationError('Message content is required')
    }

    await this.assertConversationMember(conversationId, senderId)

    if (replyToId) {
      const replyMessage = await prisma.message.findUnique({
        where: { id: replyToId },
        select: { conversationId: true },
      })
      if (!replyMessage) {
        throw new NotFoundError('Reply message not found')
      }
      if (replyMessage.conversationId !== conversationId) {
        throw new ValidationError('Cannot reply to a message in a different conversation')
      }
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: trimmedContent,
        type: MessageType.Text,
        replyToId,
      },
      include: messageInclude,
    })

    return this.formatMessage(message)
  }

  async sendImageMessage(
    conversationId: string,
    senderId: string,
    imageBuffer: Buffer,
    mimeType: string,
    content?: string,
    replyToId?: string
  ): Promise<MessageResponse> {
    await this.assertConversationMember(conversationId, senderId)
    const trimmedContent = content?.trim() || null

    if (replyToId) {
      const replyMessage = await prisma.message.findUnique({
        where: { id: replyToId },
        select: { conversationId: true },
      })
      if (!replyMessage) {
        throw new NotFoundError('Reply message not found')
      }
      if (replyMessage.conversationId !== conversationId) {
        throw new ValidationError('Cannot reply to a message in a different conversation')
      }
    }

    const uploadResult = await uploadImageBuffer(imageBuffer, 'nextalk/messages')

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: trimmedContent,
        type: MessageType.Image,
        imageUrl: uploadResult.url,
        replyToId,
      },
      include: messageInclude,
    })

    return this.formatMessage(message)
  }

  async recallMessage(
    messageId: string,
    requesterId: string
  ): Promise<MessageResponse> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: messageInclude,
    })

    if (!message) {
      throw new NotFoundError('Message not found')
    }

    if (message.senderId !== requesterId) {
      throw new AuthorizationError('You can only recall your own messages')
    }

    if (message.isDeleted) {
      throw new ConflictError('Message has already been recalled')
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        content: null,
        imageUrl: null,
      },
      include: messageInclude,
    })

    return this.formatMessage(updated)
  }

  async reactMessage(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<{ conversationId: string; reactions: ReactionSummary[] }> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { conversationId: true },
    })

    if (!message) {
      throw new NotFoundError('Message not found')
    }

    await this.assertConversationMember(message.conversationId, userId)

    const existingReaction = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
    })

    if (existingReaction) {
      await prisma.messageReaction.delete({
        where: { id: existingReaction.id },
      })
    } else {
      await prisma.messageReaction.create({
        data: {
          messageId,
          userId,
          emoji,
        },
      })
    }

    const reactions = await prisma.messageReaction.findMany({
      where: { messageId },
      include: { user: { select: { id: true } } },
    })

    const reactionSummary = this.calculateReactionsFromArray(reactions)

    return { conversationId: message.conversationId, reactions: reactionSummary }
  }

  private calculateReactionsFromArray(reactions: { emoji: string; user: { id: string } }[]): ReactionSummary[] {
    const reactionMap = new Map<string, { count: number; userIds: string[] }>()

    for (const reaction of reactions) {
      const existing = reactionMap.get(reaction.emoji) || { count: 0, userIds: [] }
      existing.count++
      existing.userIds.push(reaction.user.id)
      reactionMap.set(reaction.emoji, existing)
    }

    return Array.from(reactionMap.entries()).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      userIds: data.userIds,
    }))
  }

  async getConversationForMember(
    conversationId: string,
    userId: string
  ): Promise<ConversationResponse> {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        members: {
          some: {
            userId,
          },
        },
      },
      include: conversationInclude,
    })

    if (!conversation) {
      throw new NotFoundError('Conversation not found')
    }

    return this.formatConversation(conversation)
  }

  private async assertConversationMember(
    conversationId: string,
    userId: string
  ): Promise<void> {
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    })

    if (!member) {
      throw new NotFoundError('Conversation not found')
    }
  }

  private formatConversationListItem(conversation: ConversationWithRelations): ConversationListItem {
    const formatted = this.formatConversation(conversation)

    return {
      id: formatted.id,
      type: formatted.type,
      name: formatted.name,
      avatarUrl: formatted.avatarUrl,
      createdAt: formatted.createdAt,
      lastMessage: formatted.lastMessage ?? null,
      members:
        formatted.members?.map((member) => ({
          user: member.user!,
          role: member.role,
          isPinned: member.isPinned,
        })) ?? [],
      unreadCount: 0,
    }
  }

  private formatConversation(conversation: ConversationWithRelations): ConversationResponse {
    const lastMessage = conversation.messages[0]

    return {
      id: conversation.id,
      type: conversation.type as ConversationType,
      name: conversation.name,
      avatarUrl: conversation.avatarUrl,
      createdById: conversation.createdById,
      lastMessageId: lastMessage?.id ?? null,
      createdAt: conversation.createdAt,
      members: conversation.members.map((member) => ({
        id: member.id,
        conversationId: member.conversationId,
        userId: member.userId,
        role: member.role as MemberRole,
        isPinned: member.isPinned,
        isHidden: member.isHidden,
        joinedAt: member.joinedAt,
        user: member.user,
      })),
      lastMessage: lastMessage ? this.formatMessage(lastMessage) : null,
    }
  }

  private formatMessage(message: unknown): MessageResponse {
    const msg = message as MessageWithRelations
    const reactions = msg.reactions ? this.calculateReactionsFromArray(msg.reactions) : undefined

    return {
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      content: msg.content,
      type: msg.type as MessageType,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      isDeleted: msg.isDeleted,
      sender: msg.sender,
      replyToId: msg.replyToId ?? null,
      imageUrl: msg.imageUrl ?? null,
      replyTo: msg.replyTo ? this.formatMessage(msg.replyTo) : null,
      reactions,
    }
  }
}

type ConversationWithRelations = Awaited<
  ReturnType<typeof prisma.conversation.findFirst<typeof conversationIncludeArg>>
> extends infer T
  ? NonNullable<T>
  : never

const conversationIncludeArg = {
  include: conversationInclude,
}

type MessageWithRelations = {
  id: string
  conversationId: string
  senderId: string | null
  content: string | null
  type: string
  createdAt: Date
  updatedAt: Date | null
  isDeleted: boolean
  replyToId: string | null
  imageUrl: string | null
  sender: {
    id: string
    email: string
    username: string
    avatarUrl: string | null
    isOnline: boolean
    lastSeen: Date | null
    createdAt: Date
  } | null
  replyTo: unknown | null
  reactions: {
    emoji: string
    user: { id: string }
  }[]
}

export const chatService = new ChatService()
