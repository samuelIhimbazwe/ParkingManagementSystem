import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FullPageSpinner } from '../feedback/FullPageSpinner'

export function PublicRoute() {
  const { user, bootstrapped } = useAuth()

  if (!bootstrapped) {
    return <FullPageSpinner />
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
