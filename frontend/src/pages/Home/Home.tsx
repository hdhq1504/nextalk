import { useNavigate } from 'react-router'
import { LogOut, User, Settings } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { authService } from '@/utils/auth'

export default function HomePage() {
  const navigate = useNavigate()

  const handleLogout = () => {
    authService.clearTokens()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const user = JSON.parse(localStorage.getItem('auth-storage')?.slice(16) || '{}')?.state?.user

  return (
    <div className='flex min-h-svh flex-col'>
      {/* Header */}
      <header className='border-b border-[#eceae4]'>
        <div className='mx-auto flex h-16 max-w-5xl items-center justify-between px-6'>
          <span className='text-xl font-semibold'>NexTalk</span>
          <div className='flex items-center gap-4'>
            <Button variant='ghost' size='icon'>
              <Settings className='h-5 w-5' />
            </Button>
            <Button variant='ghost' size='icon' onClick={handleLogout}>
              <LogOut className='h-5 w-5' />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='flex flex-1 items-center justify-center p-6'>
        <div className='w-full max-w-5xl text-center'>
          {user ? (
            <div className='space-y-4'>
              <div className='mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#eceae4]'>
                <User className='h-10 w-10 text-[#1c1c1c]' />
              </div>
              <h1 className='text-3xl font-semibold tracking-tight'>Welcome back, {user.username}!</h1>
              <p className='text-muted-foreground text-lg'>
                Your account is ready. Start connecting with people around you.
              </p>
              <div className='mt-8 flex justify-center gap-4'>
                <Button size='lg'>Start a Conversation</Button>
                <Button variant='outline' size='lg'>
                  Find Contacts
                </Button>
              </div>
            </div>
          ) : (
            <div className='space-y-4'>
              <h1 className='text-3xl font-semibold tracking-tight'>Welcome to NexTalk</h1>
              <p className='text-muted-foreground text-lg'>
                Connect with friends and colleagues in real-time conversations.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
