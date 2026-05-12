import { cn } from '@/lib/utils'
import { getOtherMember } from '@/utils/conversation'
import type { Conversation } from '@/types/chat'
import { Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface ConversationHeaderProps {
  conversation: Conversation | null
  currentUserId: string
  className?: string
  onBack?: () => void
  onShowDetails?: () => void
  onShowUserInfo?: () => void
}

function GroupAvatar({ members, className }: { members: Conversation['members']; className?: string }) {
  const visibleMembers = members.slice(0, 4)
  const count = members.length

  if (visibleMembers.length === 1) {
    const m = visibleMembers[0]
    const initials = m.user.username.slice(0, 1).toUpperCase()
    return (
      <Avatar className={className}>
        {m.user.avatarUrl && <AvatarImage src={m.user.avatarUrl} alt={m.user.username} />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    )
  }

  if (visibleMembers.length === 2) {
    const [a, b] = visibleMembers
    return (
      <div className={cn('relative overflow-hidden rounded-full', className)}>
        <div className='flex aspect-square w-full'>
          <div className='w-1/2 overflow-hidden'>
            <Avatar className='h-full w-full rounded-none'>
              {a.user.avatarUrl && <AvatarImage src={a.user.avatarUrl} alt={a.user.username} />}
              <AvatarFallback className='text-[8px]'>{a.user.username.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
          <div className='w-1/2 overflow-hidden'>
            <Avatar className='h-full w-full rounded-none'>
              {b.user.avatarUrl && <AvatarImage src={b.user.avatarUrl} alt={b.user.username} />}
              <AvatarFallback className='text-[8px]'>{b.user.username.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-full bg-muted',
        className
      )}
    >
      <div className='flex aspect-square w-full flex-col'>
        <div className='flex h-1/2'>
          {visibleMembers.slice(0, 2).map((m) => (
            <div key={m.userId} className='w-1/2 overflow-hidden'>
              <Avatar className='h-full w-full rounded-none'>
                {m.user.avatarUrl && (
                  <AvatarImage src={m.user.avatarUrl} alt={m.user.username} />
                )}
                <AvatarFallback className='text-[6px]'>
                  {m.user.username.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          ))}
        </div>
        <div className='flex h-1/2'>
          {visibleMembers.slice(2, 4).map((m) => (
            <div key={m.userId} className='w-1/2 overflow-hidden'>
              <Avatar className='h-full w-full rounded-none'>
                {m.user.avatarUrl && (
                  <AvatarImage src={m.user.avatarUrl} alt={m.user.username} />
                )}
                <AvatarFallback className='text-[6px]'>
                  {m.user.username.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          ))}
        </div>
      </div>
      {count > 4 && (
        <div className='bg-muted-foreground/30 absolute inset-0 flex items-center justify-center'>
          <span className='text-[10px] font-medium text-white'>+{count - 4}</span>
        </div>
      )}
    </div>
  )
}

export function ConversationHeader({
  conversation,
  currentUserId,
  className,
  onBack,
  onShowDetails,
  onShowUserInfo
}: ConversationHeaderProps) {
  if (!conversation) {
    return (
      <div className={cn('flex h-16 items-center px-4', className)}>
        <p className='text-muted-foreground text-sm'>
          Select a conversation to start chatting
        </p>
      </div>
    )
  }

  const otherMember = getOtherMember(conversation.members, currentUserId)
  const displayName =
    conversation.name ||
    otherMember?.user.username ||
    otherMember?.user.email ||
    'Unknown'

  const avatarUrl = otherMember?.user.avatarUrl
  const initials = displayName.slice(0, 1).toUpperCase()
  const isGroup = conversation.isGroup

  return (
    <div className={cn('flex h-16 items-center gap-3 px-4', className)}>
      {onBack && (
        <Button
          variant='ghost'
          size='icon-sm'
          onClick={onBack}
          aria-label='Back to conversations'
          className='lg:hidden'
        >
          <ArrowLeft className='size-4' />
        </Button>
      )}

      <div className='flex flex-1 shrink-0 items-center gap-3'>
        <button
          type='button'
          onClick={onShowUserInfo}
          className='rounded-full'
          aria-label={isGroup ? 'Group info' : 'User info'}
        >
          {isGroup ? (
            <GroupAvatar members={conversation.members} className='size-10' />
          ) : (
            <Avatar size='lg'>
              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          )}
        </button>

        <div className='min-w-0 flex-1'>
          <h2 className='truncate text-base font-medium'>{displayName}</h2>
          {isGroup && (
            <p className='text-muted-foreground truncate text-xs'>
              {conversation.members.length} members
            </p>
          )}
        </div>
      </div>

      <div className='flex items-center gap-1'>
        <Button variant='ghost' size='icon-sm' aria-label='Voice call'>
          <Phone className='size-4' />
        </Button>
        <Button variant='ghost' size='icon-sm' aria-label='Video call'>
          <Video className='size-4' />
        </Button>
        <Button
          variant='ghost'
          size='icon-sm'
          onClick={onShowDetails}
          aria-label='More options'
        >
          <MoreVertical className='size-4' />
        </Button>
      </div>
    </div>
  )
}
