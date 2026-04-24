import { ConversationList } from '../ConversationList/ConversationList'
import { UserMenu } from '../UserMenu/UserMenu'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/stores/auth-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { getInitials } from '@/utils/format'

interface SidebarProps {
  className?: string
  onConversationClick?: () => void
}

export function Sidebar({ className, onConversationClick }: SidebarProps) {
  const user = useAuthStore((state) => state.user)

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <ConversationList onConversationClick={onConversationClick} />

      <Separator />

      <div className='border-t p-1.5'>
        <UserMenu className='hover:bg-accent flex min-w-0 items-center gap-3 rounded-md p-2'>
          <Avatar>
            <AvatarImage
              src={user?.avatarUrl || undefined}
              alt={user?.username || 'User'}
            />
            <AvatarFallback>
              {user?.username ? getInitials(user.username) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0 flex-1'>
            <p className='truncate text-sm font-medium'>
              {user?.username || 'User'}
            </p>
            <p className='text-muted-foreground truncate text-xs'>
              {user?.email || 'No email'}
            </p>
          </div>
        </UserMenu>
      </div>
    </div>
  )
}
