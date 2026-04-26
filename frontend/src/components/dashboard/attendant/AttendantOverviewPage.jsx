import { useEffect, useState } from 'react'
import api from '../../../api'
import { RefreshCw } from 'lucide-react'
import { statCardTheme } from '../../../lib/dataDisplayThemes'
import { formatRwf } from '../../../lib/formatRwf'

export default function AttendantOverviewPage() {
  const [overview, setOverview] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/api/reports/overview')
      setOverview(data)
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load KPIs.')
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
          <h1 className="text-2xl font-bold text-blue-950 dark:text-white">Operations overview</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Live counts for the deck you are running.</p>
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
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent dark:border-cyan-500" />
        </div>
      ) : (
        overview && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Active sessions', overview.activeSessions],
              ['Available spaces', overview.availableSpaces],
              ['Upcoming reservations', overview.reservationsUpcoming],
              ['Est. revenue today (RWF)', formatRwf(overview.estimatedRevenueToday)],
            ].map(([k, v], i) => {
              const t = statCardTheme(i)
              return (
                <div key={k} className={t.card}>
                  <p className={`${t.label} normal-case`}>{k}</p>
                  <p className={`${t.value} text-xl sm:text-2xl`}>{v}</p>
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
