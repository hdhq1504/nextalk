import type { User } from '@/types/auth'

export interface ReactionSummary {
  emoji: string
  count: number
  userIds: string[]
}

export interface Conversation {
  id: string
  name: string | null
  type?: 'direct' | 'group'
  isGroup: boolean
  members: ConversationMember[]
  lastMessage: Message | null
  updatedAt: string
  createdAt: string
}

export interface ConversationMember {
  id: string
  userId: string
  user: User
  conversationId: string
  joinedAt: string
  role?: 'admin' | 'member'
  isPinned?: boolean
}

export interface Message {
  id: string
  content: string | null
  senderId: string
  sender: User
  conversationId: string
  createdAt: string
  updatedAt: string
  type?: 'text' | 'image' | 'file'
  isDeleted?: boolean
  imageUrl?: string | null
  imageUrls?: string[] | null
  replyToId?: string | null
  replyTo?: Message | null
  reactions?: ReactionSummary[]
}

export interface ConversationResponse {
  success: boolean
  data?: Conversation[]
  message?: string
  error?: string
}

export interface MessagesResponse {
  success: boolean
  data?: Message[]
  message?: string
  error?: string
}

export interface MessageResponse {
  success: boolean
  data?: Message
  message?: string
  error?: string
}

export interface CreateConversationRequest {
  memberIds: string[]
  name?: string
}

export interface CreateDirectConversationRequest {
  friendId: string
}

export interface SendMessageRequest {
  conversationId: string
  content: string
}
