import { useState } from 'react'
import { toast } from 'sonner'
import type { Conversation } from '@/types/chat'
import { useChatStore } from '@/stores/chat-store'
import { cn } from '@/lib/utils'
import { getInitials } from '@/utils/format'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface DialogControlProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddMemberDialog({
  open,
  onOpenChange,
  conversationId
}: DialogControlProps & {
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
      toast.error(
        error instanceof Error ? error.message : 'Failed to add member'
      )
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
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
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

export function RemoveMemberDialog({
  open,
  onOpenChange,
  conversationId,
  member
}: DialogControlProps & {
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
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove member'
      )
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
            Are you sure you want to remove {member?.user.username} from the
            group?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={handleRemove}
            disabled={isLoading}
          >
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RenameGroupDialog({
  open,
  onOpenChange,
  conversation
}: DialogControlProps & {
  conversation: Conversation | null
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
      toast.error(
        error instanceof Error ? error.message : 'Failed to rename group'
      )
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
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
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

export function LeaveGroupDialog({
  open,
  onOpenChange,
  conversation,
  currentUserId
}: DialogControlProps & {
  conversation: Conversation | null
  currentUserId: string
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [newAdminId, setNewAdminId] = useState('')
  const leaveGroup = useChatStore((state) => state.leaveGroup)
  const currentMember = conversation?.members.find(
    (member) => member.userId === currentUserId
  )
  const isCurrentUserAdmin = currentMember?.role === 'admin'
  const adminCandidates =
    conversation?.members.filter((member) => member.userId !== currentUserId) ??
    []

  const handleLeave = async () => {
    if (!conversation) return
    setIsLoading(true)
    try {
      await leaveGroup(conversation.id, newAdminId || undefined)
      toast.success('You left the group')
      onOpenChange(false)
      setNewAdminId('')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to leave group'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setNewAdminId('')
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave Group</DialogTitle>
          <DialogDescription>
            {isCurrentUserAdmin && adminCandidates.length > 0
              ? 'Choose a new admin before leaving the group.'
              : `Are you sure you want to leave ${conversation?.name || 'this group'}?`}
          </DialogDescription>
        </DialogHeader>
        {isCurrentUserAdmin && adminCandidates.length > 0 && (
          <div className='space-y-2'>
            {adminCandidates.map((member) => {
              const selected = member.userId === newAdminId

              return (
                <button
                  key={member.userId}
                  type='button'
                  onClick={() => setNewAdminId(member.userId)}
                  disabled={isLoading}
                  className={cn(
                    'hover:bg-accent flex w-full items-center gap-3 rounded-md border p-2 text-left',
                    selected && 'border-primary bg-primary/5'
                  )}
                >
                  <Avatar size='sm'>
                    {member.user.avatarUrl && (
                      <AvatarImage
                        src={member.user.avatarUrl}
                        alt={member.user.username}
                      />
                    )}
                    <AvatarFallback>
                      {member.user.username
                        ? getInitials(member.user.username)
                        : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className='min-w-0 flex-1 truncate text-sm font-medium'>
                    {member.user.username || member.user.email || 'Unknown'}
                  </span>
                  <span
                    className={cn(
                      'size-3 rounded-full border',
                      selected && 'border-primary bg-primary'
                    )}
                    aria-hidden='true'
                  />
                </button>
              )
            })}
          </div>
        )}
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant='destructive'
            onClick={handleLeave}
            disabled={
              isLoading ||
              (isCurrentUserAdmin && adminCandidates.length > 0 && !newAdminId)
            }
          >
            Leave
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
