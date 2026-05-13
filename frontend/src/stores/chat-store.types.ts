import type { chatService } from '@/services/chat.service'
import type { Conversation, Message, OptimisticMessage } from '@/types/chat'

type ChatServiceMethod<T extends keyof typeof chatService> =
  (typeof chatService)[T]

export interface ChatState {
  conversations: Conversation[]
  activeConversation: Conversation | null
  messages: Record<string, Message[]>
  messageCursors: Record<string, string | undefined>
  hasMoreMessages: Record<string, boolean>
  conversationsController?: AbortController
  messagesController?: AbortController
  isLoading: boolean
  isMessagesLoading: boolean
  error: string | null
  replyingTo: Message | null
  searchQuery: string
  searchResults: Message[]
  isSearching: boolean

  fetchConversations: () => Promise<Conversation[]>
  setActiveConversation: (conversation: Conversation | null) => void
  fetchMessages: (conversationId: string) => Promise<void>
  loadMoreMessages: (conversationId: string) => Promise<void>
  searchMessages: (conversationId: string, query: string) => Promise<void>
  clearSearch: () => void
  createDirectConversation: ChatServiceMethod<'createDirectConversation'>
  createGroupConversation: ChatServiceMethod<'createGroupConversation'>
  addGroupMember: ChatServiceMethod<'addGroupMember'>
  removeGroupMember: ChatServiceMethod<'removeGroupMember'>
  deleteConversation: ChatServiceMethod<'deleteConversation'>
  removeConversation: ChatServiceMethod<'removeConversation'>
  updateGroupInfo: ChatServiceMethod<'updateGroupInfo'>
  leaveGroup: ChatServiceMethod<'leaveGroup'>
  sendMessage: (
    ...args: Parameters<ChatServiceMethod<'sendMessage'>>
  ) => Promise<void>
  sendImageMessage: (
    ...args: Parameters<ChatServiceMethod<'sendImageMessage'>>
  ) => Promise<void>
  addOptimisticMessage: (message: OptimisticMessage) => void
  replaceOptimisticMessage: (tempId: string, message: Message) => void
  updateMessageStatus: (
    tempId: string,
    status: 'pending' | 'sent' | 'failed'
  ) => void
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
    reactions: Message['reactions']
  ) => void
  removeMemberFromConversation: (conversationId: string, userId: string) => void
  removeConversationFromStore: (conversationId: string) => void
  resetStore: () => void
}
