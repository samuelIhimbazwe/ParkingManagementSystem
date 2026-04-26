import { useEffect, useState } from 'react'
import api from '../../../api'
import { CalendarClock, RefreshCw } from 'lucide-react'
import { contentPanel } from '../../../lib/dataDisplayThemes'

export default function AttendantReservationsPage() {
  const [reservations, setReservations] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/api/Reservations')
      setReservations(data)
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load reservations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-950 dark:text-white">Reservations</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">All bookings for coordination with check-in.</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2 text-sm text-blue-900 hover:bg-blue-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>
      {error ? (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">{error}</div>
      ) : null}
      <div className={contentPanel('sky')}>
        <div className="pointer-events-none absolute left-1/4 top-0 h-20 w-40 -translate-x-1/2 rounded-full bg-indigo-300/25 blur-2xl dark:bg-indigo-500/10" aria-hidden />
        <div className="relative mb-4 flex items-center gap-2 text-blue-950 dark:text-white">
          <CalendarClock className="h-5 w-5 text-sky-600 dark:text-cyan-400" />
          <h2 className="font-semibold">Schedule</h2>
        </div>
        {loading ? (
          <p className="relative text-slate-500">Loading…</p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-blue-900/65 dark:text-slate-400">
                  <th className="p-2">ID</th>
                  <th className="p-2">Space</th>
                  <th className="p-2">Start</th>
                  <th className="p-2">End</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {reservations.slice(0, 80).map((r) => (
                  <tr key={r.id} className="border-t border-sky-200/70 dark:border-white/5">
                    <td className="p-2 text-slate-600 dark:text-slate-400">{r.id}</td>
                    <td className="p-2 text-slate-900 dark:text-white">{r.parkingSpace?.spaceNumber ?? r.parkingSpaceId}</td>
                    <td className="p-2 text-slate-600 dark:text-slate-400">{new Date(r.startUtc).toLocaleString()}</td>
                    <td className="p-2 text-slate-600 dark:text-slate-400">{new Date(r.endUtc).toLocaleString()}</td>
                    <td className="p-2">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
