import { useEffect, useState } from 'react'
import api from '../../../api'
import { statCardTheme } from '../../../lib/dataDisplayThemes'

export default function DriverOverviewPage() {
  const [activity, setActivity] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await api.get('/api/reports/my-activity')
        if (!cancelled) setActivity(data)
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.error || 'Could not load your summary.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 dark:text-white">My overview</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Reservations, on-site status, and last parked bay.</p>
      </div>
      {error ? (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      ) : null}
      {activity && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Your reservations', value: activity.reservationsTotal, valueClass: '' },
            { label: 'Active bookings', value: activity.activeReservations, valueClass: '' },
            { label: 'On site now', value: activity.hasActiveSession ? 'Yes' : 'No', valueClass: '' },
            {
              label: 'Find my car (last visit)',
              value: activity.lastParkedSpaceNumber ?? '—',
              valueClass: 'text-lg',
              sub:
                activity.lastCheckOutUtc != null
                  ? `Exited ${new Date(activity.lastCheckOutUtc).toLocaleString()}`
                  : null,
            },
          ].map((c, i) => {
            const t = statCardTheme(i)
            return (
              <div key={c.label} className={t.card}>
                <p className={`${t.label} normal-case`}>{c.label}</p>
                <p className={[t.value, c.valueClass].filter(Boolean).join(' ')}>{c.value}</p>
                {c.sub ? <p className="mt-1 text-[10px] text-slate-600/80 dark:text-slate-500">{c.sub}</p> : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
