import { useEffect, useState } from 'react'
import { Loader2, MessageSquarePlus, Search, Users } from 'lucide-react'
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

export function NewChatModal({
  open,
  onOpenChange,
  onConversationCreated
}: NewChatModalProps) {
  const createDirectConversation = useChatStore(
    (state) => state.createDirectConversation
  )
  const [friends, setFriends] = useState<Friend[]>([])
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='gap-4 p-0 sm:max-w-md'>
        <DialogHeader className='px-5 pt-5'>
          <DialogTitle className='flex items-center gap-2'>
            <MessageSquarePlus className='size-4' />
            New Chat
          </DialogTitle>
          <DialogDescription>
            Choose a friend to start a direct conversation.
          </DialogDescription>
        </DialogHeader>

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
                {friends.length === 0 ? 'No friends yet' : 'No friends found'}
              </p>
            </div>
          ) : (
            filteredFriends.map(({ friendId, friend }) => {
              const isSelected = selectedFriendId === friendId
              const initials = friend.username.slice(0, 2).toUpperCase()

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
      </DialogContent>
    </Dialog>
  )
}
