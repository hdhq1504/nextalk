import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export interface DateParts {
  day: string
  month: string
  year: string
}

export function formatDateDisplay(
  dateString: string | null | undefined
): string {
  if (!dateString) return 'Not set'

  return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi })
}

export function formatLongDate(dateString: string | null | undefined): string {
  if (!dateString) return '-'

  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function parseDateParts(
  dateString: string | null | undefined
): DateParts {
  if (!dateString) return { day: '', month: '', year: '' }

  const date = new Date(dateString)
  return {
    day: String(date.getDate()),
    month: String(date.getMonth() + 1),
    year: String(date.getFullYear())
  }
}

export function buildDateOfBirth({
  day,
  month,
  year
}: DateParts): string | null {
  if (!day || !month || !year) return null

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`
}
