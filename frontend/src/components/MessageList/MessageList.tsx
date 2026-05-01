import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/stores/chat-store'
import { useAuthStore } from '@/stores/auth-store'
import { MessageBubble } from '../MessageBubble'
import { ImageLightbox } from '../ImageLightbox'
import { Loader2, MessageSquare } from 'lucide-react'

interface MessageListProps {
  className?: string
}

export function MessageList({ className }: MessageListProps) {
  const {
    activeConversation,
    messages,
    isMessagesLoading,
    setReplyingTo,
    recallMessage,
    reactToMessage
  } = useChatStore()
  const user = useAuthStore((state) => state.user)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  const conversationMessages = activeConversation
    ? messages[activeConversation.id] || []
    : []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationMessages])

  const handleReply = (message: (typeof conversationMessages)[0]) => {
    setReplyingTo(message)
  }

  const handleRecall = async (messageId: string) => {
    try {
      await recallMessage(messageId)
    } catch (error) {
      console.error('Failed to recall message:', error)
    }
  }

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      await reactToMessage(messageId, emoji)
    } catch (error) {
      console.error('Failed to react to message:', error)
    }
  }

  if (!activeConversation) {
    return (
      <div
        className={cn(
          'flex flex-1 flex-col items-center justify-center gap-4',
          className
        )}
      >
        <div className='bg-secondary rounded-full p-5'>
          <MessageSquare className='text-muted-foreground size-7' />
        </div>
        <div className='text-center'>
          <p className='text-base font-medium'>Select a conversation</p>
          <p className='text-muted-foreground mt-1 text-sm'>
            Choose a conversation from the sidebar to start messaging
          </p>
        </div>
      </div>
    )
  }

  if (isMessagesLoading) {
    return (
      <div className={cn('flex flex-1 items-center justify-center', className)}>
        <Loader2 className='text-muted-foreground size-6 animate-spin' />
      </div>
    )
  }

  if (conversationMessages.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-1 flex-col items-center justify-center gap-4',
          className
        )}
      >
        <div className='bg-secondary rounded-full p-5'>
          <MessageSquare className='text-muted-foreground size-7' />
        </div>
        <div className='text-center'>
          <p className='text-base font-medium'>No messages yet</p>
          <p className='text-muted-foreground mt-1 text-sm'>
            Send a message to start the conversation
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        className={cn(
          'flex flex-1 flex-col overflow-y-auto px-4 py-4',
          className
        )}
      >
        <div className='flex flex-col gap-3'>
          {conversationMessages.map((message, index) => {
            const prevMessage =
              index > 0 ? conversationMessages[index - 1] : null
            const showAvatar =
              !prevMessage ||
              prevMessage.senderId !== message.senderId ||
              new Date(message.createdAt).getTime() -
                new Date(prevMessage.createdAt).getTime() >
                60000

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === user?.id}
                showAvatar={showAvatar}
                senderName={showAvatar ? message.sender?.username : undefined}
                onReply={handleReply}
                onRecall={handleRecall}
                onReact={handleReact}
                currentUserId={user?.id || ''}
                onImageClick={setLightboxImage}
              />
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {lightboxImage && (
        <ImageLightbox
          src={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </>
  )
}
