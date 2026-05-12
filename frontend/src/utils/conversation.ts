import { getInitials } from '@/utils/format'
import type { Conversation, ConversationMember } from '@/types/chat'

export function getOtherMember(
  members: ConversationMember[],
  currentUserId: string
): ConversationMember | undefined {
  return members.find((m) => m.userId !== currentUserId)
}

export function isLongMessage(content: string): boolean {
  const lines = content.split('\n').length
  const hasLongLine = content.split('\n').some((line) => line.length > 40)
  return lines > 2 || hasLongLine || content.length > 100
}

export function getConversationDisplayInfo(
  conversation: Conversation,
  currentUserId: string
) {
  const otherMember = getOtherMember(conversation.members, currentUserId)
  const displayName =
    conversation.name ||
    otherMember?.user.username ||
    otherMember?.user.email ||
    'Unknown'

  return {
    otherMember,
    displayName,
    avatarUrl: otherMember?.user.avatarUrl,
    initials: getInitials(displayName, 1),
    isGroup: conversation.isGroup,
    memberCount: conversation.members.length
  }
}

export function getLastMessagePreview(
  conversation: Conversation
): string | null {
  if (!conversation.lastMessage) return null

  if (conversation.lastMessage.type === 'image') {
    return conversation.lastMessage.content || 'Ảnh'
  }

  return conversation.lastMessage.content
}

export function matchesConversationQuery(
  conversation: Conversation,
  currentUserId: string | undefined,
  query: string
): boolean {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true

  const { displayName } = getConversationDisplayInfo(
    conversation,
    currentUserId || ''
  )

  return displayName.toLowerCase().includes(normalizedQuery)
}
