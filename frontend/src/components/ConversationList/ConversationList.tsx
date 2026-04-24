import { useChatStore } from '@/stores/chat-store'
import { useAuthStore } from '@/stores/auth-store'
import { ConversationItem } from '../ConversationItem.tsx/ConversationItem'
import { Loader2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

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
    <div className='flex flex-1 flex-col overflow-y-auto'>
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isActive={activeConversation?.id === conversation.id}
          currentUserId={user?.id || ''}
          onClick={() => handleSelectConversation(conversation.id)}
        />
      ))}
    </div>
  )
}
