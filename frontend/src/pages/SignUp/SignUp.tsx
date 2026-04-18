import { Link } from 'react-router'

import SignUpForm from '@/components/SignUpForm'

export default function SignUpPage() {
  return (
    <div className='grid min-h-svh overflow-hidden lg:grid-cols-2'>
      {/* Left side - Form */}
      <div className='flex flex-col'>
        <header className='border-border shrink-0 border-b'>
          <div className='mx-auto flex h-16 max-w-md items-center justify-start px-6'>
            <Link to='/' className='flex items-center gap-2'>
              <span className='text-xl font-semibold'>Nextalk</span>
            </Link>
          </div>
        </header>

        <main className='flex flex-1 items-center justify-center p-6 md:p-10'>
          <div className='w-full max-w-md'>
            <SignUpForm />
          </div>
        </main>
      </div>

      {/* Right side - Background image */}
      <div className="relative hidden lg:flex lg:flex-col lg:items-center lg:justify-center bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/background.jpg')" }}>
        <div className='absolute inset-0 bg-black/30' />
        <div className='relative z-10 text-center text-white'>
          <h2 className='text-4xl font-semibold tracking-tight'>Join Nextalk</h2>
          <p className='mt-4 max-w-md text-lg'>Start connecting with people around you today.</p>
        </div>
      </div>
    </div>
  )
}
