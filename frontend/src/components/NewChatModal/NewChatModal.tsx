import { useEffect, useState } from 'react'
import { Loader2, MessageSquarePlus, Search, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { friendService } from '@/services/friend.service'
import { useChatStore } from '@/stores/chat-store'
import type { Friend } from '@/types/friend'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface NewChatModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConversationCreated?: () => void
}

type Tab = 'direct' | 'group'

export function NewChatModal({
  open,
  onOpenChange,
  onConversationCreated
}: NewChatModalProps) {
  const createDirectConversation = useChatStore(
    (state) => state.createDirectConversation
  )
  const createGroupConversation = useChatStore(
    (state) => state.createGroupConversation
  )

  const [tab, setTab] = useState<Tab>('direct')
  const [friends, setFriends] = useState<Friend[]>([])
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null)

  const [groupName, setGroupName] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)

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

  const filteredFriends = friends.filter(({ friend }) => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return true

    return (
      friend.username.toLowerCase().includes(normalizedQuery) ||
      friend.email.toLowerCase().includes(normalizedQuery)
    )
  })

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

  const selectedMembers = friends
    .filter(({ friendId }) => selectedMemberIds.includes(friendId))
    .map(({ friendId, friend }) => ({ friendId, friend }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='gap-4 p-0 sm:max-w-md'>
        <DialogHeader className='px-5 pt-5'>
          <DialogTitle className='flex items-center gap-2'>
            <MessageSquarePlus className='size-4' />
            New Chat
          </DialogTitle>
          <DialogDescription>
            Start a direct chat or create a group.
          </DialogDescription>
        </DialogHeader>

        <div className='flex border-b px-5'>
          <button
            type='button'
            onClick={() => setTab('direct')}
            className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-1 py-2 text-sm font-medium transition-colors ${
              tab === 'direct'
                ? 'border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}
          >
            <MessageSquarePlus className='size-3.5' />
            Direct
          </button>
          <button
            type='button'
            onClick={() => setTab('group')}
            className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-1 py-2 text-sm font-medium transition-colors ${
              tab === 'group'
                ? 'border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}
          >
            <Users className='size-3.5' />
            Group
          </button>
        </div>

        {tab === 'direct' ? (
          <>
            <div className='px-5'>
              <div className='relative'>
                <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder='Search friends...'
                  className='pl-9'
                />
              </div>
            </div>

            <div className='max-h-80 overflow-y-auto px-2 pb-2'>
              {isLoading ? (
                <div className='flex h-32 items-center justify-center'>
                  <Loader2 className='text-muted-foreground size-5 animate-spin' />
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className='flex h-32 flex-col items-center justify-center gap-2 px-4 text-center'>
                  <Users className='text-muted-foreground size-6' />
                  <p className='text-muted-foreground text-sm'>
                    {friends.length === 0
                      ? 'No friends yet'
                      : 'No friends found'}
                  </p>
                </div>
              ) : (
                filteredFriends.map(({ friendId, friend }) => {
                  const isSelected = selectedFriendId === friendId
                  const initials = friend.username.slice(0, 1).toUpperCase()

                  return (
                    <Button
                      key={friendId}
                      type='button'
                      variant='ghost'
                      className='h-auto w-full justify-start gap-3 px-3 py-2'
                      disabled={selectedFriendId !== null}
                      onClick={() => handleSelectFriend(friendId)}
                    >
                      <Avatar>
                        {friend.avatarUrl && (
                          <AvatarImage
                            src={friend.avatarUrl}
                            alt={friend.username}
                          />
                        )}
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <span className='min-w-0 flex-1 text-left'>
                        <span className='block truncate text-sm font-medium'>
                          {friend.username}
                        </span>
                        <span className='text-muted-foreground block truncate text-xs'>
                          {friend.email}
                        </span>
                      </span>
                      {isSelected && (
                        <Loader2 className='text-muted-foreground size-4 animate-spin' />
                      )}
                    </Button>
                  )
                })
              )}
            </div>
          </>
        ) : (
          <>
            <div className='space-y-3 px-5'>
              <div>
                <label className='text-muted-foreground mb-1 block text-xs font-medium'>
                  Group name
                </label>
                <Input
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder='Enter group name...'
                  maxLength={100}
                />
              </div>

              <div>
                <label className='text-muted-foreground mb-1 block text-xs font-medium'>
                  Select members (at least 2)
                </label>
                <div className='relative'>
                  <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder='Search friends...'
                    className='pl-9'
                  />
                </div>
              </div>
            </div>

            <div className='max-h-52 overflow-y-auto px-2'>
              {isLoading ? (
                <div className='flex h-20 items-center justify-center'>
                  <Loader2 className='text-muted-foreground size-5 animate-spin' />
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className='flex h-20 flex-col items-center justify-center gap-2 px-4 text-center'>
                  <Users className='text-muted-foreground size-5' />
                  <p className='text-muted-foreground text-xs'>
                    {friends.length === 0
                      ? 'No friends yet'
                      : 'No friends found'}
                  </p>
                </div>
              ) : (
                filteredFriends.map(({ friendId, friend }) => {
                  const isChecked = selectedMemberIds.includes(friendId)
                  const initials = friend.username.slice(0, 1).toUpperCase()

                  return (
                    <button
                      key={friendId}
                      type='button'
                      onClick={() => toggleMemberSelection(friendId)}
                      className='hover:bg-accent flex h-auto w-full items-center gap-3 rounded-md px-3 py-2 text-left'
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-medium ${
                          isChecked
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/30'
                        }`}
                      >
                        {isChecked && (
                          <svg
                            className='size-3'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              d='M5 13l4 4L19 7'
                            />
                          </svg>
                        )}
                      </div>
                      <Avatar className='size-8'>
                        {friend.avatarUrl && (
                          <AvatarImage
                            src={friend.avatarUrl}
                            alt={friend.username}
                          />
                        )}
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <span className='min-w-0 flex-1'>
                        <span className='block truncate text-sm font-medium'>
                          {friend.username}
                        </span>
                      </span>
                    </button>
                  )
                })
              )}
            </div>

            {selectedMembers.length > 0 && (
              <div className='border-t px-5 py-3'>
                <label className='text-muted-foreground mb-2 block text-xs font-medium'>
                  Selected ({selectedMembers.length})
                </label>
                <div className='flex flex-wrap gap-1.5'>
                  {selectedMembers.map(({ friendId, friend }) => (
                    <span
                      key={friendId}
                      className='bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs'
                    >
                      {friend.username}
                      <button
                        type='button'
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleMemberSelection(friendId)
                        }}
                        className='hover:text-foreground text-muted-foreground ml-0.5'
                      >
                        <X className='size-2.5' />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className='border-t px-5 pt-3 pb-5'>
              <Button
                className='w-full'
                onClick={handleCreateGroup}
                disabled={
                  isCreatingGroup ||
                  !groupName.trim() ||
                  selectedMemberIds.length < 2
                }
              >
                {isCreatingGroup ? (
                  <>
                    <Loader2 className='mr-2 size-4 animate-spin' />
                    Creating...
                  </>
                ) : (
                  'Create Group'
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
