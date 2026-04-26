import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function RequireRole({ anyOf, children }) {
  const { profile } = useAuth()
  const roles = profile?.roles ?? []
  const allowed = anyOf.some((r) => roles.includes(r))
  if (!allowed) return <Navigate to="/dashboard" replace />
  return children
}
