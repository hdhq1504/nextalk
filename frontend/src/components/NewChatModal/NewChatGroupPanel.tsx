import { Loader2, Search, Users, X } from 'lucide-react'
import { getInitials } from '@/utils/format'
import type { Friend } from '@/types/friend'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

interface NewChatGroupPanelProps {
  friends: Friend[]
  filteredFriends: Friend[]
  groupName: string
  isCreatingGroup: boolean
  isLoading: boolean
  query: string
  selectedMemberIds: string[]
  selectedMembers: Pick<Friend, 'friendId' | 'friend'>[]
  onCreateGroup: () => void
  onGroupNameChange: (name: string) => void
  onQueryChange: (query: string) => void
  onToggleMember: (friendId: string) => void
}

export function NewChatGroupPanel({
  friends,
  filteredFriends,
  groupName,
  isCreatingGroup,
  isLoading,
  query,
  selectedMemberIds,
  selectedMembers,
  onCreateGroup,
  onGroupNameChange,
  onQueryChange,
  onToggleMember
}: NewChatGroupPanelProps) {
  return (
    <>
      <div className='space-y-3 px-5'>
        <div>
          <label className='text-muted-foreground mb-1 block text-xs font-medium'>
            Group name
          </label>
          <Input
            value={groupName}
            onChange={(event) => onGroupNameChange(event.target.value)}
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
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder='Search friends...'
              className='pl-9'
            />
          </div>
        </div>
      </div>

      <div className='max-h-52 overflow-y-auto px-2'>
        {isLoading ? (
          <GroupSkeleton />
        ) : filteredFriends.length === 0 ? (
          <EmptyMembersState
            message={
              friends.length === 0 ? 'No friends yet' : 'No friends found'
            }
          />
        ) : (
          filteredFriends.map(({ friendId, friend }) => {
            const isChecked = selectedMemberIds.includes(friendId)

            return (
              <button
                key={friendId}
                type='button'
                onClick={() => onToggleMember(friendId)}
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
                    <AvatarImage src={friend.avatarUrl} alt={friend.username} />
                  )}
                  <AvatarFallback>
                    {getInitials(friend.username, 1)}
                  </AvatarFallback>
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
        <SelectedMembers
          selectedMembers={selectedMembers}
          onToggleMember={onToggleMember}
        />
      )}

      <div className='border-t px-5 pt-3 pb-5'>
        <Button
          className='w-full'
          onClick={onCreateGroup}
          disabled={
            isCreatingGroup || !groupName.trim() || selectedMemberIds.length < 2
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
  )
}

function GroupSkeleton() {
  return (
    <div className='flex flex-col gap-2 p-2'>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className='flex items-center gap-3 px-3 py-2'>
          <Skeleton className='h-8 w-8 rounded-full' />
          <div className='flex flex-1 flex-col gap-1'>
            <Skeleton className='h-3 w-20' />
            <Skeleton className='h-2.5 w-28' />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyMembersState({ message }: { message: string }) {
  return (
    <div className='flex h-20 flex-col items-center justify-center gap-2 px-4 text-center'>
      <Users className='text-muted-foreground size-5' />
      <p className='text-muted-foreground text-xs'>{message}</p>
    </div>
  )
}

function SelectedMembers({
  selectedMembers,
  onToggleMember
}: {
  selectedMembers: Pick<Friend, 'friendId' | 'friend'>[]
  onToggleMember: (friendId: string) => void
}) {
  return (
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
              onClick={(event) => {
                event.stopPropagation()
                onToggleMember(friendId)
              }}
              className='hover:text-foreground text-muted-foreground ml-0.5'
            >
              <X className='size-2.5' />
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}
