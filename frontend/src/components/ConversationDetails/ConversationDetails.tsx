import { useState } from 'react'
import { X, Bell, BellOff, Trash2, Search, UserPlus, UserMinus, LogOut, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getOtherMember } from '@/utils/conversation'
import type { Conversation } from '@/types/chat'
import { useChatStore } from '@/stores/chat-store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

interface ConversationDetailsProps {
  conversation: Conversation | null
  currentUserId: string
  open: boolean
  onClose: () => void
}

interface DetailsSectionProps {
  title: string
  children: React.ReactNode
}

function DetailsSection({ title, children }: DetailsSectionProps) {
  return (
    <div className='space-y-3'>
      <h3 className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
        {title}
      </h3>
      {children}
    </div>
  )
}

function AdminBadge() {
  return (
    <span className='bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-medium'>
      Admin
    </span>
  )
}

function AddMemberDialog({
  open,
  onOpenChange,
  conversationId
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId: string
}) {
  const [userId, setUserId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const addGroupMember = useChatStore((state) => state.addGroupMember)

  const handleAdd = async () => {
    if (!userId.trim()) return
    setIsLoading(true)
    try {
      await addGroupMember(conversationId, userId.trim())
      toast.success('Member added')
      onOpenChange(false)
      setUserId('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add member')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
          <DialogDescription>
            Enter the user ID of the friend you want to add.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder='User ID...'
          disabled={isLoading}
        />
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={isLoading || !userId.trim()}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RemoveMemberDialog({
  open,
  onOpenChange,
  conversationId,
  member
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId: string
  member: Conversation['members'][number] | null
}) {
  const [isLoading, setIsLoading] = useState(false)
  const removeGroupMember = useChatStore((state) => state.removeGroupMember)

  const handleRemove = async () => {
    if (!member) return
    setIsLoading(true)
    try {
      await removeGroupMember(conversationId, member.userId)
      toast.success('Member removed')
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove member')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Member</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove {member?.user.username} from the group?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant='destructive' onClick={handleRemove} disabled={isLoading}>
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RenameGroupDialog({
  open,
  onOpenChange,
  conversation,
  currentUserId
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversation: Conversation | null
  currentUserId: string
}) {
  const [name, setName] = useState(conversation?.name || '')
  const [isLoading, setIsLoading] = useState(false)
  const updateGroupInfo = useChatStore((state) => state.updateGroupInfo)

  const handleRename = async () => {
    if (!conversation || !name.trim()) return
    setIsLoading(true)
    try {
      await updateGroupInfo(conversation.id, { name: name.trim() })
      toast.success('Group name updated')
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to rename group')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Group</DialogTitle>
          <DialogDescription>Enter a new name for the group.</DialogDescription>
        </DialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='Group name...'
          maxLength={100}
          disabled={isLoading}
        />
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleRename} disabled={isLoading || !name.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function LeaveGroupDialog({
  open,
  onOpenChange,
  conversation
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversation: Conversation | null
}) {
  const [isLoading, setIsLoading] = useState(false)
  const leaveGroup = useChatStore((state) => state.leaveGroup)

  const handleLeave = async () => {
    if (!conversation) return
    setIsLoading(true)
    try {
      await leaveGroup(conversation.id)
      toast.success('You left the group')
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to leave group')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave Group</DialogTitle>
          <DialogDescription>
            Are you sure you want to leave {conversation?.name || 'this group'}?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant='destructive' onClick={handleLeave} disabled={isLoading}>
            Leave
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ConversationDetails({
  conversation,
  currentUserId,
  open,
  onClose
}: ConversationDetailsProps) {
  const [showAddMember, setShowAddMember] = useState(false)
  const [showRemoveMember, setShowRemoveMember] = useState(false)
  const [showRename, setShowRename] = useState(false)
  const [showLeave, setShowLeave] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Conversation['members'][number] | null>(null)

  if (!open || !conversation) return null

  const otherMember = getOtherMember(conversation.members, currentUserId)
  const displayName =
    conversation.name ||
    otherMember?.user.username ||
    otherMember?.user.email ||
    'Unknown'

  const avatarUrl = otherMember?.user.avatarUrl
  const initials = displayName.slice(0, 1).toUpperCase()

  const isGroup = conversation.isGroup
  const memberCount = conversation.members.length

  const currentMember = conversation.members.find((m) => m.userId === currentUserId)
  const isAdmin = currentMember?.role === 'admin'

  const handleRemoveMember = (member: Conversation['members'][number]) => {
    setSelectedMember(member)
    setShowRemoveMember(true)
  }

  const handleLeaveGroup = () => {
    setShowLeave(true)
  }

  return (
    <>
      <div
        className={cn(
          'bg-background fixed inset-y-0 right-0 z-50 flex flex-col shadow-xl',
          'w-full sm:w-80 lg:w-80',
          'animate-in slide-in-from-right duration-300'
        )}
      >
        {/* Header */}
        <div className='flex h-16 items-center justify-between border-b px-4'>
          <h2 className='text-base font-medium'>Details</h2>
          <Button
            variant='ghost'
            size='icon-sm'
            onClick={onClose}
            aria-label='Close'
          >
            <X className='size-4' />
          </Button>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-4'>
          <div className='flex flex-col items-center gap-3 pb-6'>
            <Avatar size='lg'>
              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className='text-center'>
              <h3 className='text-lg font-medium'>{displayName}</h3>
              {isGroup ? (
                <p className='text-muted-foreground text-sm'>
                  {memberCount} members
                </p>
              ) : otherMember?.user.email ? (
                <p className='text-muted-foreground text-sm'>
                  {otherMember.user.email}
                </p>
              ) : null}
            </div>
          </div>

          <Separator className='my-4' />

          <div className='space-y-6'>
            {/* Search */}
            <DetailsSection title='Search in conversation'>
              <div className='relative'>
                <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                <Input
                  type='search'
                  placeholder='Search messages...'
                  className='pl-9'
                />
              </div>
            </DetailsSection>

            {/* Privacy & Notifications */}
            <DetailsSection title='Privacy & Notifications'>
              <div className='space-y-1'>
                <button
                  type='button'
                  className='hover:bg-accent flex w-full items-center gap-3 rounded-md p-2 text-sm'
                >
                  <Bell className='size-5' />
                  <span>Notifications</span>
                </button>
                <button
                  type='button'
                  className='hover:bg-accent flex w-full items-center gap-3 rounded-md p-2 text-sm'
                >
                  <BellOff className='size-5' />
                  <span>Mute notifications</span>
                </button>
              </div>
            </DetailsSection>

            {/* Members (for group chats) */}
            {isGroup && (
              <DetailsSection title={`Members (${memberCount})`}>
                {isAdmin && (
                  <button
                    type='button'
                    onClick={() => setShowAddMember(true)}
                    className='hover:bg-accent mb-2 flex w-full items-center gap-3 rounded-md p-2 text-sm text-primary'
                  >
                    <UserPlus className='size-5' />
                    <span>Add member</span>
                  </button>
                )}
                <div className='space-y-2'>
                  {conversation.members.map((member) => (
                    <div
                      key={member.userId}
                      className='hover:bg-accent flex items-center gap-3 rounded-md p-2'
                    >
                      <Avatar size='sm'>
                        {member.user.avatarUrl && (
                          <AvatarImage
                            src={member.user.avatarUrl}
                            alt={member.user.username}
                          />
                        )}
                        <AvatarFallback>
                          {member.user.username?.slice(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className='min-w-0 flex-1'>
                        <p className='flex items-center gap-1.5 truncate text-sm font-medium'>
                          {member.user.username || member.user.email || 'Unknown'}
                          {member.role === 'admin' && <AdminBadge />}
                          {member.userId === currentUserId && (
                            <span className='text-muted-foreground text-xs'>(You)</span>
                          )}
                        </p>
                      </div>
                      {isAdmin && member.userId !== currentUserId && (
                        <button
                          type='button'
                          onClick={() => handleRemoveMember(member)}
                          className='text-muted-foreground hover:text-destructive ml-auto'
                          aria-label='Remove member'
                        >
                          <UserMinus className='size-4' />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </DetailsSection>
            )}

            {/* Group Actions */}
            {isGroup && (
              <DetailsSection title='Group'>
                <div className='space-y-1'>
                  {isAdmin && (
                    <button
                      type='button'
                      onClick={() => setShowRename(true)}
                      className='hover:bg-accent flex w-full items-center gap-3 rounded-md p-2 text-sm'
                    >
                      <Pencil className='size-5' />
                      <span>Rename group</span>
                    </button>
                  )}
                  <button
                    type='button'
                    onClick={handleLeaveGroup}
                    className='text-destructive hover:bg-destructive/10 flex w-full items-center gap-3 rounded-md p-2 text-sm'
                  >
                    <LogOut className='size-5' />
                    <span>Leave group</span>
                  </button>
                </div>
              </DetailsSection>
            )}

            {/* Actions */}
            <DetailsSection title='Actions'>
              <div className='space-y-1'>
                <button
                  type='button'
                  className='text-destructive hover:bg-destructive/10 flex w-full items-center gap-3 rounded-md p-2 text-sm'
                >
                  <Trash2 className='size-5' />
                  <span>Delete conversation</span>
                </button>
              </div>
            </DetailsSection>
          </div>
        </div>
      </div>

      <AddMemberDialog
        open={showAddMember}
        onOpenChange={setShowAddMember}
        conversationId={conversation.id}
      />
      <RemoveMemberDialog
        open={showRemoveMember}
        onOpenChange={setShowRemoveMember}
        conversationId={conversation.id}
        member={selectedMember}
      />
      <RenameGroupDialog
        open={showRename}
        onOpenChange={setShowRename}
        conversation={conversation}
        currentUserId={currentUserId}
      />
      <LeaveGroupDialog
        open={showLeave}
        onOpenChange={setShowLeave}
        conversation={conversation}
      />
    </>
  )
}
