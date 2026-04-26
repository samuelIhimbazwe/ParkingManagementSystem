import { useEffect, useState } from 'react'
import api from '../../../api'
import { TrendingUp } from 'lucide-react'
import { contentPanel, statCardTheme } from '../../../lib/dataDisplayThemes'
import { formatRwf } from '../../../lib/formatRwf'

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState(null)
  const [revenue, setRevenue] = useState([])
  const [zones, setZones] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setError('')
      try {
        const [ov, rev, z] = await Promise.all([
          api.get('/api/reports/overview'),
          api.get('/api/reports/revenue-series?days=14'),
          api.get('/api/reports/occupancy-by-zone'),
        ])
        if (!cancelled) {
          setOverview(ov.data)
          setRevenue(rev.data)
          setZones(z.data)
        }
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.error || 'Failed to load overview.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const maxRev = Math.max(...revenue.map((r) => r.revenue), 1)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 dark:text-white">Overview</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">KPIs, revenue trend, and occupancy by zone.</p>
      </div>
      {error ? (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      ) : null}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent dark:border-cyan-500" />
        </div>
      ) : (
        <>
          {overview && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Total spaces', overview.totalSpaces],
                ['Available', overview.availableSpaces],
                ['Occupied', overview.occupiedSpaces],
                ['Est. revenue today (RWF)', formatRwf(overview.estimatedRevenueToday)],
              ].map(([label, val], i) => {
                const t = statCardTheme(i)
                return (
                  <div key={label} className={t.card}>
                    <p className={t.label}>{label}</p>
                    <p className={t.value}>{val}</p>
                  </div>
                )
              })}
            </div>
          )}
          <div className="grid gap-8 lg:grid-cols-2">
            <div className={contentPanel('emerald')}>
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-300/35 blur-2xl dark:bg-emerald-500/10" aria-hidden />
              <div className="relative mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="font-semibold text-emerald-950 dark:text-white">Revenue (14 days)</h2>
              </div>
              <div className="relative flex h-40 items-end gap-1">
                {revenue.map((p) => (
                  <div key={p.day} className="group flex flex-1 flex-col items-center">
                    <div
                      className="w-full max-w-[14px] rounded-t bg-gradient-to-t from-emerald-700 to-teal-400 transition group-hover:from-emerald-600 group-hover:to-lime-300"
                      style={{ height: `${(p.revenue / maxRev) * 100}%`, minHeight: p.revenue > 0 ? 8 : 0 }}
                      title={`${p.day}: ${formatRwf(p.revenue)}`}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className={contentPanel('rose')}>
              <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-40 rounded-full bg-rose-300/30 blur-2xl dark:bg-rose-500/10" aria-hidden />
              <h2 className="relative mb-4 font-semibold text-rose-950 dark:text-white">Occupancy by zone</h2>
              <ul className="relative space-y-3">
                {zones.map((z) => (
                  <li key={z.zone} className="flex justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-300">{z.zone}</span>
                    <span className="font-medium text-rose-700 dark:text-rose-300">
                      {z.occupiedSpaces} / {z.totalSpaces} occupied
                    </span>
                  </li>
                ))}
                {zones.length === 0 ? <li className="text-slate-500">No data</li> : null}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
