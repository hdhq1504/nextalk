import type { ReactNode } from 'react'

interface DetailsSectionProps {
  title: string
  children: ReactNode
}

export function DetailsSection({ title, children }: DetailsSectionProps) {
  return (
    <div className='space-y-3'>
      <h3 className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
        {title}
      </h3>
      {children}
    </div>
  )
}

export function AdminBadge() {
  return (
    <span className='bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-medium'>
      Admin
    </span>
  )
}
