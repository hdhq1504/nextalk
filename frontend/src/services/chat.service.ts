import { apiClient } from '@/lib/axios'
import type {
  Conversation,
  Message,
  ConversationResponse,
  MessagesResponse,
  MessageResponse,
  CreateConversationRequest
} from '@/types/chat'
import { mockConversations, mockMessages } from '@/data/mock-chat'

const USE_MOCK = true

export const chatService = {
  async getConversations(): Promise<Conversation[]> {
    if (USE_MOCK) {
      return mockConversations
    }
    const response = await apiClient.get<ConversationResponse>('/conversations')

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch conversations')
    }

    return response.data.data || []
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    if (USE_MOCK) {
      return mockMessages[conversationId] ?? []
    }
    const response = await apiClient.get<MessagesResponse>(
      `/conversations/${conversationId}/messages`
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch messages')
    }

    return response.data.data || []
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

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const response = await apiClient.post<MessageResponse>(
      `/conversations/${conversationId}/messages`,
      { content }
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to send message')
    }

    if (!response.data.data) {
      throw new Error('No data returned from server')
    }

    return response.data.data
  }
}
