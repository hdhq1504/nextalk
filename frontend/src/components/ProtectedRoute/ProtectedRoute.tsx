import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { useAuthStore } from '@/stores/auth-store'
import { authService } from '@/services/auth.service'
import { isTokenExpired } from '@/lib/token'

interface ProtectedRouteProps {
  children?: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) return

    const validateAndAuthenticate = async () => {
      const accessToken = authService.getAccessToken()
      const refreshToken = authService.getRefreshToken()

      if (!accessToken || !refreshToken) {
        navigate('/login')
        return
      }

      if (!isTokenExpired(accessToken)) {
        await checkAuth()
        return
      }

      if (!isTokenExpired(refreshToken)) {
        try {
          await authService.refreshTokens()
          await checkAuth()
        } catch {
          navigate('/login')
        }
      } else {
        authService.clearTokens()
        navigate('/login')
      }
    }

    validateAndAuthenticate()
  }, [navigate, isAuthenticated, checkAuth])

  if (!isLoading && !isAuthenticated) {
    return null
  }

  return children ?? <Outlet />
}

export function GuestRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate()

  useEffect(() => {
    const token = authService.getAccessToken()
    if (token && !isTokenExpired(token)) {
      navigate('/')
    }
  }, [navigate])

  const token = authService.getAccessToken()
  if (token && !isTokenExpired(token)) {
    return null
  }

  return children ?? <Outlet />
}
