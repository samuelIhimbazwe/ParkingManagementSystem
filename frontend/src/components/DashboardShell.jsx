import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, LayoutDashboard, Menu, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import ParkingLotScopeBar from './ParkingLotScopeBar'
import ThemeToggle from './ThemeToggle'

function roleLabel(roles) {
  if (roles?.includes('Admin')) return 'Administrator'
  if (roles?.includes('ParkingManager')) return 'Parking manager'
  if (roles?.includes('Attendant')) return 'Attendant'
  if (roles?.includes('Driver') || roles?.includes('User')) return 'Driver'
  return 'Guest'
}

function navForRoles(roles) {
  if (roles.includes('Admin')) {
    return {
      base: '/dashboard/admin',
      items: [
        { path: 'overview', label: 'Overview', hint: 'KPIs & revenue' },
        { path: 'locations', label: 'Sites', hint: 'Places you operate' },
        { path: 'map', label: 'Live map', hint: 'Occupancy' },
        { path: 'spaces', label: 'Spaces', hint: 'Inventory' },
        { path: 'users', label: 'Users', hint: 'Accounts' },
      ],
    }
  }
  if (roles.includes('Attendant') || roles.includes('ParkingManager')) {
    const items = [
      { path: 'overview', label: 'Overview', hint: 'KPIs' },
      { path: 'map', label: 'Live map', hint: 'Deck' },
      { path: 'operations', label: 'Entry & exit', hint: 'Tickets' },
      { path: 'reservations', label: 'Reservations', hint: 'Schedule' },
    ]
    if (roles.includes('ParkingManager')) {
      items.push({ path: 'site-pricing', label: 'Site pricing', hint: 'RWF / hr' })
    }
    return {
      base: '/dashboard/attendant',
      items,
    }
  }
  return {
    base: '/dashboard/driver',
    items: [
      { path: 'overview', label: 'Overview', hint: 'My status' },
      { path: 'map', label: 'Live map', hint: 'Availability' },
      { path: 'vehicles', label: 'Vehicles', hint: 'Plates' },
      { path: 'book', label: 'Book', hint: 'Reserve' },
      { path: 'reservations', label: 'Reservations', hint: 'My bookings' },
    ],
  }
}

export default function DashboardShell() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const roles = profile?.roles ?? []
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const { base, items } = useMemo(() => navForRoles(roles), [roles])

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  const linkClass = ({ isActive }) =>
    [
      'block rounded-xl px-3 py-2.5 text-sm transition',
      isActive
        ? 'bg-white/25 text-white shadow-md ring-1 ring-white/40 dark:bg-cyan-500/15 dark:text-cyan-200 dark:shadow-none dark:ring-cyan-500/30'
        : 'text-blue-100 hover:bg-white/15 hover:text-white dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white',
    ].join(' ')

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col gap-6">
      <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-sky-300/50 bg-gradient-to-r from-blue-900 via-blue-600 to-sky-500 p-4 shadow-lg shadow-blue-900/25 dark:border-white/10 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:shadow-md sm:flex-row sm:items-center sm:justify-between">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-400/25 blur-2xl dark:bg-cyan-500/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 left-1/3 h-40 w-64 rounded-full bg-indigo-500/20 blur-2xl dark:bg-blue-600/10"
          aria-hidden
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/35 backdrop-blur-sm dark:bg-gradient-to-tr dark:from-cyan-500 dark:to-blue-600 dark:ring-0">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-blue-100/90 dark:text-slate-500">Signed in as</p>
            <p className="font-semibold text-white dark:text-white">{profile?.fullName || profile?.email}</p>
            <p className="text-xs text-sky-100 dark:text-cyan-400/90">{roleLabel(roles)}</p>
          </div>
        </div>
        <div className="relative flex flex-wrap items-center gap-2">
          <ThemeToggle variant="onBlue" />
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white backdrop-blur-sm hover:bg-white/20 lg:hidden dark:border-white/15 dark:bg-transparent dark:hover:bg-white/5"
            onClick={() => setMobileNavOpen((o) => !o)}
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            Menu
          </button>
          <Link
            to="/"
            className="rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white backdrop-blur-sm hover:bg-white/20 dark:border-white/10 dark:hover:bg-white/5"
          >
            Home
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-50 dark:bg-slate-700 dark:font-medium dark:text-white dark:shadow-none dark:hover:bg-slate-600"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>

      <ParkingLotScopeBar />

      <div className="flex flex-1 flex-col gap-6 lg:flex-row lg:items-start">
        <aside
          className={[
            'relative shrink-0 overflow-hidden rounded-2xl border border-blue-400/35 bg-gradient-to-b from-blue-950 via-blue-800 to-indigo-950 p-3 shadow-lg shadow-blue-950/30 dark:border-white/10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:shadow-md lg:w-56',
            mobileNavOpen ? 'block' : 'hidden lg:block',
          ].join(' ')}
        >
          <div
            className="pointer-events-none absolute -right-8 top-0 h-32 w-32 rounded-full bg-sky-400/20 blur-2xl dark:bg-cyan-500/5"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-indigo-950/80 to-transparent dark:from-slate-950/80"
            aria-hidden
          />
          <p className="relative mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-blue-200/85 dark:text-slate-500">
            Navigate
          </p>
          <nav className="relative space-y-1" onClick={() => setMobileNavOpen(false)}>
            {items.map((item) => (
              <NavLink key={item.path} to={`${base}/${item.path}`} end={item.path === 'overview'} className={linkClass}>
                <span className="font-medium">{item.label}</span>
                <span className="mt-0.5 block text-[10px] font-normal text-blue-200/70 dark:text-slate-500">{item.hint}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 rounded-2xl border border-blue-100/80 bg-gradient-to-br from-white via-sky-50/40 to-emerald-50/35 p-5 shadow-sm dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:shadow-md md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
