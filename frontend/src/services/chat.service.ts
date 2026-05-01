import { apiClient } from '@/lib/axios'
import type {
  Conversation,
  Message,
  ConversationResponse,
  MessagesResponse,
  MessageResponse,
  CreateConversationRequest,
  ReactionSummary
} from '@/types/chat'
import { socketClient } from '@/lib/socket'
import type { User } from '@/types/auth'

interface SocketSendResponse {
  success: boolean
  message?: Message
  error?: string
}

type ApiUser = Partial<User> & {
  id: string
  username: string
  email?: string
  avatarUrl: string | null
}

type ApiConversationMember = {
  id?: string
  userId?: string
  conversationId?: string
  joinedAt?: string
  user: ApiUser
}

type ApiConversation = Omit<Conversation, 'members' | 'isGroup'> & {
  type?: 'direct' | 'group'
  members: ApiConversationMember[]
  isGroup?: boolean
}

type ApiMessage = Omit<Message, 'content' | 'sender'> & {
  content: string | null
  sender: ApiUser | null
}

type ApiReactionSummary = {
  emoji: string
  count: number
  userIds: string[]
}

function normalizeUser(user: ApiUser): User {
  return {
    id: user.id,
    email: user.email ?? '',
    username: user.username,
    avatarUrl: user.avatarUrl ?? null,
    phone: user.phone ?? null,
    dateOfBirth: user.dateOfBirth ?? null,
    bio: user.bio ?? null,
    isOnline: user.isOnline ?? false,
    lastSeen: user.lastSeen ?? null,
    createdAt: user.createdAt ?? ''
  }
}

function normalizeReaction(reaction: ApiReactionSummary): ReactionSummary {
  return {
    emoji: reaction.emoji,
    count: reaction.count,
    userIds: reaction.userIds
  }
}

export function normalizeMessage(message: ApiMessage): Message {
  const fallbackSender: ApiUser = {
    id: message.senderId,
    username: 'Unknown',
    email: '',
    avatarUrl: null
  }

  const normalized: Message = {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    content: message.content ?? '',
    sender: normalizeUser(message.sender ?? fallbackSender),
    createdAt: message.createdAt,
    updatedAt: message.updatedAt ?? message.createdAt,
    type: message.type ?? 'text',
    isDeleted: message.isDeleted ?? false,
    imageUrl: message.imageUrl ?? null,
    replyToId: message.replyToId ?? null,
    replyTo: message.replyTo
      ? normalizeMessage(message.replyTo as ApiMessage)
      : null,
    reactions: message.reactions?.map(normalizeReaction)
  }

  return normalized
}

export function normalizeConversation(
  conversation: ApiConversation
): Conversation {
  const lastMessage = conversation.lastMessage
    ? normalizeMessage(conversation.lastMessage as ApiMessage)
    : null

  return {
    ...conversation,
    isGroup: conversation.isGroup ?? conversation.type === 'group',
    members: conversation.members.map((member) => ({
      id: member.id ?? `${conversation.id}:${member.user.id}`,
      userId: member.userId ?? member.user.id,
      conversationId: member.conversationId ?? conversation.id,
      joinedAt: member.joinedAt ?? conversation.createdAt,
      user: normalizeUser(member.user)
    })),
    lastMessage,
    updatedAt:
      conversation.updatedAt ?? lastMessage?.createdAt ?? conversation.createdAt
  }
}

export const chatService = {
  async getConversations(): Promise<Conversation[]> {
    const response = await apiClient.get<ConversationResponse>('/conversations')

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch conversations')
    }

    return ((response.data.data || []) as ApiConversation[]).map(
      normalizeConversation
    )
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await apiClient.get<MessagesResponse>(
      `/conversations/${conversationId}/messages`
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch messages')
    }

    return ((response.data.data || []) as ApiMessage[]).map(normalizeMessage)
  },

  async createConversation(
    data: CreateConversationRequest
  ): Promise<Conversation> {
    const response = await apiClient.post<MessageResponse>(
      '/conversations',
      data
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to create conversation')
    }

    if (!response.data.data) {
      throw new Error('No data returned from server')
    }

    return response.data.data as unknown as Conversation
  },

  async createDirectConversation(friendId: string): Promise<Conversation> {
    const response = await apiClient.post<MessageResponse>(
      '/conversations/direct',
      { friendId }
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to create conversation')
    }

    if (!response.data.data) {
      throw new Error('No data returned from server')
    }

    return normalizeConversation(
      response.data.data as unknown as ApiConversation
    )
  },

  async sendMessage(
    conversationId: string,
    content: string,
    replyToId?: string
  ): Promise<Message> {
    const response = await socketClient.emitWithAck<SocketSendResponse>(
      'message:send',
      { conversationId, content, replyToId }
    )

    if (!response.success) {
      throw new Error(response.error || 'Failed to send message')
    }

    if (!response.message) {
      throw new Error('No data returned from server')
    }

    return normalizeMessage(response.message as ApiMessage)
  },

  async sendImageMessage(
    conversationId: string,
    file: File,
    content?: string,
    replyToId?: string
  ): Promise<Message> {
    const formData = new FormData()
    formData.append('image', file)
    if (content?.trim()) {
      formData.append('content', content.trim())
    }
    if (replyToId) {
      formData.append('replyToId', replyToId)
    }

    const response = await apiClient.post<MessageResponse>(
      `/conversations/${conversationId}/messages/image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to send image')
    }

    if (!response.data.data) {
      throw new Error('No data returned from server')
    }

    return normalizeMessage(response.data.data as unknown as ApiMessage)
  },

  async recallMessage(messageId: string): Promise<void> {
    const response = await socketClient.emitWithAck<{
      success: boolean
      error?: string
    }>('message:recall', { messageId })

    if (!response.success) {
      throw new Error(response.error || 'Failed to recall message')
    }
  },

  async reactMessage(messageId: string, emoji: string): Promise<void> {
    const response = await socketClient.emitWithAck<{
      success: boolean
      error?: string
    }>('message:react', { messageId, emoji })

    if (!response.success) {
      throw new Error(response.error || 'Failed to react to message')
    }
  }
}
