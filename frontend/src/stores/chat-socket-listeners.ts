import {
  normalizeConversation,
  normalizeMessage
} from '@/services/chat.service'
import { socketClient } from '@/lib/socket'
import { useChatStore } from '@/stores/chat-store'
import type { ReactionSummary } from '@/types/chat'

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
      imageUrl: null,
      imageUrls: null
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

  const handleMemberAdded = (data: unknown) => {
    const { conversation } = data as {
      conversationId: string
      userId: string
      conversation: unknown
    }
    useChatStore
      .getState()
      .upsertConversation(
        normalizeConversation(
          conversation as Parameters<typeof normalizeConversation>[0]
        )
      )
  }

  const handleMemberRemoved = (data: unknown) => {
    const { conversationId, userId } = data as {
      conversationId: string
      userId: string
    }
    useChatStore.getState().removeMemberFromConversation(conversationId, userId)
  }

  const handleConversationGroupUpdated = (data: unknown) => {
    useChatStore
      .getState()
      .upsertConversation(
        normalizeConversation(
          data as Parameters<typeof normalizeConversation>[0]
        )
      )
  }

  socketClient.on('message:new', handleNewMessage)
  socketClient.on('conversation:update', handleConversationUpdate)
  socketClient.on('message:recall', handleMessageRecall)
  socketClient.on('message:react', handleMessageReact)
  socketClient.on('conversation:member_added', handleMemberAdded)
  socketClient.on('conversation:member_removed', handleMemberRemoved)
  socketClient.on('conversation:updated', handleConversationGroupUpdated)

  socketClient.setReconnectHandler(() => {
    cleanup()
    cleanup = initializeSocketListeners()
  })

  let cleanup = () => {
    socketClient.off('message:new', handleNewMessage)
    socketClient.off('conversation:update', handleConversationUpdate)
    socketClient.off('message:recall', handleMessageRecall)
    socketClient.off('message:react', handleMessageReact)
    socketClient.off('conversation:member_added', handleMemberAdded)
    socketClient.off('conversation:member_removed', handleMemberRemoved)
    socketClient.off('conversation:updated', handleConversationGroupUpdated)
  }

  return cleanup
}
