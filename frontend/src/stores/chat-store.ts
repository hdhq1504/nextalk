import { create } from 'zustand'
import { chatService } from '@/services/chat.service'
import { socketClient } from '@/lib/socket'
import { useAuthStore } from '@/stores/auth-store'
import {
  createOptimisticMessage,
  removeOptimisticMessage,
  sortConversationsByUpdate,
  upsertServerMessage
} from '@/stores/chat-store.helpers'
import type { ChatState } from '@/stores/chat-store.types'
import type { Message, OptimisticMessage } from '@/types/chat'

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: {},
  messageCursors: {},
  hasMoreMessages: {},
  isLoading: false,
  isMessagesLoading: false,
  error: null,
  replyingTo: null,
  searchQuery: '',
  searchResults: [],
  isSearching: false,

  fetchConversations: async () => {
    get().conversationsController?.abort()
    const controller = new AbortController()
    set({ conversationsController: controller, isLoading: true, error: null })
    try {
      const conversations = await chatService.getConversations(
        controller.signal
      )
      set({
        conversations,
        isLoading: false,
        conversationsController: undefined
      })
      return conversations
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return []
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch conversations',
        isLoading: false,
        conversationsController: undefined
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
    get().messagesController?.abort()
    const controller = new AbortController()
    set({
      messagesController: controller,
      isMessagesLoading: true,
      error: null
    })
    try {
      const result = await chatService.getMessages(
        conversationId,
        undefined,
        50,
        controller.signal
      )
      set((state) => ({
        messages: { ...state.messages, [conversationId]: result.messages },
        messageCursors: {
          ...state.messageCursors,
          [conversationId]: result.nextCursor
        },
        hasMoreMessages: {
          ...state.hasMoreMessages,
          [conversationId]: !!result.nextCursor
        },
        isMessagesLoading: false,
        messagesController: undefined
      }))
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      set({
        error:
          error instanceof Error ? error.message : 'Failed to fetch messages',
        isMessagesLoading: false,
        messagesController: undefined
      })
    }
  },

  loadMoreMessages: async (conversationId) => {
    const cursor = get().messageCursors[conversationId]
    if (!cursor || !get().hasMoreMessages[conversationId]) return

    set({ isMessagesLoading: true, error: null })
    try {
      const result = await chatService.getMessages(conversationId, cursor)
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: [
            ...state.messages[conversationId],
            ...result.messages
          ]
        },
        messageCursors: {
          ...state.messageCursors,
          [conversationId]: result.nextCursor
        },
        hasMoreMessages: {
          ...state.hasMoreMessages,
          [conversationId]: !!result.nextCursor
        },
        isMessagesLoading: false
      }))
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load more messages',
        isMessagesLoading: false
      })
    }
  },

  searchMessages: async (conversationId, query) => {
    if (!query.trim()) {
      set({ searchResults: [], searchQuery: '', isSearching: false })
      return
    }
    set({ searchQuery: query, isSearching: true, error: null })
    try {
      const result = await chatService.searchMessages(conversationId, query)
      set({ searchResults: result.messages, isSearching: false })
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to search messages',
        isSearching: false,
        searchResults: []
      })
    }
  },

  clearSearch: () => {
    set({ searchQuery: '', searchResults: [], isSearching: false })
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

  createGroupConversation: async (name, memberIds) => {
    set({ isLoading: true, error: null })
    try {
      const conversation = await chatService.createGroupConversation(
        name,
        memberIds
      )
      get().upsertConversation(conversation)
      get().setActiveConversation(conversation)
      await get().fetchMessages(conversation.id)
      set({ isLoading: false })
      return conversation
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to create group',
        isLoading: false
      })
      throw error
    }
  },

  addGroupMember: async (conversationId, userId) => {
    set({ error: null })
    try {
      const conversation = await chatService.addGroupMember(
        conversationId,
        userId
      )
      get().upsertConversation(conversation)
      return conversation
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add member'
      })
      throw error
    }
  },

  removeGroupMember: async (conversationId, userId) => {
    set({ error: null })
    try {
      await chatService.removeGroupMember(conversationId, userId)
      get().removeMemberFromConversation(conversationId, userId)
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Failed to remove member'
      })
      throw error
    }
  },

  deleteConversation: async (conversationId) => {
    set({ error: null })
    try {
      await chatService.deleteConversation(conversationId)
      get().removeConversationFromStore(conversationId)
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete conversation'
      })
      throw error
    }
  },

  removeConversation: async (conversationId) => {
    set({ error: null })
    try {
      await chatService.removeConversation(conversationId)
      get().removeConversationFromStore(conversationId)
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to remove conversation'
      })
      throw error
    }
  },

  updateGroupInfo: async (conversationId, data) => {
    set({ error: null })
    try {
      const conversation = await chatService.updateGroupInfo(
        conversationId,
        data
      )
      get().upsertConversation(conversation)
      return conversation
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update group'
      })
      throw error
    }
  },

  leaveGroup: async (conversationId) => {
    set({ error: null })
    try {
      await chatService.leaveGroup(conversationId)
      get().removeMemberFromConversation(conversationId, '')
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to leave group'
      })
      throw error
    }
  },

  sendMessage: async (conversationId, content, replyToId) => {
    const currentUser = useAuthStore.getState().user
    if (!currentUser) return

    const optimisticMessage = createOptimisticMessage({
      conversationId,
      content,
      type: 'text',
      currentUser,
      replyToId
    })

    get().addOptimisticMessage(optimisticMessage)
    set({ replyingTo: null })

    try {
      const message = await chatService.sendMessage(
        conversationId,
        content,
        replyToId
      )
      get().replaceOptimisticMessage(optimisticMessage._tempId, message)
      get().updateConversationLastMessage(conversationId, message)
    } catch (error) {
      get().updateMessageStatus(optimisticMessage._tempId, 'failed')
      set({
        error: error instanceof Error ? error.message : 'Failed to send message'
      })
      throw error
    }
  },

  sendImageMessage: async (conversationId, files, content, replyToId) => {
    const currentUser = useAuthStore.getState().user
    if (!currentUser) return

    const optimisticMessage = createOptimisticMessage({
      conversationId,
      content: content || null,
      type: 'image',
      imageUrls: files.map(() => URL.createObjectURL(files[0])),
      currentUser,
      replyToId
    })

    get().addOptimisticMessage(optimisticMessage)
    set({ replyingTo: null })

    try {
      const message = await chatService.sendImageMessage(
        conversationId,
        files,
        content,
        replyToId
      )
      get().replaceOptimisticMessage(optimisticMessage._tempId, message)
      get().updateConversationLastMessage(conversationId, message)
    } catch (error) {
      get().updateMessageStatus(optimisticMessage._tempId, 'failed')
      set({
        error: error instanceof Error ? error.message : 'Failed to send image'
      })
      throw error
    }
  },

  addOptimisticMessage: (message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [message.conversationId]: [
          ...(state.messages[message.conversationId] || []),
          message
        ]
      }
    }))
  },

  replaceOptimisticMessage: (tempId, message) => {
    set((state) => {
      const conversationMessages = state.messages[message.conversationId] || []
      const messagesWithoutTemp = removeOptimisticMessage(
        conversationMessages,
        tempId
      )
      const updatedMessages = upsertServerMessage(messagesWithoutTemp, message)

      return {
        messages: {
          ...state.messages,
          [message.conversationId]: updatedMessages
        }
      }
    })
  },

  updateMessageStatus: (tempId, status) => {
    set((state) => {
      const updatedMessages: Record<string, (Message | OptimisticMessage)[]> =
        {}
      for (const [convId, msgs] of Object.entries(state.messages)) {
        updatedMessages[convId] = msgs.map((m) => {
          if ('_tempId' in m && m._tempId === tempId) {
            return { ...m, _status: status }
          }
          return m
        })
      }
      return { messages: updatedMessages }
    })
  },

  addMessage: (message) => {
    set((state) => {
      const conversationMessages = state.messages[message.conversationId] || []

      // Prevent duplicate messages - check if message already exists
      const messageExists = conversationMessages.some(
        (m) => m.id === message.id
      )
      if (messageExists) {
        return state
      }

      const updatedMessages = upsertServerMessage(conversationMessages, message)

      return {
        messages: {
          ...state.messages,
          [message.conversationId]: updatedMessages
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

      return {
        conversations: sortConversationsByUpdate(conversations),
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

      return { conversations: sortConversationsByUpdate(updatedConversations) }
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
  },

  removeMemberFromConversation: (conversationId, userId) => {
    set((state) => {
      if (!userId) {
        const updatedConversations = state.conversations.filter(
          (conv) => conv.id !== conversationId
        )
        return {
          conversations: updatedConversations,
          activeConversation:
            state.activeConversation?.id === conversationId
              ? null
              : state.activeConversation
        }
      }

      const updatedConversations = state.conversations
        .map((conv) => {
          if (conv.id !== conversationId) return conv
          return {
            ...conv,
            members: conv.members.filter((m) => m.userId !== userId)
          }
        })
        .filter((conv) => conv.members.length > 0)

      return {
        conversations: updatedConversations,
        activeConversation:
          state.activeConversation?.id === conversationId
            ? {
                ...state.activeConversation,
                members: state.activeConversation.members.filter(
                  (m) => m.userId !== userId
                )
              }
            : state.activeConversation
      }
    })
  },

  removeConversationFromStore: (conversationId) => {
    set((state) => {
      const messages = { ...state.messages }
      const messageCursors = { ...state.messageCursors }
      const hasMoreMessages = { ...state.hasMoreMessages }

      delete messages[conversationId]
      delete messageCursors[conversationId]
      delete hasMoreMessages[conversationId]

      return {
        conversations: state.conversations.filter(
          (conversation) => conversation.id !== conversationId
        ),
        activeConversation:
          state.activeConversation?.id === conversationId
            ? null
            : state.activeConversation,
        messages,
        messageCursors,
        hasMoreMessages
      }
    })
  },

  resetStore: () => {
    get().conversationsController?.abort()
    get().messagesController?.abort()
    set({
      conversations: [],
      activeConversation: null,
      messages: {},
      messageCursors: {},
      hasMoreMessages: {},
      conversationsController: undefined,
      messagesController: undefined,
      isLoading: false,
      isMessagesLoading: false,
      error: null,
      replyingTo: null,
      searchQuery: '',
      searchResults: [],
      isSearching: false
    })
  }
}))
