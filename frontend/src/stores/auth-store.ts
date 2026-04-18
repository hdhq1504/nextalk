import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService, type User } from '@/utils/auth'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, username: string) => Promise<void>
  logout: () => void
  checkAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await authService.login(email, password)
          authService.saveTokens(response.tokens)
          set({ user: response.user, isAuthenticated: true, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (email: string, password: string, username: string) => {
        set({ isLoading: true })
        try {
          const response = await authService.register(email, password, username)
          authService.saveTokens(response.tokens)
          set({ user: response.user, isAuthenticated: true, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        authService.clearTokens()
        set({ user: null, isAuthenticated: false })
      },

      checkAuth: () => {
        const token = authService.getAccessToken()
        set({ isAuthenticated: !!token })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated })
    }
  )
)

export type { AuthState }
