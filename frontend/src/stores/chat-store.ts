import { create } from 'zustand'
import {
  chatService,
  normalizeConversation,
  normalizeMessage
} from '@/services/chat.service'
import { socketClient } from '@/lib/socket'
import type { Conversation, Message, ReactionSummary } from '@/types/chat'

interface ChatState {
  conversations: Conversation[]
  activeConversation: Conversation | null
  messages: Record<string, Message[]>
  isLoading: boolean
  isMessagesLoading: boolean
  error: string | null
  replyingTo: Message | null

  fetchConversations: () => Promise<Conversation[]>
  setActiveConversation: (conversation: Conversation | null) => void
  fetchMessages: (conversationId: string) => Promise<void>
  createDirectConversation: (friendId: string) => Promise<Conversation>
  sendMessage: (
    conversationId: string,
    content: string,
    replyToId?: string
  ) => Promise<void>
  sendImageMessage: (
    conversationId: string,
    file: File,
    content?: string,
    replyToId?: string
  ) => Promise<void>
  addMessage: (message: Message) => void
  upsertConversation: (conversation: Conversation) => void
  updateConversationLastMessage: (
    conversationId: string,
    message: Message
  ) => void
  clearError: () => void
  setReplyingTo: (message: Message | null) => void
  recallMessage: (messageId: string) => Promise<void>
  reactToMessage: (messageId: string, emoji: string) => Promise<void>
  updateMessage: (
    messageId: string,
    conversationId: string,
    patch: Partial<Message>
  ) => void
  updateMessageReactions: (
    messageId: string,
    conversationId: string,
    reactions: ReactionSummary[]
  ) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: {},
  isLoading: false,
  isMessagesLoading: false,
  error: null,
  replyingTo: null,

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
    const currentConversation = get().activeConversation
    if (
      currentConversation?.id &&
      currentConversation.id !== conversation?.id
    ) {
      socketClient.emit('conversation:leave', {
        conversationId: currentConversation.id
      })
    }

    set({ activeConversation: conversation, replyingTo: null })

    if (conversation) {
      socketClient.emit('conversation:join', {
        conversationId: conversation.id
      })
    }
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

  createDirectConversation: async (friendId) => {
    set({ isLoading: true, error: null })
    try {
      const conversation = await chatService.createDirectConversation(friendId)
      get().upsertConversation(conversation)
      get().setActiveConversation(conversation)
      await get().fetchMessages(conversation.id)
      set({ isLoading: false })
      return conversation
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create conversation',
        isLoading: false
      })
      throw error
    }
  },

  sendMessage: async (conversationId, content, replyToId) => {
    try {
      const message = await chatService.sendMessage(
        conversationId,
        content,
        replyToId
      )
      get().addMessage(message)
      get().updateConversationLastMessage(conversationId, message)
      set({ replyingTo: null })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to send message'
      })
      throw error
    }
  },

  sendImageMessage: async (conversationId, file, content, replyToId) => {
    try {
      const message = await chatService.sendImageMessage(
        conversationId,
        file,
        content,
        replyToId
      )
      get().addMessage(message)
      get().updateConversationLastMessage(conversationId, message)
      set({ replyingTo: null })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to send image'
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

  upsertConversation: (conversation) => {
    set((state) => {
      const exists = state.conversations.some((c) => c.id === conversation.id)
      const conversations = exists
        ? state.conversations.map((c) =>
            c.id === conversation.id ? { ...c, ...conversation } : c
          )
        : [conversation, ...state.conversations]

      conversations.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )

      return {
        conversations,
        activeConversation:
          state.activeConversation?.id === conversation.id
            ? { ...state.activeConversation, ...conversation }
            : state.activeConversation
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
  },

  setReplyingTo: (message) => {
    set({ replyingTo: message })
  },

  recallMessage: async (messageId) => {
    try {
      await chatService.recallMessage(messageId)
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to recall message'
      })
      throw error
    }
  },

  reactToMessage: async (messageId, emoji) => {
    try {
      await chatService.reactMessage(messageId, emoji)
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to react to message'
      })
      throw error
    }
  },

  updateMessage: (messageId, conversationId, patch) => {
    set((state) => {
      const messages = state.messages[conversationId] || []
      return {
        messages: {
          ...state.messages,
          [conversationId]: messages.map((m) =>
            m.id === messageId ? { ...m, ...patch } : m
          )
        }
      }
    })
  },

  updateMessageReactions: (messageId, conversationId, reactions) => {
    set((state) => {
      const messages = state.messages[conversationId] || []
      return {
        messages: {
          ...state.messages,
          [conversationId]: messages.map((m) =>
            m.id === messageId ? { ...m, reactions } : m
          )
        }
      }
    })
  }
}))

export function initializeSocketListeners(): () => void {
  const handleNewMessage = (rawMessage: unknown) => {
    const message = normalizeMessage(
      rawMessage as Parameters<typeof normalizeMessage>[0]
    )
    useChatStore.getState().addMessage(message)
    useChatStore
      .getState()
      .updateConversationLastMessage(message.conversationId, message)
  }

  const handleConversationUpdate = (rawConversation: unknown) => {
    useChatStore
      .getState()
      .upsertConversation(
        normalizeConversation(
          rawConversation as Parameters<typeof normalizeConversation>[0]
        )
      )
  }

  const handleMessageRecall = (data: unknown) => {
    const { messageId, conversationId } = data as {
      messageId: string
      conversationId: string
    }
    useChatStore.getState().updateMessage(messageId, conversationId, {
      isDeleted: true,
      content: null,
      imageUrl: null
    })
  }

  const handleMessageReact = (data: unknown) => {
    const { messageId, conversationId, reactions } = data as {
      messageId: string
      conversationId: string
      reactions: ReactionSummary[]
    }
    useChatStore
      .getState()
      .updateMessageReactions(messageId, conversationId, reactions)
  }

  socketClient.on('message:new', handleNewMessage)
  socketClient.on('conversation:update', handleConversationUpdate)
  socketClient.on('message:recall', handleMessageRecall)
  socketClient.on('message:react', handleMessageReact)

  return () => {
    socketClient.off('message:new', handleNewMessage)
    socketClient.off('conversation:update', handleConversationUpdate)
    socketClient.off('message:recall', handleMessageRecall)
    socketClient.off('message:react', handleMessageReact)
  }
}
