import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AuthShell } from './components/layout/AuthShell'
import { PublicRoute } from './components/auth/PublicRoute'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { FullPageSpinner } from './components/feedback/FullPageSpinner'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { DashboardPage } from './pages/DashboardPage'

function HomeRedirect() {
  const { user, bootstrapped } = useAuth()
  if (!bootstrapped) {
    return <FullPageSpinner />
  }
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route element={<AuthShell />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
