import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface PasswordInputProps extends Omit<React.ComponentProps<'input'>, 'type'> {
  showToggle?: boolean
}

function PasswordInput({ className, showToggle = true, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <div className='relative'>
      <Input
        type={showPassword ? 'text' : 'password'}
        data-slot='password-input'
        className={cn('pe-10', className)}
        {...props}
      />
      {showToggle && (
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          className='text-muted-foreground hover:text-foreground absolute inset-e-1 top-1/2 -translate-y-1/2'
          onClick={() => setShowPassword(!showPassword)}
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
        </Button>
      )}
    </div>
  )
}

export { PasswordInput }
