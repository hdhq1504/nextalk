import { apiClient } from '@/lib/axios'
import { getCookie, setCookie, deleteCookie } from '@/lib/cookie'
import type {
  AuthResponse,
  Tokens,
  ApiResponse,
  User,
  UpdateProfileDto
} from '@/types/auth'

export type { User, Tokens, AuthResponse, ApiResponse } from '@/types/auth'

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_COOKIE = 'refreshToken'
const REMEMBER_EMAIL_COOKIE = 'rememberedEmail'

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/login',
      {
        email,
        password
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Login failed')
    }

    if (!response.data.data) {
      throw new Error('No data returned from server')
    }

    this.saveTokens(response.data.data.tokens)
    return response.data.data
  },

  async register(
    email: string,
    password: string,
    username: string
  ): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/register',
      {
        email,
        password,
        username
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Registration failed')
    }

    if (!response.data.data) {
      throw new Error('No data returned from server')
    }

    this.saveTokens(response.data.data.tokens)
    return response.data.data
  },

  async refreshTokens(): Promise<Tokens> {
    const response = await apiClient.post<ApiResponse<Tokens>>('/auth/refresh')

    if (!response.data.success || !response.data.data) {
      throw new Error('Token refresh failed')
    }

    this.saveTokens(response.data.data)
    return response.data.data
  },

  saveTokens(tokens: Tokens): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)

    setCookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      maxAge: 604800
    })
  },

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    deleteCookie(REFRESH_TOKEN_COOKIE)
  },

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  getRefreshToken(): string | null {
    return getCookie(REFRESH_TOKEN_COOKIE)
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/auth/profile')

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch profile')
    }

    return response.data.data
  },

  async updateProfile(data: UpdateProfileDto): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(
      '/auth/profile',
      data
    )

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to update profile')
    }

    return response.data.data
  },

  hasValidTokens(): boolean {
    return this.getAccessToken() !== null && this.getRefreshToken() !== null
  },

  async checkEmail(email: string): Promise<boolean> {
    const response = await apiClient.post<ApiResponse<{ exists: boolean }>>(
      '/auth/check-email',
      {
        email
      }
    )

    if (!response.data.success || !response.data.data) {
      return false
    }

    return response.data.data.exists
  },

  getRememberedEmail(): string | null {
    return getCookie(REMEMBER_EMAIL_COOKIE)
  },

  setRememberedEmail(email: string): void {
    setCookie(REMEMBER_EMAIL_COOKIE, email, {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    })
  },

  clearRememberedEmail(): void {
    deleteCookie(REMEMBER_EMAIL_COOKIE)
  }
}
