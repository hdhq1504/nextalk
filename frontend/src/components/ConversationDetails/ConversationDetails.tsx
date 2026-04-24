import { X, Bell, BellOff, Trash2, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getOtherMember } from '@/utils/conversation'
import type { Conversation } from '@/types/chat'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'

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

export function ConversationDetails({
  conversation,
  currentUserId,
  open,
  onClose
}: ConversationDetailsProps) {
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
  const memberCount = conversation.members.length

  return (
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
            ) : (
              otherMember?.user.email && (
                <p className='text-muted-foreground text-sm'>
                  {otherMember.user.email}
                </p>
              )
            )}
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
                      <p className='truncate text-sm font-medium'>
                        {member.user.username || member.user.email || 'Unknown'}
                      </p>
                      {member.userId === currentUserId && (
                        <p className='text-muted-foreground text-xs'>You</p>
                      )}
                    </div>
                  </div>
                ))}
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
  )
}
