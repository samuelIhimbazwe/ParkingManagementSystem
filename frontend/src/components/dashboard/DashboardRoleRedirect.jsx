import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function DashboardRoleRedirect() {
  const { profile } = useAuth()
  const roles = profile?.roles ?? []
  if (roles.includes('Admin')) return <Navigate to="/dashboard/admin/overview" replace />
  if (roles.includes('Attendant') || roles.includes('ParkingManager'))
    return <Navigate to="/dashboard/attendant/overview" replace />
  if (roles.includes('Driver') || roles.includes('User')) return <Navigate to="/dashboard/driver/overview" replace />
  return <Navigate to="/login" replace />
}
