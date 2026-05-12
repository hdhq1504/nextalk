import type { User } from '@/types/auth'
import type { Conversation, Message, OptimisticMessage } from '@/types/chat'

export function sortConversationsByUpdate(
  conversations: Conversation[]
): Conversation[] {
  return [...conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

export function createOptimisticMessage({
  content,
  conversationId,
  currentUser,
  imageUrls,
  replyToId,
  type
}: {
  content: string | null
  conversationId: string
  currentUser: User
  imageUrls?: string[]
  replyToId?: string
  type: NonNullable<Message['type']>
}): OptimisticMessage {
  const tempId = `temp_${Date.now()}_${Math.random()}`
  const now = new Date().toISOString()

  return {
    id: tempId,
    conversationId,
    senderId: currentUser.id,
    sender: currentUser,
    content,
    createdAt: now,
    updatedAt: now,
    type,
    imageUrls,
    _tempId: tempId,
    _status: 'pending',
    replyToId: replyToId || null
  }
}

export function removeOptimisticMessage(
  messages: Message[],
  tempId: string
): Message[] {
  return messages.filter(
    (message) =>
      !('_tempId' in message) ||
      (message as OptimisticMessage)._tempId !== tempId
  )
}

export function isOptimisticMessage(
  message: Message
): message is OptimisticMessage {
  return '_tempId' in message
}

export function isMatchingOptimisticMessage(
  optimisticMessage: Message,
  message: Message
): boolean {
  if (!isOptimisticMessage(optimisticMessage)) return false

  return (
    optimisticMessage.conversationId === message.conversationId &&
    optimisticMessage.senderId === message.senderId &&
    optimisticMessage.type === message.type &&
    optimisticMessage.content === message.content &&
    optimisticMessage.replyToId === message.replyToId
  )
}

export function upsertServerMessage(
  messages: Message[],
  message: Message,
  tempId?: string
): Message[] {
  let inserted = false
  const updatedMessages: Message[] = []

  // Check if message already exists to prevent duplicates
  const existingIndex = messages.findIndex((m) => m.id === message.id)
  if (existingIndex !== -1) {
    // Update existing message instead of adding
    const newMessages = [...messages]
    newMessages[existingIndex] = message
    return newMessages
  }

  for (const currentMessage of messages) {
    const isTargetOptimistic =
      isOptimisticMessage(currentMessage) &&
      (currentMessage._tempId === tempId ||
        isMatchingOptimisticMessage(currentMessage, message))
    const isSameServerMessage = currentMessage.id === message.id

    if (isTargetOptimistic || isSameServerMessage) {
      if (!inserted) {
        updatedMessages.push(message)
        inserted = true
      }
      continue
    }

    updatedMessages.push(currentMessage)
  }

  if (!inserted) {
    updatedMessages.push(message)
  }

  return updatedMessages
}
