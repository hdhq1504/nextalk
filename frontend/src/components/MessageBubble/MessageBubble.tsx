import { useState } from 'react'
import { cn } from '@/lib/utils'
import { isLongMessage } from '@/utils/conversation'
import { formatMessageTime } from '@/utils/format'
import type { Message, ReactionSummary } from '@/types/chat'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MessageSquare, RotateCcw, Smile, Plus } from 'lucide-react'
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react'
import { useTheme } from 'next-themes'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

const PRESET_EMOJIS = ['❤️', '👍', '😂', '😢', '😮', '🔥']

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showAvatar?: boolean
  senderName?: string
  onReply: (message: Message) => void
  onRecall: (messageId: string) => void | Promise<void>
  onReact: (messageId: string, emoji: string) => void
  currentUserId: string
  onImageClick?: (imageUrl: string) => void
  className?: string
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  senderName,
  onReply,
  onRecall,
  onReact,
  currentUserId,
  onImageClick,
  className
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [showRecallDialog, setShowRecallDialog] = useState(false)
  const { resolvedTheme } = useTheme()
  const emojiTheme = resolvedTheme === 'dark' ? Theme.DARK : Theme.LIGHT

  const initials = message.sender?.username?.slice(0, 2).toUpperCase() || '??'
  const isLong = isLongMessage(message.content || '')
  const isDeleted = message.isDeleted
  const isImage = message.type === 'image' && message.imageUrl

  const handleReactionClick = (emoji: string) => {
    onReact(message.id, emoji)
    setShowReactionPicker(false)
  }

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onReact(message.id, emojiData.emoji)
    setShowReactionPicker(false)
  }

  const handleRecall = async () => {
    await onRecall(message.id)
    setShowRecallDialog(false)
  }

  const isReactedByCurrentUser = (reaction: ReactionSummary) =>
    reaction.userIds.includes(currentUserId)

  if (isDeleted) {
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
            {message.sender?.avatarUrl && (
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
          <div className='bg-muted/50 rounded-2xl px-4 py-2'>
            <p className='text-muted-foreground text-sm italic'>
              Unsent message
            </p>
          </div>
        </div>
      </div>
    )
  }

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
          {message.sender?.avatarUrl && (
            <AvatarImage
              src={message.sender.avatarUrl}
              alt={message.sender.username}
            />
          )}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          'max-w-[92%] sm:max-w-[70%]',
          isOwn ? 'items-end' : 'items-start'
        )}
      >
        {!isOwn && senderName && (
          <span className='text-muted-foreground mb-1 block text-xs'>
            {senderName}
          </span>
        )}

        {message.replyTo && (
          <div className='border-primary/50 bg-muted/30 mb-1 w-full max-w-[250px] rounded-lg border-l-2 px-2 py-1 text-xs'>
            <p className='text-foreground font-medium'>
              {message.replyTo.sender?.username || 'Unknown'}
            </p>
            <p className='text-muted-foreground truncate'>
              {message.replyTo.type === 'image'
                ? 'Image'
                : message.replyTo.content || ''}
            </p>
          </div>
        )}

        <div
          className={cn(
            'group flex items-center gap-1.5',
            isOwn ? 'flex-row-reverse' : 'flex-row'
          )}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => {
            setShowActions(false)
            setShowReactionPicker(false)
          }}
        >
          {isImage ? (
            <div
              className={cn(
                'flex max-w-[300px] flex-col gap-1',
                isOwn ? 'items-end' : 'items-start'
              )}
            >
              <div
                className={cn(
                  'cursor-pointer overflow-hidden rounded-xl',
                  isOwn ? 'bg-primary' : 'bg-secondary'
                )}
                onClick={() => onImageClick?.(message.imageUrl!)}
              >
                <img
                  src={message.imageUrl!}
                  alt='Shared image'
                  className='max-h-[300px] max-w-[300px] object-cover'
                />
              </div>
              {message.content && (
                <div
                  className={cn(
                    'w-fit max-w-full px-3 py-2 text-sm',
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
              )}
            </div>
          ) : (
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
          )}

          <div
            className={cn(
              'bg-background/90 flex shrink-0 items-center gap-0.5 rounded-full px-1 py-0.5 shadow-sm transition-opacity',
              showActions ? 'opacity-100' : 'pointer-events-none opacity-0'
            )}
            aria-hidden={!showActions}
          >
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='h-6 w-6'
              tabIndex={showActions ? 0 : -1}
              onClick={() => onReply(message)}
            >
              <MessageSquare className='h-3.5 w-3.5' />
            </Button>

            <div className='relative'>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='h-6 w-6'
                tabIndex={showActions ? 0 : -1}
                onClick={() => setShowReactionPicker(!showReactionPicker)}
              >
                <Smile className='h-3.5 w-3.5' />
              </Button>

              {showReactionPicker && (
                <div
                  className={cn(
                    'absolute top-full z-50 mt-2',
                    isOwn ? 'right-0' : 'left-0'
                  )}
                >
                  <div
                    className='fixed inset-0'
                    onClick={() => setShowReactionPicker(false)}
                  />
                  <div className='bg-background rounded-lg border p-2 shadow-lg'>
                    <div className='flex gap-1'>
                      {PRESET_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReactionClick(emoji)}
                          className='hover:bg-muted rounded p-1 text-lg transition-colors'
                        >
                          {emoji}
                        </button>
                      ))}
                      <div className='relative'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          className='h-7 w-7'
                          onClick={() => {}}
                        >
                          <Plus className='h-3.5 w-3.5' />
                        </Button>
                        <div
                          className={cn(
                            'absolute top-full mt-2 hidden group-hover:block',
                            isOwn ? 'right-0' : 'left-1/2 -translate-x-1/2'
                          )}
                        >
                          <EmojiPicker
                            onEmojiClick={handleEmojiClick}
                            theme={emojiTheme}
                            skinTonesDisabled={false}
                            searchDisabled
                            previewConfig={{ showPreview: false }}
                            width={280}
                            height={350}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isOwn && (
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='text-destructive hover:text-destructive h-6 w-6'
                tabIndex={showActions ? 0 : -1}
                onClick={() => setShowRecallDialog(true)}
              >
                <RotateCcw className='h-3.5 w-3.5' />
              </Button>
            )}
          </div>
        </div>

        {message.reactions && message.reactions.length > 0 && (
          <div className='mt-1 flex flex-wrap gap-1'>
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => handleReactionClick(reaction.emoji)}
                className={cn(
                  'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs transition-colors',
                  isReactedByCurrentUser(reaction)
                    ? 'bg-primary/20 border-primary border'
                    : 'bg-muted/80 hover:bg-muted'
                )}
              >
                <span>{reaction.emoji}</span>
                <span className='text-muted-foreground'>{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        <div
          className={cn(
            'mt-1 flex items-center gap-1',
            isOwn ? 'justify-end' : 'justify-start'
          )}
        >
          <span
            className={cn(
              'text-muted-foreground block text-xs',
              isOwn && 'text-right'
            )}
          >
            {formatMessageTime(message.createdAt)}
          </span>
        </div>
      </div>
      <Dialog open={showRecallDialog} onOpenChange={setShowRecallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsend message?</DialogTitle>
            <DialogDescription>
              The message will be unsent from the conversation and cannot be
              recovered.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setShowRecallDialog(false)}
            >
              Cancel
            </Button>
            <Button type='button' variant='destructive' onClick={handleRecall}>
              Unsend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
