import { useState, useMemo } from 'react'
import { useChatStore } from '@/stores/chat-store'
import { useAuthStore } from '@/stores/auth-store'
import { useDebounce } from '@/hooks/useDebounce'
import { matchesConversationQuery } from '@/utils/conversation'
import { ConversationItem } from '../ConversationItem.tsx/ConversationItem'
import { NewChatModal } from '@/components/NewChatModal'
import { MessageSquare, Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

interface ConversationListProps {
  onConversationClick?: () => void
}

export function ConversationList({
  onConversationClick
}: ConversationListProps) {
  const {
    conversations,
    activeConversation,
    isLoading,
    setActiveConversation,
    fetchMessages
  } = useChatStore()
  const user = useAuthStore((state) => state.user)

  const [searchQuery, setSearchQuery] = useState('')
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const debouncedSearchQuery = useDebounce(searchQuery, 200)

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) =>
      matchesConversationQuery(conversation, user?.id, debouncedSearchQuery)
    )
  }, [conversations, debouncedSearchQuery, user?.id])

  const handleSelectConversation = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId)
    if (conversation) {
      setActiveConversation(conversation)
      fetchMessages(conversationId)
      onConversationClick?.()
    }
  }

  if (isLoading) {
    return (
      <div className='flex flex-1 flex-col overflow-hidden'>
        <div className='shrink-0 border-b p-3'>
          <div className='mb-3 flex items-center justify-between gap-2'>
            <Skeleton className='h-5 w-20' />
            <Skeleton className='h-8 w-8 rounded-full' />
          </div>
          <Skeleton className='h-9 w-full' />
        </div>
        <div className='flex-1 overflow-y-auto p-4'>
          <div className='flex flex-col gap-4'>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className='flex items-center gap-3'>
                <Skeleton className='h-12 w-12 rounded-full' />
                <div className='flex flex-1 flex-col gap-2'>
                  <Skeleton className='h-4 w-3/4' />
                  <Skeleton className='h-3 w-1/2' />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div
        className='flex flex-1 flex-col items-center justify-center gap-3 px-4'
        role='region'
        aria-label='No conversations'
      >
        <div className='bg-secondary rounded-full p-4'>
          <MessageSquare
            className='text-muted-foreground size-6'
            aria-hidden='true'
          />
        </div>
        <div className='text-center'>
          <p className='text-sm font-medium'>No conversations yet</p>
          <p className='text-muted-foreground mt-1 text-xs'>
            Start a new conversation to begin chatting…
          </p>
        </div>
        <Button
          size='sm'
          className='mt-2'
          onClick={() => setIsNewChatOpen(true)}
        >
          <Plus className='mr-1 size-3' aria-hidden='true' />
          New Conversation
        </Button>
        <NewChatModal
          open={isNewChatOpen}
          onOpenChange={setIsNewChatOpen}
          onConversationCreated={onConversationClick}
        />
      </div>
    )
  }

  return (
    <div className='flex flex-1 flex-col overflow-hidden'>
      {/* Search */}
      <div className='shrink-0 border-b p-3'>
        <div className='mb-3 flex items-center justify-between gap-2'>
          <h2 className='text-sm font-medium'>NexTalk</h2>
          <Button
            type='button'
            size='icon-sm'
            onClick={() => setIsNewChatOpen(true)}
            aria-label='Start new chat'
          >
            <Plus className='size-4' aria-hidden='true' />
          </Button>
        </div>
        <div className='relative'>
          <Search
            className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2'
            aria-hidden='true'
          />
          <Input
            type='search'
            placeholder='Search conversations...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pr-9 pl-9'
            aria-label='Search conversations'
          />
          {searchQuery && (
            <button
              type='button'
              onClick={() => setSearchQuery('')}
              className='text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2'
              aria-label='Clear search'
            >
              <X className='size-4' />
            </button>
          )}
        </div>
      </div>

      {/* Conversation list */}
      <div
        className='flex-1 overflow-y-auto'
        role='listbox'
        aria-label='Conversations'
        aria-multiselectable='false'
      >
        {filteredConversations.length === 0 ? (
          <div
            className='flex flex-col items-center justify-center gap-2 py-8'
            role='status'
          >
            <Search
              className='text-muted-foreground size-8'
              aria-hidden='true'
            />
            <p className='text-muted-foreground text-sm'>
              No conversations found
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              role='option'
              aria-selected={activeConversation?.id === conversation.id}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleSelectConversation(conversation.id)
                }
              }}
            >
              <ConversationItem
                conversation={conversation}
                isActive={activeConversation?.id === conversation.id}
                currentUserId={user?.id || ''}
                onClick={() => handleSelectConversation(conversation.id)}
              />
            </div>
          ))
        )}
      </div>
      <NewChatModal
        open={isNewChatOpen}
        onOpenChange={setIsNewChatOpen}
        onConversationCreated={onConversationClick}
      />
    </div>
  )
}
