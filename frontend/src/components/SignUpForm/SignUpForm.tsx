import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/PasswordInput/PasswordInput'
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator/PasswordStrengthIndicator'
import { authService } from '@/utils/auth'

const signUpSchema = z
  .object({
    username: z.string().min(2, 'Username must be at least 2 characters').max(50, 'Username too long'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  })

type SignUpFormData = z.infer<typeof signUpSchema>

export function SignUpForm({ className, ...props }: React.ComponentProps<'form'>) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema)
  })

  const passwordValue = useWatch({ control, name: 'password' })

  useEffect(() => {
    document.getElementById('username')?.focus()
  }, [])

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true)
    try {
      const response = await authService.register(data.email, data.password, data.username)
      authService.saveTokens(response.tokens)
      toast.success('Registration successful', {
        description: `Welcome, ${response.user.username}!`
      })
      navigate('/')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed'
      toast.error('Registration failed', {
        description: message
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      className={cn('animate-slide-up flex flex-col gap-6', className)}
      onSubmit={handleSubmit(onSubmit)}
      {...props}
    >
      <div className='flex flex-col items-center gap-1 text-center'>
        <h1 className='text-2xl font-semibold tracking-tight'>Create an account</h1>
        <p className='text-muted-foreground text-sm'>Enter your details below to create your account</p>
      </div>

      <div className='flex flex-col gap-5'>
        <Field error={!!errors.username}>
          <FieldLabel htmlFor='username'>Username</FieldLabel>
          <Input
            id='username'
            type='text'
            placeholder='Enter your username'
            autoComplete='username'
            disabled={isLoading}
            aria-invalid={!!errors.username}
            {...register('username')}
            aria-describedby={errors.username ? 'username-error' : undefined}
          />
          {errors.username && <FieldError id='username-error'>{errors.username.message}</FieldError>}
        </Field>

        <Field error={!!errors.email}>
          <FieldLabel htmlFor='email'>Email</FieldLabel>
          <Input
            id='email'
            type='email'
            placeholder='Enter your email'
            autoComplete='email'
            disabled={isLoading}
            aria-invalid={!!errors.email}
            {...register('email')}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && <FieldError id='email-error'>{errors.email.message}</FieldError>}
        </Field>

        <Field error={!!errors.password}>
          <FieldLabel htmlFor='password'>Password</FieldLabel>
          <PasswordInput
            id='password'
            placeholder='Create a password'
            autoComplete='new-password'
            disabled={isLoading}
            aria-invalid={!!errors.password}
            {...register('password')}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          {errors.password && <FieldError id='password-error'>{errors.password.message}</FieldError>}
          <PasswordStrengthIndicator password={passwordValue || ''} className='mt-3' />
        </Field>

        <Field error={!!errors.confirmPassword}>
          <FieldLabel htmlFor='confirmPassword'>Confirm Password</FieldLabel>
          <PasswordInput
            id='confirmPassword'
            placeholder='Confirm your password'
            autoComplete='new-password'
            disabled={isLoading}
            aria-invalid={!!errors.confirmPassword}
            {...register('confirmPassword')}
            aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
          />
          {errors.confirmPassword && (
            <FieldError id='confirmPassword-error'>{errors.confirmPassword.message}</FieldError>
          )}
        </Field>
      </div>

      <Button type='submit' className='w-full' disabled={isLoading}>
        {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
        Create Account
      </Button>

      <p className='text-muted-foreground text-center text-sm'>
        Already have an account?{' '}
        <Link to='/login' className='text-foreground underline underline-offset-4 hover:opacity-80'>
          Login
        </Link>
      </p>
    </form>
  )
}

export default SignUpForm
