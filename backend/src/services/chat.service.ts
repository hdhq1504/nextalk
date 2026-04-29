import prisma from '../config/database'
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
    content: string
  ): Promise<MessageResponse> {
    const trimmedContent = content.trim()
    if (!trimmedContent) {
      throw new ValidationError('Message content is required')
    }

    await this.assertConversationMember(conversationId, senderId)

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: trimmedContent,
        type: MessageType.Text,
      },
      include: messageInclude,
    })

    return this.formatMessage(message)
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

  private formatMessage(message: MessageWithSender): MessageResponse {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      type: message.type as MessageType,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      isDeleted: message.isDeleted,
      sender: message.sender,
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

type MessageWithSender = Awaited<
  ReturnType<typeof prisma.message.findFirst<typeof messageIncludeArg>>
> extends infer T
  ? NonNullable<T>
  : never

const messageIncludeArg = {
  include: messageInclude,
}

export const chatService = new ChatService()
