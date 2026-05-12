import type { User } from '@/types/auth'

export interface ReactionSummary {
  emoji: string
  count: number
  userIds: string[]
}

export interface OptimisticMessage extends Message {
  _tempId: string
  _status: 'pending' | 'sent' | 'failed'
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
  data?: Message[] | { messages: Message[]; nextCursor?: string }
  message?: string
  error?: string
}

export interface MessageResponse {
  success: boolean
  data?: Message
  message?: string
  error?: string
}

export type CreateConversationRequest = Partial<Pick<Conversation, 'name'>> & {
  memberIds: ConversationMember['userId'][]
}

export type CreateDirectConversationRequest = {
  friendId: ConversationMember['userId']
}

export type UpdateGroupInfoRequest = Partial<
  Pick<Conversation, 'name'> & Pick<User, 'avatarUrl'>
>

export type SendMessageRequest = Pick<Message, 'conversationId'> & {
  content: NonNullable<Message['content']>
}
