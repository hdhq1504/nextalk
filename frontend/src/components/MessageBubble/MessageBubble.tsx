import { useCallback, useEffect, useRef, useState } from 'react'
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
import {
  EMOJI_PICKER_HEIGHT,
  PICKER_GAP,
  PRESET_REACTION_EMOJIS,
  REACTION_PICKER_HEIGHT,
  REACTION_PICKER_POSITION_WIDTH,
  VIEWPORT_MARGIN
} from '@/constants/chat'
import { ImageGrid } from '../ImageGrid'

type ReactionPickerPosition = {
  top: number
  left: number
  placement: 'top' | 'bottom'
}

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
  const [reactionPickerPosition, setReactionPickerPosition] =
    useState<ReactionPickerPosition | null>(null)
  const [showRecallDialog, setShowRecallDialog] = useState(false)
  const reactionButtonRef = useRef<HTMLButtonElement>(null)
  const { resolvedTheme } = useTheme()
  const emojiTheme = resolvedTheme === 'dark' ? Theme.DARK : Theme.LIGHT

  const initials = message.sender?.username?.slice(0, 1).toUpperCase() || '??'
  const isLong = isLongMessage(message.content || '')
  const isDeleted = message.isDeleted
  const imageUrls =
    message.imageUrls && message.imageUrls.length > 0
      ? message.imageUrls
      : message.imageUrl
        ? [message.imageUrl]
        : []
  const isImage = message.type === 'image' && imageUrls.length > 0

  const handleReactionClick = (emoji: string) => {
    onReact(message.id, emoji)
    setShowReactionPicker(false)
  }

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onReact(message.id, emojiData.emoji)
    setShowReactionPicker(false)
  }

  const updateReactionPickerPosition = useCallback(() => {
    const trigger = reactionButtonRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const expandedHeight =
      REACTION_PICKER_HEIGHT + PICKER_GAP + EMOJI_PICKER_HEIGHT
    const canOpenDown =
      rect.bottom + PICKER_GAP + expandedHeight <=
      viewportHeight - VIEWPORT_MARGIN
    const canOpenUp = rect.top - PICKER_GAP - expandedHeight >= VIEWPORT_MARGIN
    const placement = canOpenDown || !canOpenUp ? 'bottom' : 'top'

    const preferredLeft = isOwn
      ? rect.right - REACTION_PICKER_POSITION_WIDTH
      : rect.left
    const maxLeft =
      viewportWidth - REACTION_PICKER_POSITION_WIDTH - VIEWPORT_MARGIN
    const left = Math.min(
      Math.max(preferredLeft, VIEWPORT_MARGIN),
      Math.max(VIEWPORT_MARGIN, maxLeft)
    )
    const rawTop =
      placement === 'bottom'
        ? rect.bottom + PICKER_GAP
        : rect.top - PICKER_GAP - REACTION_PICKER_HEIGHT
    const top = Math.min(
      Math.max(rawTop, VIEWPORT_MARGIN),
      viewportHeight - REACTION_PICKER_HEIGHT - VIEWPORT_MARGIN
    )

    setReactionPickerPosition({ top, left, placement })
  }, [isOwn])

  const toggleReactionPicker = () => {
    setShowReactionPicker((current) => {
      if (!current) {
        updateReactionPickerPosition()
      }
      return !current
    })
  }

  useEffect(() => {
    if (!showReactionPicker) return

    updateReactionPickerPosition()
    window.addEventListener('resize', updateReactionPickerPosition)
    window.addEventListener('scroll', updateReactionPickerPosition, true)

    return () => {
      window.removeEventListener('resize', updateReactionPickerPosition)
      window.removeEventListener('scroll', updateReactionPickerPosition, true)
    }
  }, [showReactionPicker, updateReactionPickerPosition])

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
              <div className='overflow-hidden rounded-xl'>
                <ImageGrid imageUrls={imageUrls} onImageClick={onImageClick} />
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
                ref={reactionButtonRef}
                type='button'
                variant='ghost'
                size='icon'
                className='h-6 w-6'
                tabIndex={showActions ? 0 : -1}
                onClick={toggleReactionPicker}
              >
                <Smile className='h-3.5 w-3.5' />
              </Button>

              {showReactionPicker && reactionPickerPosition && (
                <div
                  className='fixed z-50 w-max'
                  style={{
                    top: reactionPickerPosition.top,
                    left: reactionPickerPosition.left
                  }}
                >
                  <div
                    className='fixed inset-0'
                    onClick={() => setShowReactionPicker(false)}
                  />
                  <div className='bg-background rounded-lg border p-2 shadow-lg'>
                    <div className='flex gap-1'>
                      {PRESET_REACTION_EMOJIS.map((emoji) => (
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
                            'absolute hidden group-hover:block',
                            reactionPickerPosition.placement === 'bottom'
                              ? 'top-full mt-2'
                              : 'bottom-full mb-2',
                            'right-0'
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
