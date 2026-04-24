import { useState, useMemo } from 'react'
import { useChatStore } from '@/stores/chat-store'
import { useAuthStore } from '@/stores/auth-store'
import { ConversationItem } from '../ConversationItem.tsx/ConversationItem'
import { Loader2, MessageSquare, Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations

    const query = searchQuery.toLowerCase()
    return conversations.filter((conv) => {
      if (conv.name) {
        return conv.name.toLowerCase().includes(query)
      }
      const otherMember = conv.members.find((m) => m.userId !== user?.id)
      if (otherMember) {
        const name = otherMember.user.username || otherMember.user.email || ''
        return name.toLowerCase().includes(query)
      }
      return false
    })
  }, [conversations, searchQuery, user?.id])

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
      <div className='flex flex-1 items-center justify-center'>
        <Loader2 className='text-muted-foreground size-6 animate-spin' />
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className='flex flex-1 flex-col items-center justify-center gap-3 px-4'>
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
        <Button size='sm' className='mt-2'>
          <Plus className='mr-1 size-3' aria-hidden='true' />
          New Conversation
        </Button>
      </div>
    )
  }

  return (
    <div className='flex flex-1 flex-col overflow-hidden'>
      {/* Search */}
      <div className='shrink-0 border-b p-3'>
        <div className='relative'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
          <Input
            type='search'
            placeholder='Search conversations...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pr-9 pl-9'
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
      <div className='flex-1 overflow-y-auto'>
        {filteredConversations.length === 0 ? (
          <div className='flex flex-col items-center justify-center gap-2 py-8'>
            <Search className='text-muted-foreground size-8' />
            <p className='text-muted-foreground text-sm'>
              No conversations found
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={activeConversation?.id === conversation.id}
              currentUserId={user?.id || ''}
              onClick={() => handleSelectConversation(conversation.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
