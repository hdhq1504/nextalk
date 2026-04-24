import { create } from 'zustand'
import { chatService } from '@/services/chat.service'
import { socketClient } from '@/lib/socket'
import type { Conversation, Message } from '@/types/chat'

interface ChatState {
  conversations: Conversation[]
  activeConversation: Conversation | null
  messages: Record<string, Message[]>
  isLoading: boolean
  isMessagesLoading: boolean
  error: string | null

  fetchConversations: () => Promise<Conversation[]>
  setActiveConversation: (conversation: Conversation | null) => void
  fetchMessages: (conversationId: string) => Promise<void>
  sendMessage: (conversationId: string, content: string) => Promise<void>
  addMessage: (message: Message) => void
  updateConversationLastMessage: (
    conversationId: string,
    message: Message
  ) => void
  clearError: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: {},
  isLoading: false,
  isMessagesLoading: false,
  error: null,

  fetchConversations: async () => {
    set({ isLoading: true, error: null })
    try {
      const conversations = await chatService.getConversations()
      set({ conversations, isLoading: false })
      return conversations
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch conversations',
        isLoading: false
      })
      return []
    }
  },

  setActiveConversation: (conversation) => {
    set({ activeConversation: conversation })
  },

  fetchMessages: async (conversationId) => {
    set({ isMessagesLoading: true, error: null })
    try {
      const messages = await chatService.getMessages(conversationId)
      set((state) => ({
        messages: { ...state.messages, [conversationId]: messages },
        isMessagesLoading: false
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to fetch messages',
        isMessagesLoading: false
      })
    }
  },

  sendMessage: async (conversationId, content) => {
    try {
      const message = await chatService.sendMessage(conversationId, content)
      get().addMessage(message)
      get().updateConversationLastMessage(conversationId, message)
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to send message'
      })
      throw error
    }
  },

  addMessage: (message) => {
    set((state) => {
      const conversationMessages = state.messages[message.conversationId] || []
      const messageExists = conversationMessages.some(
        (m) => m.id === message.id
      )

      if (messageExists) {
        return state
      }

      return {
        messages: {
          ...state.messages,
          [message.conversationId]: [...conversationMessages, message]
        }
      }
    })
  },

  updateConversationLastMessage: (conversationId, message) => {
    set((state) => {
      const updatedConversations = state.conversations.map((conv) =>
        conv.id === conversationId
          ? { ...conv, lastMessage: message, updatedAt: message.createdAt }
          : conv
      )

      updatedConversations.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )

      return { conversations: updatedConversations }
    })
  },

  clearError: () => {
    set({ error: null })
  }
}))

export function initializeSocketListeners(): () => void {
  const handleNewMessage = (message: Message) => {
    useChatStore.getState().addMessage(message)
    useChatStore
      .getState()
      .updateConversationLastMessage(message.conversationId, message)
  }

  socketClient.on('new_message', handleNewMessage)

  return () => {
    socketClient.off('new_message', handleNewMessage)
  }
}
