import { useEffect, useState } from 'react'
import { useChatStore } from '@/stores/chat-store'
import { useAuthStore } from '@/stores/auth-store'
import { initializeSocketListeners } from '@/stores/chat-store'
import { socketClient } from '@/lib/socket'
import Sidebar from '@/components/Sidebar'
import ConversationHeader from '@/components/ConversationHeader'
import ConversationDetails from '@/components/ConversationDetails'
import UserInfoModal from '@/components/UserInfoModal'
import MessageList from '@/components/MessageList'
import MessageInput from '@/components/MessageInput'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CURRENT_USER } from '@/data/mock-chat'

export function Chat() {
  const { fetchConversations, activeConversation, setActiveConversation } =
    useChatStore()
  const user = useAuthStore((state) => state.user)
  const [isSidebarOpen, setIsSidebarOpen] = useState(!activeConversation)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isUserInfoOpen, setIsUserInfoOpen] = useState(false)

  useEffect(() => {
    if (!user) {
      useAuthStore.setState({ user: CURRENT_USER, isAuthenticated: true })
    }
  }, [user])

  useEffect(() => {
    socketClient.connect()
    const cleanup = initializeSocketListeners()
    fetchConversations()

    return () => {
      cleanup()
      socketClient.disconnect()
    }
  }, [fetchConversations])

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(!activeConversation)
    }
  }, [activeConversation])

  return (
    <div className='flex h-svh flex-row overflow-hidden'>
      {/* Sidebar */}
      <aside
        className={`bg-sidebar text-sidebar-foreground border-sidebar-border fixed inset-0 z-50 w-80 shrink-0 border-r transition-transform duration-300 sm:relative sm:z-auto sm:block ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'
        }`}
      >
        <Sidebar
          className='h-full'
          onConversationClick={() => setIsSidebarOpen(false)}
        />
      </aside>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 sm:hidden ${
          isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden='true'
      />

      {/* Chat area */}
      <main className='border-border flex flex-1 flex-col overflow-hidden'>
        {/* Mobile header */}
        <div className='flex items-center sm:hidden'>
          {!activeConversation && !isSidebarOpen && (
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              onClick={() => setIsSidebarOpen(true)}
              aria-label='Open sidebar'
              className='ml-2'
            >
              <Menu className='size-5' />
            </Button>
          )}
        </div>

        {activeConversation && (
          <>
            <ConversationHeader
              conversation={activeConversation}
              currentUserId={user?.id || ''}
              onBack={() => {
                setActiveConversation(null)
                setIsSidebarOpen(true)
              }}
              onShowDetails={() => setIsDetailsOpen(true)}
              onShowUserInfo={() => setIsUserInfoOpen(true)}
            />
            <Separator />
          </>
        )}

        <MessageList className='flex-1' />

        {activeConversation && (
          <>
            <Separator />
            <MessageInput />
          </>
        )}

        <ConversationDetails
          conversation={activeConversation}
          currentUserId={user?.id || ''}
          open={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
        />

        <UserInfoModal
          conversation={activeConversation}
          currentUserId={user?.id || ''}
          open={isUserInfoOpen}
          onClose={() => setIsUserInfoOpen(false)}
        />
      </main>
    </div>
  )
}
