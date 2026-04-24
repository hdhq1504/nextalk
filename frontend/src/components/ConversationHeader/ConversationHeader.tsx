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
  const initials = displayName.slice(0, 2).toUpperCase()

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
          aria-label='Show user info'
        >
          <Avatar size='lg'>
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>

        <div className='min-w-0 flex-1'>
          <h2 className='truncate text-base font-medium'>{displayName}</h2>
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
