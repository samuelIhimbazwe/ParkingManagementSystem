import { useMemo, useState } from 'react'
import { MapPinned, Search } from 'lucide-react'
import { useSelectedParkingLot } from '../context/SelectedParkingLotContext'

export default function ParkingLotScopeBar() {
  const { lots, loading, error, selectedLotId, setSelectedLotId } = useSelectedParkingLot()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return lots
    return lots.filter(
      (l) =>
        (l.name && l.name.toLowerCase().includes(t)) ||
        (l.address && l.address.toLowerCase().includes(t)) ||
        (l.code && l.code.toLowerCase().includes(t)),
    )
  }, [lots, q])

  const selectOptions = useMemo(() => {
    if (filtered.length > 0) return filtered
    const cur = lots.find((l) => l.id === selectedLotId)
    return cur ? [cur] : []
  }, [filtered, lots, selectedLotId])

  if (loading && lots.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-sky-300/50 bg-gradient-to-r from-sky-100 via-blue-50 to-indigo-100 px-4 py-3 text-sm text-blue-900/80 shadow-md shadow-blue-900/10 dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:text-slate-400 dark:shadow-none">
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-300/35 blur-2xl dark:bg-cyan-500/10" />
        <span className="relative">Loading parking sites…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        {error}
      </div>
    )
  }

  if (lots.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-sky-300/50 bg-gradient-to-r from-sky-100 via-blue-50 to-indigo-100 px-4 py-3 text-sm text-blue-950/85 shadow-md shadow-blue-900/10 dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:text-slate-400 dark:shadow-none">
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-300/30 blur-2xl dark:bg-blue-600/10" />
        <span className="relative">
          No parking sites yet. An administrator can add locations under{' '}
          <span className="font-semibold text-blue-800 dark:text-cyan-300">Sites</span> before maps and bookings apply to a place.
        </span>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-sky-300/50 bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 p-4 shadow-md shadow-blue-900/10 dark:border-cyan-500/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:shadow-none">
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-sky-300/45 blur-3xl dark:bg-cyan-500/12" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-36 w-56 rounded-full bg-indigo-400/30 blur-3xl dark:bg-blue-600/15" />
      <div className="pointer-events-none absolute right-1/3 top-1/2 h-24 w-40 -translate-y-1/2 rounded-full bg-blue-400/20 blur-2xl dark:opacity-0" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-800 dark:text-cyan-400/90">
            <MapPinned className="h-3.5 w-3.5 text-blue-700 dark:text-cyan-400" />
            Parking site
          </p>
          <p className="text-sm text-blue-950/75 dark:text-slate-400">
            Maps, space inventory, and availability use the site you select — choose the place you are at or managing.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-80">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500/70 dark:text-slate-500" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, address, code…"
              className="w-full rounded-xl border border-white/60 bg-white/90 py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm shadow-blue-900/5 backdrop-blur-sm placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 dark:border-white/10 dark:bg-slate-950/80 dark:text-white dark:placeholder:text-slate-600 dark:shadow-none"
              aria-label="Filter parking sites"
            />
          </div>
          <select
            value={selectedLotId ?? ''}
            onChange={(e) => setSelectedLotId(Number(e.target.value))}
            className="w-full rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-sm shadow-blue-900/5 backdrop-blur-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:shadow-none"
            aria-label="Active parking site"
          >
            {selectOptions.length === 0 ? (
              <option value="">—</option>
            ) : (
              selectOptions.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                  {l.address ? ` — ${l.address}` : ''} ({l.code})
                </option>
              ))
            )}
          </select>
          {q.trim() && filtered.length === 0 ? (
            <p className="text-xs text-amber-700 dark:text-amber-400/90">No sites match that search — try another phrase or clear the box.</p>
          ) : null}
        </div>
      </div>
      {selectedLotId != null && lots.some((l) => l.id === selectedLotId) ? (
        <p className="mt-2 truncate text-xs text-blue-900/60 dark:text-slate-500">
          Active: <span className="font-medium text-blue-950 dark:text-slate-300">{lots.find((l) => l.id === selectedLotId)?.name}</span>
          {lots.find((l) => l.id === selectedLotId)?.address ? (
            <span> · {lots.find((l) => l.id === selectedLotId).address}</span>
          ) : null}
        </p>
      ) : null}
    </div>
  )
}
