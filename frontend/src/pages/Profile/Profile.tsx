import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Camera } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)
const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
]
const currentYear = new Date().getFullYear()
const YEARS = Array.from(
  { length: currentYear - 1900 + 1 },
  (_, i) => currentYear - i
)

const profileSchema = z.object({
  username: z
    .string()
    .min(2, 'Username must be at least 2 characters')
    .max(50, 'Username too long'),
  phone: z.string().optional(),
  birthDay: z.string().optional(),
  birthMonth: z.string().optional(),
  birthYear: z.string().optional(),
  bio: z.string().max(500, 'Bio is too long').optional()
})

type ProfileFormData = z.infer<typeof profileSchema>

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDateDisplay(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Not set'
  const date = new Date(dateStr)
  return format(date, 'dd/MM/yyyy', { locale: vi })
}

function parseDateOfBirth(dateStr: string | null | undefined): {
  day: string
  month: string
  year: string
} {
  if (!dateStr) return { day: '', month: '', year: '' }
  const date = new Date(dateStr)
  return {
    day: String(date.getDate()),
    month: String(date.getMonth() + 1),
    year: String(date.getFullYear())
  }
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, isLoading, updateProfile } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isDirty }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema)
  })

  const birthDay = useWatch({ control, name: 'birthDay' })
  const birthMonth = useWatch({ control, name: 'birthMonth' })
  const birthYear = useWatch({ control, name: 'birthYear' })

  useEffect(() => {
    if (user) {
      const { day, month, year } = parseDateOfBirth(user.dateOfBirth || null)
      reset({
        username: user.username || '',
        phone: user.phone || '',
        birthDay: day,
        birthMonth: month,
        birthYear: year,
        bio: user.bio || ''
      })
    }
  }, [user, reset])

  const buildDateOfBirth = (
    day: string,
    month: string,
    year: string
  ): string | null => {
    if (!day || !month || !year) return null
    const paddedDay = day.padStart(2, '0')
    const paddedMonth = month.padStart(2, '0')
    return `${year}-${paddedMonth}-${paddedDay}T00:00:00.000Z`
  }

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const dateOfBirth = buildDateOfBirth(
        data.birthDay || '',
        data.birthMonth || '',
        data.birthYear || ''
      )

      await updateProfile({
        username: data.username,
        phone: data.phone || null,
        dateOfBirth,
        bio: data.bio || null
      })
      toast.success('Profile updated successfully')
      setIsEditing(false)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update profile'
      toast.error('Error', { description: message })
    }
  }

  const handleCancel = () => {
    if (user) {
      const { day, month, year } = parseDateOfBirth(user.dateOfBirth || null)
      reset({
        username: user.username || '',
        phone: user.phone || '',
        birthDay: day,
        birthMonth: month,
        birthYear: year,
        bio: user.bio || ''
      })
    }
    setIsEditing(false)
  }

  return (
    <div className='flex min-h-svh flex-col'>
      {/* Header */}
      <header className='border-border bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b px-6 backdrop-blur'>
        <div className='flex items-center gap-4'>
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            onClick={() => navigate('/')}
            aria-label='Back to chat'
          >
            <ArrowLeft className='size-5' />
          </Button>
          <h1 className='text-lg font-semibold'>Profile settings</h1>
        </div>
        <div className='flex items-center gap-2'>
          {isEditing && (
            <>
              <Button
                type='button'
                variant='outline'
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                form='profile-form'
                disabled={isLoading || !isDirty}
              >
                {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Save changes
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <main className='flex flex-1 flex-col gap-6 p-6 md:p-8'>
        <form
          id='profile-form'
          onSubmit={handleSubmit(onSubmit)}
          className='mx-auto w-full max-w-2xl space-y-6'
        >
          {/* Profile Card */}
          <div className='bg-card rounded-xl border p-6'>
            <div className='flex flex-col items-center gap-6 sm:flex-row sm:items-start'>
              {/* Avatar */}
              <div className='relative shrink-0'>
                <Avatar className='size-24'>
                  <AvatarImage
                    src={user?.avatarUrl || undefined}
                    alt={user?.username || 'User'}
                  />
                  <AvatarFallback className='text-2xl'>
                    {user?.username ? getInitials(user.username) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <button
                  type='button'
                  className='bg-primary text-primary-foreground absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full shadow-md hover:opacity-90'
                  aria-label='Change avatar'
                >
                  <Camera className='size-4' />
                </button>
              </div>

              {/* User info */}
              <div className='flex flex-1 flex-col items-center text-center sm:items-start sm:text-left'>
                <h2 className='text-2xl font-semibold'>{user?.username}</h2>
                <p className='text-muted-foreground'>{user?.email}</p>
                {user?.bio && (
                  <p className='text-muted-foreground mt-2 text-sm'>
                    {user.bio}
                  </p>
                )}
              </div>

              {/* Edit button (desktop) */}
              {!isEditing && (
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setIsEditing(true)}
                  className='hidden sm:flex'
                >
                  Edit profile
                </Button>
              )}
            </div>
          </div>

          {/* Personal Information */}
          <div className='bg-card rounded-xl border p-6'>
            <h3 className='mb-6 text-lg font-semibold'>Personal information</h3>

            <div className='space-y-5'>
              <Field error={!!errors.username}>
                <div className='flex items-center gap-3'>
                  <div className='flex-1'>
                    <FieldLabel
                      htmlFor='username'
                      className='text-muted-foreground text-xs tracking-wider uppercase'
                    >
                      Username
                    </FieldLabel>
                    {isEditing ? (
                      <Input
                        id='username'
                        type='text'
                        placeholder='Enter username'
                        disabled={isLoading}
                        className='mt-1 h-10'
                        aria-invalid={!!errors.username}
                        {...register('username')}
                      />
                    ) : (
                      <p className='mt-1 font-medium'>
                        {user?.username || 'Not set'}
                      </p>
                    )}
                    {errors.username && (
                      <FieldError>{errors.username.message}</FieldError>
                    )}
                  </div>
                </div>
              </Field>

              <Separator />

              <Field>
                <div className='flex items-center gap-3'>
                  <div className='flex-1'>
                    <p className='text-muted-foreground text-xs tracking-wider uppercase'>
                      Email
                    </p>
                    <p className='mt-1 font-medium'>{user?.email}</p>
                    <p className='text-muted-foreground mt-0.5 text-xs'>
                      Email cannot be changed
                    </p>
                  </div>
                </div>
              </Field>

              <Separator />

              <Field error={!!errors.phone}>
                <div className='flex items-center gap-3'>
                  <div className='flex-1'>
                    <FieldLabel
                      htmlFor='phone'
                      className='text-muted-foreground text-xs tracking-wider uppercase'
                    >
                      Phone number
                    </FieldLabel>
                    {isEditing ? (
                      <Input
                        id='phone'
                        type='tel'
                        placeholder='Enter phone number'
                        disabled={isLoading}
                        className='mt-1 h-10'
                        aria-invalid={!!errors.phone}
                        {...register('phone')}
                      />
                    ) : (
                      <p className='mt-1 font-medium'>
                        {user?.phone || 'Not set'}
                      </p>
                    )}
                    {errors.phone && (
                      <FieldError>{errors.phone.message}</FieldError>
                    )}
                  </div>
                </div>
              </Field>

              <Separator />

              <Field>
                <div className='flex items-center gap-3'>
                  <div className='flex-1'>
                    <p className='text-muted-foreground text-xs tracking-wider uppercase'>
                      Date of birth
                    </p>
                    {isEditing ? (
                      <div className='mt-1 flex gap-2'>
                        {/* Day */}
                        <Select
                          value={birthDay}
                          onValueChange={(value) =>
                            setValue('birthDay', value, { shouldDirty: true })
                          }
                        >
                          <SelectTrigger className='flex-1'>
                            <SelectValue placeholder='Day' />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS.map((day) => (
                              <SelectItem key={day} value={String(day)}>
                                {String(day).padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Month */}
                        <Select
                          value={birthMonth}
                          onValueChange={(value) =>
                            setValue('birthMonth', value, { shouldDirty: true })
                          }
                        >
                          <SelectTrigger className='flex-1'>
                            <SelectValue placeholder='Month' />
                          </SelectTrigger>
                          <SelectContent>
                            {MONTHS.map((month) => (
                              <SelectItem
                                key={month.value}
                                value={String(month.value)}
                              >
                                {month.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Year */}
                        <Select
                          value={birthYear}
                          onValueChange={(value) =>
                            setValue('birthYear', value, { shouldDirty: true })
                          }
                        >
                          <SelectTrigger className='flex-1'>
                            <SelectValue placeholder='Year' />
                          </SelectTrigger>
                          <SelectContent>
                            {YEARS.map((year) => (
                              <SelectItem key={year} value={String(year)}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <p className='mt-1 font-medium'>
                        {formatDateDisplay(user?.dateOfBirth || null)}
                      </p>
                    )}
                  </div>
                </div>
              </Field>
            </div>
          </div>

          {/* About Me */}
          <div className='bg-card rounded-xl border p-6'>
            <h3 className='mb-6 text-lg font-semibold'>About me</h3>

            <Field error={!!errors.bio}>
              <div className='flex items-start gap-3'>
                <div className='flex-1'>
                  <FieldLabel
                    htmlFor='bio'
                    className='text-muted-foreground text-xs tracking-wider uppercase'
                  >
                    Bio
                  </FieldLabel>
                  {isEditing ? (
                    <Input
                      id='bio'
                      type='text'
                      placeholder='Introduce yourself'
                      disabled={isLoading}
                      className='mt-1 h-10'
                      aria-invalid={!!errors.bio}
                      {...register('bio')}
                    />
                  ) : (
                    <p className='mt-1 font-medium'>{user?.bio || 'Not set'}</p>
                  )}
                  {errors.bio && <FieldError>{errors.bio.message}</FieldError>}
                </div>
              </div>
            </Field>
          </div>

          {/* Mobile edit button */}
          {!isEditing && (
            <div className='flex sm:hidden'>
              <Button
                type='button'
                onClick={() => setIsEditing(true)}
                className='w-full'
              >
                Edit profile
              </Button>
            </div>
          )}
        </form>
      </main>
    </div>
  )
}
