export interface User {
  id: string
  email: string
  username: string
  avatarUrl: string | null
  phone: string | null
  dateOfBirth: string | null
  bio: string | null
  isOnline: boolean
  lastSeen: string | null
  createdAt: string
}

export interface Tokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  user: User
  tokens: Tokens
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface UpdateProfileDto {
  username?: string
  phone?: string | null
  dateOfBirth?: string | null
  bio?: string | null
}
