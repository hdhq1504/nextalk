import { cn } from '@/lib/utils'
import { isLongMessage } from '@/utils/conversation'
import { formatMessageTime } from '@/utils/format'
import type { Message } from '@/types/chat'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showAvatar?: boolean
  senderName?: string
  className?: string
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  senderName,
  className
}: MessageBubbleProps) {
  const initials = message.sender.username.slice(0, 2).toUpperCase()
  const isLong = isLongMessage(message.content)

  return (
    <div
      className={cn(
        'flex items-end gap-2',
        isOwn ? 'flex-row-reverse' : 'flex-row',
        className
      )}
    >
      {!isOwn && showAvatar && (
        <Avatar size='default' className='shrink-0'>
          {message.sender.avatarUrl && (
            <AvatarImage
              src={message.sender.avatarUrl}
              alt={message.sender.username}
            />
          )}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      )}

      <div className={cn('max-w-[70%]', isOwn ? 'items-end' : 'items-start')}>
        {!isOwn && senderName && (
          <span className='text-muted-foreground mb-1 block text-xs'>
            {senderName}
          </span>
        )}

        <div
          className={cn(
            'px-3 py-2 text-sm',
            isLong ? 'rounded-xl' : 'rounded-full',
            isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-foreground'
          )}
        >
          <p className='wrap-break-word whitespace-pre-wrap'>
            {message.content}
          </p>
        </div>

        <span
          className={cn(
            'text-muted-foreground mt-1 block text-xs',
            isOwn && 'text-right'
          )}
        >
          {formatMessageTime(message.createdAt)}
        </span>
      </div>
    </div>
  )
}
