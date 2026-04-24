import type { ConversationMember } from '@/types/chat'

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
