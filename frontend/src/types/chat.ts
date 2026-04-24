import type { User } from '@/types/auth'

export interface Conversation {
  id: string
  name: string | null
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
}

export interface Message {
  id: string
  content: string
  senderId: string
  sender: User
  conversationId: string
  createdAt: string
  updatedAt: string
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

export interface SendMessageRequest {
  conversationId: string
  content: string
}
