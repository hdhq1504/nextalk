import type { UserSearchResult } from '@/types/friend'

export function matchesUserQuery(
  user: Pick<UserSearchResult, 'username' | 'email'>,
  query: string
): boolean {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true

  return (
    user.username.toLowerCase().includes(normalizedQuery) ||
    user.email.toLowerCase().includes(normalizedQuery)
  )
}
