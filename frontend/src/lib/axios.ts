import axios from 'axios'
import { authService } from '@/services/auth.service'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

// Token refresh queue for handling concurrent 401 errors
let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback)
}

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

// Request interceptor - attach token from localStorage
apiClient.interceptors.request.use((config) => {
  const token = authService.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor - handle 401 and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Preserve error message from backend response
    if (error.response?.data?.error) {
      error.message = error.response.data.error
    }

    // Skip token refresh for auth endpoints (login, register) to show proper error
    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register')

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      if (!isRefreshing) {
        isRefreshing = true
        originalRequest._retry = true

        try {
          const tokens = await authService.refreshTokens()
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`
          onTokenRefreshed(tokens.accessToken)
          return apiClient(originalRequest)
        } catch {
          authService.clearTokens()
          window.location.href = '/login'
        } finally {
          isRefreshing = false
          refreshSubscribers = []
        }
      } else {
        // Queue request until token is refreshed
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest._retry = true
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(apiClient(originalRequest))
          })
        })
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
