import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/stores/chat-store'
import { useTheme } from 'next-themes'
import { Send, Paperclip, Smile } from 'lucide-react'
import { toast } from 'sonner'
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface MessageInputProps {
  className?: string
}

export function MessageInput({ className }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { activeConversation, sendMessage } = useChatStore()
  const { resolvedTheme } = useTheme()

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage((prev) => prev + emojiData.emoji)
    inputRef.current?.focus()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const trimmedMessage = message.trim()
    if (!trimmedMessage || !activeConversation || isSending) {
      return
    }

    setIsSending(true)
    setMessage('')

    try {
      await sendMessage(activeConversation.id, trimmedMessage)
      inputRef.current?.focus()
    } catch {
      toast.error('Failed to send message. Please try again.')
      setMessage(trimmedMessage)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  const isDisabled = !activeConversation || isSending
  const canSend = message.trim().length > 0 && !isDisabled
  const emojiTheme = resolvedTheme === 'dark' ? Theme.DARK : Theme.LIGHT

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('relative flex items-end gap-2 p-3', className)}
    >
      <div className='flex shrink-0 items-center gap-1'>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          aria-label='Attach file'
        >
          <Paperclip className='size-5' />
        </Button>
        <div className='relative'>
          <Button
            type='button'
            variant={showEmojiPicker ? 'secondary' : 'ghost'}
            size='icon'
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            aria-label='Add emoji'
          >
            <Smile className='size-5' />
          </Button>

          {showEmojiPicker && (
            <div className='absolute bottom-full left-0 mb-2 z-50'>
              <div
                className='fixed inset-0'
                onClick={() => setShowEmojiPicker(false)}
              />
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme={emojiTheme}
                skinTonesDisabled
                searchDisabled
                previewConfig={{ showPreview: false }}
                width={320}
                height={400}
              />
            </div>
          )}
        </div>
      </div>

      <div className='relative min-w-0 flex-1'>
        <Textarea
          ref={inputRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            activeConversation
              ? 'Type a message...'
              : 'Select a conversation to chat'
          }
          disabled={isDisabled}
          rows={1}
          className='max-h-[120px] min-h-[40px] resize-none px-3 py-2.5 text-sm'
        />
      </div>

      <Button
        type='submit'
        disabled={!canSend}
        size='icon'
        aria-label='Send message'
      >
        <Send className={cn('size-5', isSending && 'animate-pulse')} />
      </Button>
    </form>
  )
}
