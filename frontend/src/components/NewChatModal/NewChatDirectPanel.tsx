import { Loader2, Search, Users } from 'lucide-react'
import { getInitials } from '@/utils/format'
import type { Friend } from '@/types/friend'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

interface NewChatDirectPanelProps {
  friends: Friend[]
  filteredFriends: Friend[]
  isLoading: boolean
  query: string
  selectedFriendId: string | null
  onQueryChange: (query: string) => void
  onSelectFriend: (friendId: string) => void
}

export function NewChatDirectPanel({
  friends,
  filteredFriends,
  isLoading,
  query,
  selectedFriendId,
  onQueryChange,
  onSelectFriend
}: NewChatDirectPanelProps) {
  return (
    <>
      <div className='px-5'>
        <div className='relative'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder='Search friends...'
            className='pl-9'
          />
        </div>
      </div>

      <div className='max-h-80 overflow-y-auto px-2 pb-2'>
        {isLoading ? (
          <DirectSkeleton />
        ) : filteredFriends.length === 0 ? (
          <EmptyFriendsState
            message={
              friends.length === 0 ? 'No friends yet' : 'No friends found'
            }
          />
        ) : (
          filteredFriends.map(({ friendId, friend }) => {
            const isSelected = selectedFriendId === friendId

            return (
              <Button
                key={friendId}
                type='button'
                variant='ghost'
                className='h-auto w-full justify-start gap-3 px-3 py-2'
                disabled={selectedFriendId !== null}
                onClick={() => onSelectFriend(friendId)}
              >
                <Avatar>
                  {friend.avatarUrl && (
                    <AvatarImage src={friend.avatarUrl} alt={friend.username} />
                  )}
                  <AvatarFallback>
                    {getInitials(friend.username, 1)}
                  </AvatarFallback>
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
  )
}

function DirectSkeleton() {
  return (
    <div className='flex flex-col gap-2 p-2'>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className='flex items-center gap-3 px-3 py-2'>
          <Skeleton className='h-10 w-10 rounded-full' />
          <div className='flex flex-1 flex-col gap-1.5'>
            <Skeleton className='h-3.5 w-24' />
            <Skeleton className='h-3 w-32' />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyFriendsState({ message }: { message: string }) {
  return (
    <div className='flex h-32 flex-col items-center justify-center gap-2 px-4 text-center'>
      <Users className='text-muted-foreground size-6' />
      <p className='text-muted-foreground text-sm'>{message}</p>
    </div>
  )
}
