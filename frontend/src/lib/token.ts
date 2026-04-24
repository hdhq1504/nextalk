interface TokenPayload {
  sub?: string
  iat?: number
  exp?: number
  [key: string]: unknown
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    )

    return JSON.parse(jsonPayload) as TokenPayload
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token)
  if (!payload?.exp) return true
  return Date.now() >= payload.exp * 1000
}

export function getTokenExpirationDate(token: string): Date | null {
  const payload = decodeToken(token)
  if (!payload?.exp) return null
  return new Date(payload.exp * 1000)
}

export function getTokenTimeRemaining(token: string): number {
  const payload = decodeToken(token)
  if (!payload?.exp) return 0
  return Math.max(0, payload.exp * 1000 - Date.now())
}
