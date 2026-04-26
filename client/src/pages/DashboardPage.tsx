import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { extractApiError } from '../lib/httpErrors'
import type { ParkingSpace } from '../types/parking'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [spaces, setSpaces] = useState<ParkingSpace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await api.get<ParkingSpace[]>('/api/ParkingSpaces')
        if (!cancelled) setSpaces(data)
      } catch (err) {
        if (!cancelled) setError(extractApiError(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const displayName = user?.fullName?.trim() || user?.email || 'there'

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="font-display text-lg font-semibold text-slate-900">ParkFlow</p>
            <p className="text-xs text-slate-500">Parking operations</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">{displayName}</p>
              <p className="text-xs text-slate-500">{user?.roles.join(', ') || 'Member'}</p>
            </div>
            <Button variant="secondary" onClick={() => void handleLogout()}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
        <section className="space-y-2">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">
            Hello, {displayName}
          </h1>
          <p className="max-w-2xl text-sm text-slate-600">
            You&apos;re connected to the API. Below is live data from{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">/api/ParkingSpaces</code>
            .
          </p>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-200/80">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Parking spaces</h2>
              <p className="text-xs text-slate-500">Authorized with your JWT access token.</p>
            </div>
            {loading ? <Spinner /> : null}
          </div>

          {error ? (
            <div className="px-4 py-6 text-sm text-red-600 sm:px-6" role="alert">
              {error}
            </div>
          ) : null}

          {!loading && !error ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 sm:px-6">Space</th>
                    <th className="px-4 py-3 sm:px-6">Status</th>
                    <th className="px-4 py-3 sm:px-6">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-800">
                  {spaces.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-10 text-center text-sm text-slate-500 sm:px-6">
                        No spaces yet. Add records via the API to see them here.
                      </td>
                    </tr>
                  ) : (
                    spaces.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-medium sm:px-6">{s.spaceNumber}</td>
                        <td className="px-4 py-3 sm:px-6">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              s.status?.toLowerCase() === 'occupied'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 sm:px-6">{s.location}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  )
}
