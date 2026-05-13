import { apiClient } from '@/lib/axios'
import type {
  Conversation,
  Message,
  ConversationResponse,
  MessagesResponse,
  MessageResponse,
  CreateConversationRequest,
  CreateDirectConversationRequest,
  ReactionSummary,
  SendMessageRequest,
  UpdateGroupInfoRequest
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
  role?: 'admin' | 'member'
  isPinned?: boolean
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
    imageUrls: message.imageUrls ?? null,
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
      user: normalizeUser(member.user),
      role: (member as ApiConversationMember).role,
      isPinned: (member as ApiConversationMember).isPinned
    })),
    lastMessage,
    updatedAt:
      conversation.updatedAt ?? lastMessage?.createdAt ?? conversation.createdAt
  }
}

export const chatService = {
  async getConversations(signal?: AbortSignal): Promise<Conversation[]> {
    const response = await apiClient.get<ConversationResponse>(
      '/conversations',
      { signal }
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch conversations')
    }

    return ((response.data.data || []) as ApiConversation[]).map(
      normalizeConversation
    )
  },

  async getMessages(
    conversationId: string,
    cursor?: string,
    limit = 50,
    signal?: AbortSignal
  ): Promise<{ messages: Message[]; nextCursor?: string }> {
    const params = new URLSearchParams({ limit: String(limit) })
    if (cursor) params.append('cursor', cursor)

    const response = await apiClient.get<MessagesResponse>(
      `/conversations/${conversationId}/messages?${params.toString()}`,
      { signal }
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch messages')
    }

    const data = response.data.data as
      | { messages: ApiMessage[]; nextCursor?: string }
      | ApiMessage[]
    if (Array.isArray(data)) {
      return { messages: (data as ApiMessage[]).map(normalizeMessage) }
    }
    return {
      messages: (data.messages as ApiMessage[]).map(normalizeMessage),
      nextCursor: data.nextCursor
    }
  },

  async searchMessages(
    conversationId: string,
    query: string,
    limit = 50
  ): Promise<{ messages: Message[]; nextCursor?: string }> {
    const params = new URLSearchParams({ q: query, limit: String(limit) })

    const response = await apiClient.get<MessagesResponse>(
      `/conversations/${conversationId}/messages/search?${params.toString()}`
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to search messages')
    }

    const data = response.data.data as
      | { messages: ApiMessage[]; nextCursor?: string }
      | ApiMessage[]
    if (Array.isArray(data)) {
      return { messages: (data as ApiMessage[]).map(normalizeMessage) }
    }
    return {
      messages: (data.messages as ApiMessage[]).map(normalizeMessage),
      nextCursor: data.nextCursor
    }
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

  async createDirectConversation(
    friendId: CreateDirectConversationRequest['friendId']
  ): Promise<Conversation> {
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

  async createGroupConversation(
    name: NonNullable<CreateConversationRequest['name']>,
    memberIds: CreateConversationRequest['memberIds']
  ): Promise<Conversation> {
    const response = await apiClient.post<MessageResponse>(
      '/conversations/group',
      { name, memberIds }
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to create group')
    }

    if (!response.data.data) {
      throw new Error('No data returned from server')
    }

    return normalizeConversation(
      response.data.data as unknown as ApiConversation
    )
  },

  async addGroupMember(
    conversationId: string,
    userId: string
  ): Promise<Conversation> {
    const response = await apiClient.post<MessageResponse>(
      `/conversations/${conversationId}/members`,
      { userId }
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to add member')
    }

    if (!response.data.data) {
      throw new Error('No data returned from server')
    }

    return normalizeConversation(
      response.data.data as unknown as ApiConversation
    )
  },

  async removeGroupMember(
    conversationId: string,
    userId: string
  ): Promise<void> {
    const response = await apiClient.delete(
      `/conversations/${conversationId}/members/${userId}`
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to remove member')
    }
  },

  async deleteConversation(conversationId: string): Promise<void> {
    const response = await apiClient.delete(`/conversations/${conversationId}`)

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete conversation')
    }
  },

  async removeConversation(conversationId: string): Promise<void> {
    const response = await apiClient.post(
      `/conversations/${conversationId}/remove`
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to remove conversation')
    }
  },

  async updateGroupInfo(
    conversationId: string,
    data: UpdateGroupInfoRequest
  ): Promise<Conversation> {
    const response = await apiClient.patch<MessageResponse>(
      `/conversations/${conversationId}`,
      data
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to update group')
    }

    if (!response.data.data) {
      throw new Error('No data returned from server')
    }

    return normalizeConversation(
      response.data.data as unknown as ApiConversation
    )
  },

  async leaveGroup(conversationId: string, newAdminId?: string): Promise<void> {
    const response = await apiClient.post(
      `/conversations/${conversationId}/leave`,
      newAdminId ? { newAdminId } : {}
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to leave group')
    }
  },

  async sendMessage(
    conversationId: SendMessageRequest['conversationId'],
    content: SendMessageRequest['content'],
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
    files: File[],
    content?: string,
    replyToId?: string
  ): Promise<Message> {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('images', file)
    })
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
