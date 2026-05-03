import {
  useState,
  useRef,
  type FormEvent,
  type KeyboardEvent,
  useEffect
} from 'react'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/stores/chat-store'
import { useTheme } from 'next-themes'
import { Send, Paperclip, Smile, X } from 'lucide-react'
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
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    activeConversation,
    sendMessage,
    sendImageMessage,
    replyingTo,
    setReplyingTo
  } = useChatStore()
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (!activeConversation) {
      setMessage('')
      setSelectedImages([])
      setImagePreviews([])
      setReplyingTo(null)
    }
  }, [activeConversation, setReplyingTo])

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage((prev) => prev + emojiData.emoji)
    inputRef.current?.focus()
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const validFiles: File[] = []
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`)
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} must be less than 5MB`)
        continue
      }
      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    setSelectedImages((prev) => [...prev, ...validFiles])
    validFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreviews((prev) => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const clearImages = () => {
    setSelectedImages([])
    setImagePreviews([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!activeConversation || isSending) {
      return
    }

    const conversationId = activeConversation.id

    if (selectedImages.length > 0) {
      await handleSendImage(conversationId)
    } else {
      await handleSendText(conversationId)
    }
  }

  const handleSendText = async (conversationId: string) => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage) {
      return
    }

    setIsSending(true)
    setMessage('')

    try {
      await sendMessage(conversationId, trimmedMessage, replyingTo?.id)
      setReplyingTo(null)
      inputRef.current?.focus()
    } catch {
      toast.error('Failed to send message. Please try again.')
      setMessage(trimmedMessage)
    } finally {
      setIsSending(false)
    }
  }

  const handleSendImage = async (conversationId: string) => {
    if (selectedImages.length === 0) {
      return
    }

    setIsSending(true)
    const imageCaption = message.trim()
    setMessage('')

    try {
      await sendImageMessage(
        conversationId,
        selectedImages,
        imageCaption,
        replyingTo?.id
      )
      clearImages()
      setReplyingTo(null)
    } catch {
      toast.error('Failed to send images. Please try again.')
      setMessage(imageCaption)
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
  const canSend =
    (message.trim().length > 0 || selectedImages.length > 0) && !isDisabled
  const emojiTheme = resolvedTheme === 'dark' ? Theme.DARK : Theme.LIGHT

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('relative flex flex-col gap-2 p-3', className)}
    >
      {replyingTo && (
        <div className='bg-muted/50 flex items-center gap-2 rounded-lg px-3 py-2'>
          <div className='min-w-0 flex-1'>
            <p className='text-foreground text-xs font-medium'>
              Trả lời {replyingTo.sender?.username || 'Unknown'}
            </p>
            <p className='text-muted-foreground truncate text-xs'>
              {replyingTo.type === 'image'
                ? '🖼 Ảnh'
                : replyingTo.content || ''}
            </p>
          </div>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-6 w-6 shrink-0'
            onClick={() => setReplyingTo(null)}
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      )}

      {imagePreviews.length > 0 && (
        <div className='bg-muted/50 rounded-lg p-2'>
          <div className='flex flex-wrap gap-2'>
            {imagePreviews.map((preview, index) => (
              <div key={index} className='relative'>
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className='h-20 w-20 rounded-lg object-cover'
                />
                <Button
                  type='button'
                  variant='secondary'
                  size='icon'
                  className='absolute -top-2 -right-2 h-6 w-6 rounded-full'
                  onClick={() => removeImage(index)}
                >
                  <X className='h-3 w-3' />
                </Button>
              </div>
            ))}
          </div>
          {imagePreviews.length > 0 && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='mt-2 h-6 px-2 text-xs'
              onClick={clearImages}
            >
              Clear all
            </Button>
          )}
        </div>
      )}

      <div className='flex items-end gap-2'>
        <div className='flex shrink-0 items-center gap-1'>
          <input
            type='file'
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept='image/*'
            multiple
            className='hidden'
          />
          <Button
            type='button'
            variant='ghost'
            size='icon'
            onClick={() => fileInputRef.current?.click()}
            disabled={isDisabled}
            aria-label='Attach image'
          >
            <Paperclip className='size-5' />
          </Button>
          <div className='relative'>
            <Button
              type='button'
              variant={showEmojiPicker ? 'secondary' : 'ghost'}
              size='icon'
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={isDisabled}
              aria-label='Add emoji'
            >
              <Smile className='size-5' />
            </Button>

            {showEmojiPicker && (
              <div className='absolute bottom-full left-0 z-50 mb-2'>
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
      </div>
    </form>
  )
}
