import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { friendService } from '@/services/friend.service'
import { useChatStore } from '@/stores/chat-store'
import { useDebounce } from '@/hooks/useDebounce'
import { matchesUserQuery } from '@/utils/friend'
import type { Friend } from '@/types/friend'

type NewChatTab = 'direct' | 'group'

interface UseNewChatModalOptions {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConversationCreated?: () => void
}

export function useNewChatModal({
  open,
  onOpenChange,
  onConversationCreated
}: UseNewChatModalOptions) {
  const createDirectConversation = useChatStore(
    (state) => state.createDirectConversation
  )
  const createGroupConversation = useChatStore(
    (state) => state.createGroupConversation
  )

  const [tab, setTab] = useState<NewChatTab>('direct')
  const [friends, setFriends] = useState<Friend[]>([])
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null)
  const [groupName, setGroupName] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const debouncedQuery = useDebounce(query, 200)

  useEffect(() => {
    if (!open) {
      setTab('direct')
      setQuery('')
      setSelectedFriendId(null)
      setGroupName('')
      setSelectedMemberIds([])
      setIsCreatingGroup(false)
      return
    }

    setIsLoading(true)
    friendService
      .getFriends()
      .then(setFriends)
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : 'Failed to load friends'
        )
      })
      .finally(() => setIsLoading(false))
  }, [open])

  const filteredFriends = useMemo(
    () =>
      friends.filter(({ friend }) => matchesUserQuery(friend, debouncedQuery)),
    [debouncedQuery, friends]
  )

  const selectedMembers = useMemo(
    () =>
      friends
        .filter(({ friendId }) => selectedMemberIds.includes(friendId))
        .map(({ friendId, friend }) => ({ friendId, friend })),
    [friends, selectedMemberIds]
  )

  const handleSelectFriend = async (friendId: string) => {
    setSelectedFriendId(friendId)
    try {
      await createDirectConversation(friendId)
      onOpenChange(false)
      onConversationCreated?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to start chat'
      )
    } finally {
      setSelectedFriendId(null)
    }
  }

  const toggleMemberSelection = (friendId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    )
  }

  const handleCreateGroup = async () => {
    const trimmedName = groupName.trim()
    if (!trimmedName) {
      toast.error('Please enter a group name')
      return
    }
    if (selectedMemberIds.length < 2) {
      toast.error('Please select at least 2 members')
      return
    }

    setIsCreatingGroup(true)
    try {
      await createGroupConversation(trimmedName, selectedMemberIds)
      onOpenChange(false)
      onConversationCreated?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create group'
      )
    } finally {
      setIsCreatingGroup(false)
    }
  }

  return {
    tab,
    friends,
    query,
    isLoading,
    selectedFriendId,
    groupName,
    selectedMemberIds,
    isCreatingGroup,
    filteredFriends,
    selectedMembers,
    setTab,
    setQuery,
    setGroupName,
    handleSelectFriend,
    toggleMemberSelection,
    handleCreateGroup
  }
}
