import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const themes = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor }
] as const

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { theme, setTheme } = useTheme()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Customize your experience</DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>Theme</h3>
            <div className='grid grid-cols-3 gap-2'>
              {themes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type='button'
                  onClick={() => setTheme(value)}
                  className={cn(
                    'relative flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors',
                    'hover:bg-accent',
                    theme === value
                      ? 'border-primary bg-accent'
                      : 'border-border'
                  )}
                >
                  <Icon className='size-5' />
                  <span className='text-xs font-medium'>{label}</span>
                  {theme === value && (
                    <Check className='absolute top-2 right-2 size-4' />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className='flex justify-end'>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
