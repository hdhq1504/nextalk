import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  checkPasswordStrength,
  getStrengthColor,
  getStrengthLabel,
  type PasswordRequirements
} from '@/utils/password-strength'

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
}

function PasswordStrengthIndicator({
  password,
  className
}: PasswordStrengthIndicatorProps) {
  const { strength, requirements } = checkPasswordStrength(password)

  if (!password) {
    return null
  }

  const requirementsList: { key: keyof PasswordRequirements; label: string }[] =
    [
      { key: 'minLength', label: 'At least 8 characters' },
      { key: 'hasUppercase', label: 'Contains uppercase letter' },
      { key: 'hasNumber', label: 'Contains number' },
      { key: 'hasSpecial', label: 'Contains special character' }
    ]

  const passedCount = Object.values(requirements).filter(Boolean).length

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength bar */}
      <div className='flex gap-1.5'>
        {[1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              index <= passedCount ? getStrengthColor(strength) : 'bg-muted'
            )}
          />
        ))}
      </div>

      {/* Strength label */}
      {strength !== 'empty' && (
        <p
          className={cn(
            'text-sm font-medium',
            strength === 'weak' && 'text-destructive',
            strength === 'medium' && 'text-yellow-600',
            strength === 'strong' && 'text-green-600'
          )}
        >
          {getStrengthLabel(strength)}
        </p>
      )}

      {/* Requirements checklist */}
      <ul className='space-y-1.5'>
        {requirementsList.map(({ key, label }) => (
          <li
            key={key}
            className='text-muted-foreground flex items-center gap-2 text-sm'
          >
            <Check
              className={cn(
                'h-4 w-4 shrink-0',
                requirements[key] ? 'text-green-600' : 'text-muted'
              )}
            />
            <span className={cn(requirements[key] && 'text-foreground')}>
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export { PasswordStrengthIndicator }
