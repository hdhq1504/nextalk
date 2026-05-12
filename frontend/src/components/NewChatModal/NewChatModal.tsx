import { MessageSquarePlus, Users } from 'lucide-react'
import { useNewChatModal } from '@/hooks/useNewChatModal'
import { NewChatDirectPanel } from '@/components/NewChatModal/NewChatDirectPanel'
import { NewChatGroupPanel } from '@/components/NewChatModal/NewChatGroupPanel'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface NewChatModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConversationCreated?: () => void
}

export function NewChatModal({
  open,
  onOpenChange,
  onConversationCreated
}: NewChatModalProps) {
  const {
    tab,
    friends,
    query,
    isLoading,
    selectedFriendId,
    groupName,
    selectedMemberIds,
    isCreatingGroup,
    filteredFriends,
    selectedMembers,
    setTab,
    setQuery,
    setGroupName,
    handleSelectFriend,
    toggleMemberSelection,
    handleCreateGroup
  } = useNewChatModal({ open, onOpenChange, onConversationCreated })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='gap-4 p-0 sm:max-w-md'>
        <DialogHeader className='px-5 pt-5'>
          <DialogTitle className='flex items-center gap-2'>
            <MessageSquarePlus className='size-4' />
            New Chat
          </DialogTitle>
          <DialogDescription>
            Start a direct chat or create a group.
          </DialogDescription>
        </DialogHeader>

        <div className='flex border-b px-5'>
          <button
            type='button'
            onClick={() => setTab('direct')}
            className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-1 py-2 text-sm font-medium transition-colors ${
              tab === 'direct'
                ? 'border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}
          >
            <MessageSquarePlus className='size-3.5' />
            Direct
          </button>
          <button
            type='button'
            onClick={() => setTab('group')}
            className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-1 py-2 text-sm font-medium transition-colors ${
              tab === 'group'
                ? 'border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            }`}
          >
            <Users className='size-3.5' />
            Group
          </button>
        </div>

        {tab === 'direct' ? (
          <NewChatDirectPanel
            friends={friends}
            filteredFriends={filteredFriends}
            isLoading={isLoading}
            query={query}
            selectedFriendId={selectedFriendId}
            onQueryChange={setQuery}
            onSelectFriend={handleSelectFriend}
          />
        ) : (
          <NewChatGroupPanel
            friends={friends}
            filteredFriends={filteredFriends}
            groupName={groupName}
            isCreatingGroup={isCreatingGroup}
            isLoading={isLoading}
            query={query}
            selectedMemberIds={selectedMemberIds}
            selectedMembers={selectedMembers}
            onCreateGroup={handleCreateGroup}
            onGroupNameChange={setGroupName}
            onQueryChange={setQuery}
            onToggleMember={toggleMemberSelection}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
