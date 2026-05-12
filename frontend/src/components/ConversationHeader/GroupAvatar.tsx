import { cn } from '@/lib/utils'
import { getInitials } from '@/utils/format'
import type { Conversation } from '@/types/chat'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface GroupAvatarProps {
  members: Conversation['members']
  className?: string
}

function GroupAvatarCell({
  member,
  className
}: {
  member: Conversation['members'][number]
  className?: string
}) {
  return (
    <Avatar className={cn('h-full w-full rounded-none', className)}>
      {member.user.avatarUrl && (
        <AvatarImage src={member.user.avatarUrl} alt={member.user.username} />
      )}
      <AvatarFallback className='text-[8px]'>
        {getInitials(member.user.username, 1)}
      </AvatarFallback>
    </Avatar>
  )
}

export function GroupAvatar({ members, className }: GroupAvatarProps) {
  const visibleMembers = members.slice(0, 4)
  const count = members.length

  if (visibleMembers.length === 1) {
    const member = visibleMembers[0]

    return (
      <Avatar className={className}>
        {member.user.avatarUrl && (
          <AvatarImage src={member.user.avatarUrl} alt={member.user.username} />
        )}
        <AvatarFallback>{getInitials(member.user.username, 1)}</AvatarFallback>
      </Avatar>
    )
  }

  if (visibleMembers.length === 2) {
    const [first, second] = visibleMembers

    return (
      <div className={cn('relative overflow-hidden rounded-full', className)}>
        <div className='flex aspect-square w-full'>
          <div className='w-1/2 overflow-hidden'>
            <GroupAvatarCell member={first} />
          </div>
          <div className='w-1/2 overflow-hidden'>
            <GroupAvatarCell member={second} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-muted relative overflow-hidden rounded-full',
        className
      )}
    >
      <div className='flex aspect-square w-full flex-col'>
        <div className='flex h-1/2'>
          {visibleMembers.slice(0, 2).map((member) => (
            <div key={member.userId} className='w-1/2 overflow-hidden'>
              <GroupAvatarCell member={member} />
            </div>
          ))}
        </div>
        <div className='flex h-1/2'>
          {visibleMembers.slice(2, 4).map((member) => (
            <div key={member.userId} className='w-1/2 overflow-hidden'>
              <GroupAvatarCell member={member} />
            </div>
          ))}
        </div>
      </div>
      {count > 4 && (
        <div className='bg-muted-foreground/30 absolute inset-0 flex items-center justify-center'>
          <span className='text-[10px] font-medium text-white'>
            +{count - 4}
          </span>
        </div>
      )}
    </div>
  )
}
