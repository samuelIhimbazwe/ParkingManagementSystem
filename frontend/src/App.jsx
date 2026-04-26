import { Routes, Route, Navigate, Link } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import Login from './components/Login'
import Register from './components/Register'
import GuestOnly from './components/GuestOnly'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardShell from './components/DashboardShell'
import { SelectedParkingLotProvider } from './context/SelectedParkingLotContext'
import DashboardRoleRedirect from './components/dashboard/DashboardRoleRedirect'
import RequireRole from './components/dashboard/RequireRole'
import AdminOverviewPage from './components/dashboard/admin/AdminOverviewPage'
import AdminLiveMapPage from './components/dashboard/admin/AdminLiveMapPage'
import AdminUsersPage from './components/dashboard/admin/AdminUsersPage'
import AdminSpacesPage from './components/dashboard/admin/AdminSpacesPage'
import AdminLocationsPage from './components/dashboard/admin/AdminLocationsPage'
import AttendantOverviewPage from './components/dashboard/attendant/AttendantOverviewPage'
import AttendantLiveMapPage from './components/dashboard/attendant/AttendantLiveMapPage'
import AttendantOperationsPage from './components/dashboard/attendant/AttendantOperationsPage'
import AttendantReservationsPage from './components/dashboard/attendant/AttendantReservationsPage'
import ManagerSitePricingPage from './components/dashboard/attendant/ManagerSitePricingPage'
import DriverOverviewPage from './components/dashboard/driver/DriverOverviewPage'
import DriverLiveMapPage from './components/dashboard/driver/DriverLiveMapPage'
import DriverVehiclesPage from './components/dashboard/driver/DriverVehiclesPage'
import DriverBookPage from './components/dashboard/driver/DriverBookPage'
import DriverReservationsPage from './components/dashboard/driver/DriverReservationsPage'
import ThemeToggle from './components/ThemeToggle'

function PublicHeader() {
  return (
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-blue-200/80 pb-6 dark:border-white/10">
      <Link to="/" className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-blue-800 text-lg font-bold text-white shadow-lg shadow-blue-600/25 dark:from-cyan-500 dark:to-blue-600 dark:shadow-cyan-500/25">
          P
        </div>
        <span className="text-lg font-semibold tracking-tight text-blue-950 dark:text-white">ParkFlow</span>
      </Link>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <nav className="flex gap-2 text-sm">
          <Link
            to="/login"
            className="rounded-lg px-3 py-2 text-blue-800 hover:bg-blue-100 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-blue-600 px-3 py-2 font-medium text-white shadow-sm hover:bg-blue-700 dark:bg-white/10 dark:hover:bg-white/15"
          >
            Register
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100">
      <Routes>
        <Route
          path="/"
          element={
            <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
              <PublicHeader />
              <LandingPage />
            </div>
          }
        />
        <Route
          path="/login"
          element={
            <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
              <PublicHeader />
              <GuestOnly>
                <Login />
              </GuestOnly>
            </div>
          }
        />
        <Route
          path="/register"
          element={
            <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
              <PublicHeader />
              <GuestOnly>
                <Register />
              </GuestOnly>
            </div>
          }
        />

        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={
              <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8">
                <SelectedParkingLotProvider>
                  <DashboardShell />
                </SelectedParkingLotProvider>
              </div>
            }
          >
            <Route index element={<DashboardRoleRedirect />} />

            <Route
              path="admin/overview"
              element={
                <RequireRole anyOf={['Admin']}>
                  <AdminOverviewPage />
                </RequireRole>
              }
            />
            <Route
              path="admin/locations"
              element={
                <RequireRole anyOf={['Admin']}>
                  <AdminLocationsPage />
                </RequireRole>
              }
            />
            <Route
              path="admin/map"
              element={
                <RequireRole anyOf={['Admin']}>
                  <AdminLiveMapPage />
                </RequireRole>
              }
            />
            <Route
              path="admin/users"
              element={
                <RequireRole anyOf={['Admin']}>
                  <AdminUsersPage />
                </RequireRole>
              }
            />
            <Route
              path="admin/spaces"
              element={
                <RequireRole anyOf={['Admin']}>
                  <AdminSpacesPage />
                </RequireRole>
              }
            />

            <Route
              path="attendant/overview"
              element={
                <RequireRole anyOf={['Attendant', 'ParkingManager']}>
                  <AttendantOverviewPage />
                </RequireRole>
              }
            />
            <Route
              path="attendant/map"
              element={
                <RequireRole anyOf={['Attendant', 'ParkingManager']}>
                  <AttendantLiveMapPage />
                </RequireRole>
              }
            />
            <Route
              path="attendant/operations"
              element={
                <RequireRole anyOf={['Attendant', 'ParkingManager']}>
                  <AttendantOperationsPage />
                </RequireRole>
              }
            />
            <Route
              path="attendant/reservations"
              element={
                <RequireRole anyOf={['Attendant', 'ParkingManager']}>
                  <AttendantReservationsPage />
                </RequireRole>
              }
            />
            <Route
              path="attendant/site-pricing"
              element={
                <RequireRole anyOf={['ParkingManager']}>
                  <ManagerSitePricingPage />
                </RequireRole>
              }
            />

            <Route
              path="driver/overview"
              element={
                <RequireRole anyOf={['Driver', 'User']}>
                  <DriverOverviewPage />
                </RequireRole>
              }
            />
            <Route
              path="driver/map"
              element={
                <RequireRole anyOf={['Driver', 'User']}>
                  <DriverLiveMapPage />
                </RequireRole>
              }
            />
            <Route
              path="driver/vehicles"
              element={
                <RequireRole anyOf={['Driver', 'User']}>
                  <DriverVehiclesPage />
                </RequireRole>
              }
            />
            <Route
              path="driver/book"
              element={
                <RequireRole anyOf={['Driver', 'User']}>
                  <DriverBookPage />
                </RequireRole>
              }
            />
            <Route
              path="driver/reservations"
              element={
                <RequireRole anyOf={['Driver', 'User']}>
                  <DriverReservationsPage />
                </RequireRole>
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
