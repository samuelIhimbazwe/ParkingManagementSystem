import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FullPageSpinner } from '../feedback/FullPageSpinner'

export function ProtectedRoute() {
  const { user, bootstrapped } = useAuth()

  if (!bootstrapped) {
    return <FullPageSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: 'protected' }} />
  }

  return <Outlet />
}
