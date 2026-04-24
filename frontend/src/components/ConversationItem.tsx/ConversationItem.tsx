import { useState, useRef, useEffect } from 'react'
import { Pin, PinOff, VolumeX, Volume2, Trash2, UserX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getOtherMember } from '@/utils/conversation'
import { formatTime } from '@/utils/format'
import type { Conversation } from '@/types/chat'
import { MessageSquare } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator
} from '@/components/ui/context-menu'

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  currentUserId: string
  onClick: () => void
  isPinned?: boolean
  isMuted?: boolean
  onPin?: () => void
  onUnpin?: () => void
  onMute?: () => void
  onUnmute?: () => void
  onDelete?: () => void
  onRemove?: () => void
}

export function ConversationItem({
  conversation,
  isActive,
  currentUserId,
  onClick,
  isPinned = false,
  isMuted = false,
  onPin,
  onUnpin,
  onMute,
  onUnmute,
  onDelete,
  onRemove
}: ConversationItemProps) {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  const otherMember = getOtherMember(conversation.members, currentUserId)
  const displayName =
    conversation.name ||
    otherMember?.user.username ||
    otherMember?.user.email ||
    'Unknown'

  const avatarUrl = otherMember?.user.avatarUrl
  const initials = displayName.slice(0, 2).toUpperCase()

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isMobile) {
      longPressTimer.current = setTimeout(() => {
        const target = e.currentTarget as HTMLElement
        const event = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: e.touches[0].clientX,
          clientY: e.touches[0].clientY
        })
        target.dispatchEvent(event)
      }, 500)
    }
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          type='button'
          onClick={onClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onClick()
            }
          }}
          className={cn(
            'flex w-full cursor-pointer items-center gap-3 px-3 py-3 text-left',
            'transition-[background-color] duration-150',
            'hover:bg-secondary focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
            isActive && 'bg-secondary'
          )}
        >
          <Avatar size='lg' className='shrink-0'>
            {avatarUrl && (
              <AvatarImage src={avatarUrl} alt='' width={40} height={40} />
            )}
            <AvatarFallback aria-hidden='true'>{initials}</AvatarFallback>
          </Avatar>

          <div className='min-w-0 flex-1'>
            <div className='flex items-center justify-between gap-2'>
              <span className='truncate text-sm font-medium'>
                {displayName}
              </span>
              {conversation.lastMessage && (
                <span className='text-muted-foreground shrink-0 text-xs'>
                  {formatTime(conversation.lastMessage.createdAt)}
                </span>
              )}
            </div>

            <div className='flex items-center gap-1'>
              {conversation.lastMessage ? (
                <p className='text-muted-foreground truncate text-xs'>
                  {conversation.lastMessage.senderId === currentUserId
                    ? 'You: '
                    : ''}
                  {conversation.lastMessage.content}
                </p>
              ) : (
                <p className='text-muted-foreground flex items-center gap-1 text-xs'>
                  <MessageSquare className='size-3' />
                  <span>Start chatting</span>
                </p>
              )}
            </div>
          </div>
        </button>
      </ContextMenuTrigger>

      <ContextMenuContent>
        {isPinned ? (
          <ContextMenuItem onClick={onUnpin}>
            <PinOff className='size-4' />
            Unpin conversation
          </ContextMenuItem>
        ) : (
          <ContextMenuItem onClick={onPin}>
            <Pin className='size-4' />
            Pin conversation
          </ContextMenuItem>
        )}

        {isMuted ? (
          <ContextMenuItem onClick={onUnmute}>
            <Volume2 className='size-4' />
            Unmute notifications
          </ContextMenuItem>
        ) : (
          <ContextMenuItem onClick={onMute}>
            <VolumeX className='size-4' />
            Mute notifications
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        <ContextMenuItem onClick={onDelete} variant='destructive'>
          <Trash2 className='size-4' />
          Delete conversation
        </ContextMenuItem>

        <ContextMenuItem onClick={onRemove} variant='destructive'>
          <UserX className='size-4' />
          Remove from list
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
