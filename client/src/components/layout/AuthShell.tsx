import { Link, Outlet } from 'react-router-dom'

export function AuthShell() {
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[1fr_1.05fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-sky-500 lg:block">
        <div className="absolute inset-0 opacity-30 mix-blend-overlay">
          <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-sky-200 blur-3xl" />
        </div>
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link to="/" className="font-display text-xl font-semibold tracking-tight">
            ParkFlow
          </Link>
          <div className="space-y-6">
            <p className="font-display text-4xl font-semibold leading-tight">
              Smart parking operations, simplified.
            </p>
            <p className="max-w-md text-base text-white/85">
              Monitor occupancy, manage spaces, and keep your team aligned with a dashboard built for
              clarity and speed.
            </p>
          </div>
          <p className="text-sm text-white/70">© {new Date().getFullYear()} ParkFlow</p>
        </div>
      </aside>

      <main className="flex flex-col justify-center px-4 py-12 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10 flex items-center justify-between lg:hidden">
            <Link to="/" className="font-display text-lg font-semibold text-slate-900">
              ParkFlow
            </Link>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
