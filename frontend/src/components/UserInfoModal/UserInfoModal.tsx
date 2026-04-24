import { X, Mail, Calendar, UserPlus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getOtherMember } from '@/utils/conversation'
import type { Conversation } from '@/types/chat'
import type { User } from '@/types/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

interface UserInfoModalProps {
  conversation: Conversation | null
  currentUserId: string
  open: boolean
  onClose: () => void
  onAddFriend?: (userId: string) => void
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function UserInfoModal({
  conversation,
  currentUserId,
  open,
  onClose,
  onAddFriend
}: UserInfoModalProps) {
  if (!open || !conversation) return null

  const otherMember = getOtherMember(conversation.members, currentUserId)
  const displayName =
    conversation.name ||
    otherMember?.user.username ||
    otherMember?.user.email ||
    'Unknown'

  const avatarUrl = otherMember?.user.avatarUrl
  const initials = displayName.slice(0, 2).toUpperCase()
  const isGroup = conversation.isGroup

  const renderUserInfo = (user: User) => (
    <div className='flex flex-col items-center gap-3'>
      <Avatar size='lg'>
        {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className='text-center'>
        <h3 className='text-lg font-medium'>{displayName}</h3>
        {user.email && (
          <p className='text-muted-foreground text-sm'>{user.email}</p>
        )}
      </div>
    </div>
  )

  const renderGroupInfo = () => (
    <div className='flex flex-col items-center gap-3'>
      <Avatar size='lg'>
        <AvatarFallback className='bg-primary text-primary-foreground'>
          {conversation.name?.slice(0, 2).toUpperCase() || 'GP'}
        </AvatarFallback>
      </Avatar>
      <div className='text-center'>
        <h3 className='text-lg font-medium'>{conversation.name || 'Group'}</h3>
        <p className='text-muted-foreground text-sm'>
          {conversation.members.length} members
        </p>
      </div>
    </div>
  )

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 z-40 bg-black/50'
        onClick={onClose}
        aria-hidden='true'
      />

      {/* Modal */}
      <div
        className={cn(
          'bg-background fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-xl',
          'animate-in fade-in zoom-in-95 duration-200'
        )}
      >
        {/* Header */}
        <div className='flex h-14 items-center justify-between border-b px-4'>
          <h2 className='text-base font-medium'>Contact Info</h2>
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
        <div className='max-h-[60vh] overflow-y-auto p-4 sm:max-h-none'>
          {isGroup ? renderGroupInfo() : renderUserInfo(otherMember!.user)}

          <Separator className='my-4' />

          {/* Details */}
          <div className='space-y-4'>
            {!isGroup && (
              <>
                <div className='flex items-center gap-3 text-sm'>
                  <Mail className='text-muted-foreground size-4' />
                  <span className='text-muted-foreground'>Email</span>
                  <span className='ml-auto truncate'>
                    {otherMember?.user.email || '-'}
                  </span>
                </div>

                {otherMember?.joinedAt && (
                  <div className='flex items-center gap-3 text-sm'>
                    <Calendar className='text-muted-foreground size-4' />
                    <span className='text-muted-foreground'>Joined</span>
                    <span className='ml-auto'>
                      {formatDate(otherMember.joinedAt)}
                    </span>
                  </div>
                )}
              </>
            )}

            {isGroup && (
              <div className='space-y-2'>
                <h4 className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
                  Members
                </h4>
                <div className='space-y-2'>
                  {conversation.members.map((member) => (
                    <div
                      key={member.userId}
                      className='flex items-center gap-3'
                    >
                      <Avatar size='sm'>
                        {member.user.avatarUrl && (
                          <AvatarImage
                            src={member.user.avatarUrl}
                            alt={member.user.username}
                          />
                        )}
                        <AvatarFallback>
                          {member.user.username?.slice(0, 2).toUpperCase() ||
                            'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm'>
                          {member.user.username ||
                            member.user.email ||
                            'Unknown'}
                        </p>
                        {member.userId === currentUserId && (
                          <p className='text-muted-foreground text-xs'>You</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator className='my-4' />

          {/* Actions */}
          <div className='flex gap-2'>
            {!isGroup && otherMember?.userId && (
              <>
                <Button
                  variant='outline'
                  className='flex-1'
                  onClick={() => {
                    onAddFriend?.(otherMember.userId)
                    onClose()
                  }}
                >
                  <UserPlus className='mr-2 size-4' />
                  Add Friend
                </Button>
                <Button variant='outline' className='flex-1'>
                  <Check className='mr-2 size-4' />
                  Accept
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default UserInfoModal
