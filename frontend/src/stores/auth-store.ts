import { create } from 'zustand'
import { authService } from '@/services/auth.service'
import { isTokenExpired } from '@/lib/token'
import type { User, UpdateProfileDto } from '@/types/auth'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, username: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  setUser: (user: User | null) => void
  updateProfile: (data: UpdateProfileDto) => Promise<void>
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true })
    try {
      await authService.login(email, password)
      const user = await authService.getProfile()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  register: async (email: string, password: string, username: string) => {
    set({ isLoading: true })
    try {
      await authService.register(email, password, username)
      const user = await authService.getProfile()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: () => {
    authService.clearTokens()
    set({ user: null, isAuthenticated: false })
  },

  checkAuth: async () => {
    const accessToken = authService.getAccessToken()
    const refreshToken = authService.getRefreshToken()

    if (!accessToken || !refreshToken) {
      set({ isAuthenticated: false, user: null })
      return
    }

    if (!isTokenExpired(accessToken)) {
      try {
        const user = await authService.getProfile()
        set({ isAuthenticated: true, user })
      } catch {
        set({ isAuthenticated: false, user: null })
      }
      return
    }

    if (!isTokenExpired(refreshToken)) {
      set({ isLoading: true })
      try {
        await authService.refreshTokens()
        const user = await authService.getProfile()
        set({ isAuthenticated: true, user, isLoading: false })
      } catch {
        authService.clearTokens()
        set({ isAuthenticated: false, user: null, isLoading: false })
      }
    } else {
      authService.clearTokens()
      set({ isAuthenticated: false, user: null })
    }
  },

  setUser: (user: User | null) => {
    set({ user })
  },

  updateProfile: async (data: UpdateProfileDto) => {
    set({ isLoading: true })
    try {
      const user = await authService.updateProfile(data)
      set({ user, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  }
}))

export type { AuthState }
