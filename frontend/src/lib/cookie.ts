export interface CookieOptions {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  maxAge?: number
  path?: string
  domain?: string
}

export function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  return null
}

export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  const {
    httpOnly = false,
    secure = true,
    sameSite = 'lax',
    maxAge,
    path = '/',
    domain
  } = options

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`

  if (httpOnly) cookieString += '; HttpOnly'
  if (secure) cookieString += '; Secure'
  cookieString += `; SameSite=${sameSite}`
  if (maxAge !== undefined) cookieString += `; Max-Age=${maxAge}`
  cookieString += `; Path=${path}`
  if (domain) cookieString += `; Domain=${domain}`

  document.cookie = cookieString
}

export function deleteCookie(
  name: string,
  options: { path?: string; domain?: string } = {}
): void {
  const { path = '/', domain } = options

  let cookieString = `${encodeURIComponent(name)}=`

  cookieString += '; Max-Age=0'
  cookieString += `; Path=${path}`
  if (domain) cookieString += `; Domain=${domain}`

  document.cookie = cookieString
}
