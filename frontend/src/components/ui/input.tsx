import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot='input'
      className={cn(
        'border-border bg-input text-foreground placeholder:text-muted-foreground h-10 w-full min-w-0 rounded-md border px-3 py-1.5 text-base transition-[color,box-shadow] outline-none',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/50 aria-invalid:ring-[3px]',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'active:shadow-focus',
        type === 'search' &&
          '[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden',
        className
      )}
      {...props}
    />
  )
}

export { Input }
