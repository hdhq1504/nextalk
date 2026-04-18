import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/PasswordInput/PasswordInput'
import { authService } from '@/utils/auth'

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm({ className, ...props }: React.ComponentProps<'form'>) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  useEffect(() => {
    document.getElementById('email')?.focus()
  }, [])

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const response = await authService.login(data.email, data.password)
      authService.saveTokens(response.tokens)
      toast.success('Login successful', {
        description: `Welcome back, ${response.user.username}!`
      })
      navigate('/')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      toast.error('Login failed', {
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
        <h1 className='text-2xl font-semibold tracking-tight'>Login to your account</h1>
        <p className='text-muted-foreground text-sm'>Enter your email below to login to your account</p>
      </div>

      <div className='flex flex-col gap-5'>
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
            placeholder='Enter your password'
            autoComplete='current-password'
            disabled={isLoading}
            aria-invalid={!!errors.password}
            {...register('password')}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          {errors.password && <FieldError id='password-error'>{errors.password.message}</FieldError>}
        </Field>
      </div>

      <div className='flex items-center'>
        <Checkbox id='remember' className='mr-2' />
        <label htmlFor='remember' className='text-muted-foreground cursor-pointer text-sm select-none'>
          Remember me
        </label>
      </div>

      <Button type='submit' className='w-full' disabled={isLoading}>
        {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
        Login
      </Button>

      <p className='text-muted-foreground text-center text-sm'>
        Don&apos;t have an account?{' '}
        <Link to='/signup' className='text-foreground underline underline-offset-4 hover:opacity-80'>
          Sign up
        </Link>
      </p>
    </form>
  )
}

export default LoginForm
