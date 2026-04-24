import { Link } from 'react-router'
import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='grid min-h-svh overflow-hidden lg:grid-cols-2'>
      {/* Left side - Form */}
      <div className='flex flex-col'>
        <header className='shrink-0'>
          <div className='flex h-16 max-w-md items-center px-6 md:px-10'>
            <Link to='/' className='flex items-center gap-2'>
              <span className='text-xl font-semibold'>NexTalk</span>
            </Link>
          </div>
        </header>

        <main className='flex flex-1 items-center justify-center p-6 md:p-10'>
          <div className='w-full max-w-md'>{children}</div>
        </main>
      </div>

      {/* Right side - Background image */}
      <div
        className='relative hidden bg-cover bg-center bg-no-repeat lg:flex lg:flex-col lg:items-center lg:justify-center'
        style={{ backgroundImage: "url('/background.jpg')" }}
      >
        <div className='absolute inset-0 bg-black/30' />
        <div className='relative z-10 text-center text-white'>
          <h2 className='text-4xl font-semibold tracking-tight'>
            Welcome to NexTalk
          </h2>
          <p className='mt-4 max-w-md text-lg'>
            Connect with friends and colleagues in real-time conversations.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
