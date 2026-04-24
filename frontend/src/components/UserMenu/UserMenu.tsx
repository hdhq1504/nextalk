import { LogOut, Settings, User, Bell } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { friendService } from '@/services/friend.service'
import SettingsModal from '@/components/SettingsModal'
import FriendRequestModal from '@/components/FriendRequestModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface UserMenuProps {
  children: React.ReactNode
  className?: string
}

export function UserMenu({ children, className }: UserMenuProps) {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [friendRequestsOpen, setFriendRequestsOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const count = await friendService.getPendingRequestsCount()
        setPendingCount(count)
      } catch {
        // Silently fail - badge is optional
      }
    }
    fetchPendingCount()
  }, [friendRequestsOpen])

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const handleRequestsChange = (count: number) => {
    setPendingCount(count)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className={cn('flex w-full cursor-pointer', className)}>
            {children}
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent align='end' side='top' sideOffset={8}>
          <DropdownMenuItem
            onClick={() => navigate('/profile')}
            className='cursor-pointer'
          >
            <User className='size-5' />
            Profile
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setSettingsOpen(true)}
            className='cursor-pointer'
          >
            <Settings className='size-5' />
            Settings
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setFriendRequestsOpen(true)}
            className='cursor-pointer'
          >
            <div className='relative'>
              <Bell className='size-5' />
              {pendingCount > 0 && (
                <span className='bg-destructive text-destructive-foreground absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold'>
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </div>
            Notifications
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            variant='destructive'
            className='cursor-pointer'
          >
            <LogOut className='size-5' />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

      <FriendRequestModal
        open={friendRequestsOpen}
        onOpenChange={setFriendRequestsOpen}
        onRequestsChange={handleRequestsChange}
      />
    </>
  )
}
