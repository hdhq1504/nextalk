import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { useAuthStore } from '@/stores/auth-store'

interface ProtectedRouteProps {
  children?: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      navigate('/login')
    }
  }, [navigate])

  if (!isAuthenticated && !localStorage.getItem('accessToken')) {
    return null
  }

  return children ?? <Outlet />
}

export function GuestRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      navigate('/')
    }
  }, [navigate])

  if (localStorage.getItem('accessToken')) {
    return null
  }

  return children ?? <Outlet />
}
