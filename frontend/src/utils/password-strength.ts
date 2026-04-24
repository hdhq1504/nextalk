export type PasswordStrength = 'empty' | 'weak' | 'medium' | 'strong'

export interface PasswordRequirements {
  minLength: boolean
  hasUppercase: boolean
  hasNumber: boolean
  hasSpecial: boolean
}

const SPECIAL_CHARS = /[!@#$%^&*()_+\-=[\]{};':"|\\,.<>/?~`]/

export function checkPasswordStrength(password: string): {
  strength: PasswordStrength
  requirements: PasswordRequirements
} {
  const requirements: PasswordRequirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: SPECIAL_CHARS.test(password)
  }

  const passedCount = Object.values(requirements).filter(Boolean).length

  let strength: PasswordStrength = 'empty'
  if (password.length === 0) {
    strength = 'empty'
  } else if (passedCount <= 1) {
    strength = 'weak'
  } else if (passedCount <= 3) {
    strength = 'medium'
  } else {
    strength = 'strong'
  }

  return { strength, requirements }
}

export function getStrengthColor(strength: PasswordStrength): string {
  switch (strength) {
    case 'empty':
      return 'bg-muted'
    case 'weak':
      return 'bg-red-500'
    case 'medium':
      return 'bg-yellow-500'
    case 'strong':
      return 'bg-green-500'
  }
}

export function getStrengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case 'empty':
      return ''
    case 'weak':
      return 'Weak'
    case 'medium':
      return 'Medium'
    case 'strong':
      return 'Strong'
  }
}
