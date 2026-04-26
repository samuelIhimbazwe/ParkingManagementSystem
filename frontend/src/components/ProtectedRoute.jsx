import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent dark:border-cyan-500" />
      </div>
    )
  }

  if (!profile) {
    return <Navigate to="/login" replace state={{ from: 'protected' }} />
  }

  return <Outlet />
}
