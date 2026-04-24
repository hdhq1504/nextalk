export interface CookieOptions {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  maxAge?: number
  path?: string
  domain?: string
}

export const ACCESS_TOKEN_COOKIE = 'accessToken'
export const REFRESH_TOKEN_COOKIE = 'refreshToken'

export const ACCESS_TOKEN_MAX_AGE = 15 * 60 // 15 minutes in seconds
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

export const ACCESS_TOKEN_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: ACCESS_TOKEN_MAX_AGE,
  path: '/',
}

export const REFRESH_TOKEN_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: REFRESH_TOKEN_MAX_AGE,
  path: '/api/auth/refresh',
}

export function buildCookieHeader(name: string, value: string, options: CookieOptions): string {
  let cookieString = `${name}=${value}`

  if (options.httpOnly) cookieString += '; HttpOnly'
  if (options.secure) cookieString += '; Secure'
  if (options.sameSite) cookieString += `; SameSite=${options.sameSite}`
  if (options.maxAge !== undefined) cookieString += `; Max-Age=${options.maxAge}`
  if (options.path) cookieString += `; Path=${options.path}`
  if (options.domain) cookieString += `; Domain=${options.domain}`

  return cookieString
}

export function buildClearCookieHeader(name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): string {
  let cookieString = `${name}=`

  cookieString += '; Max-Age=0'
  if (options.path) cookieString += `; Path=${options.path}`
  if (options.domain) cookieString += `; Domain=${options.domain}`

  return cookieString
}
