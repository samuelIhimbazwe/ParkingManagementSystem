import { useCallback, useEffect, useState } from 'react'
import api from '../api'
import { mapSurface } from '../lib/dataDisplayThemes'
import { startParkingHub } from '../parkingHub'
import { MapPin } from 'lucide-react'

const stateStyles = {
  Available: 'bg-emerald-500/85 text-white ring-1 ring-emerald-400/50',
  Occupied: 'bg-rose-600/90 text-white ring-1 ring-rose-400/50',
  Reserved: 'bg-amber-500/90 text-slate-900 ring-1 ring-amber-300/60',
  Maintenance: 'bg-slate-600/90 text-slate-200 ring-1 ring-slate-400/40',
}

export default function ParkingMap({ title = 'Live parking map', parkingLotId, pollMs = 8000 }) {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    try {
      const params = parkingLotId ? { parkingLotId } : {}
      const { data: d } = await api.get('/api/Availability/live', { params })
      setData(d)
      setErr('')
    } catch (e) {
      setErr(e.response?.data?.error || 'Could not load live map.')
    }
  }, [parkingLotId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const stop = startParkingHub(() => {
      void load()
    })
    const t = setInterval(() => void load(), pollMs)
    return () => {
      clearInterval(t)
      void stop()
    }
  }, [load, pollMs])

  if (err) {
    return (
      <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
        {err}
      </div>
    )
  }

  if (!data?.spaces?.length) {
    return (
      <div className={`${mapSurface} text-center text-slate-600 dark:text-slate-400`}>
        <MapPin className="mx-auto mb-2 h-8 w-8 opacity-40" />
        No spaces in this lot yet.
      </div>
    )
  }

  const withPos = data.spaces.filter((s) => s.mapRow != null && s.mapColumn != null)
  let grid = []
  if (withPos.length) {
    const maxRow = Math.max(...withPos.map((s) => s.mapRow), 0)
    const maxCol = Math.max(...withPos.map((s) => s.mapColumn), 0)
    for (let r = 0; r <= maxRow; r++) {
      const row = []
      for (let c = 0; c <= maxCol; c++) {
        row.push(withPos.find((s) => s.mapRow === r && s.mapColumn === c) || null)
      }
      grid.push(row)
    }
  } else {
    const cols = 6
    const ordered = [...data.spaces]
    for (let i = 0; i < ordered.length; i += cols) {
      const chunk = ordered.slice(i, i + cols)
      while (chunk.length < cols) chunk.push(null)
      grid.push(chunk)
    }
  }

  const colCount = grid.reduce((m, row) => Math.max(m, row.length), 1)

  return (
    <div className={mapSurface}>
      <div className="pointer-events-none absolute right-0 top-0 h-36 w-36 rounded-full bg-sky-300/25 blur-3xl dark:bg-sky-500/10" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-40 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-500/10" aria-hidden />
      <div className="relative mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-blue-950 dark:text-white">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            {data.lotName} · free {data.availableCount} · on-site {data.occupiedCount} · reserved now {data.reservedCount}{' '}
            · maintenance {data.maintenanceCount}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Available
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-rose-600" /> Occupied
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> Reserved
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-600" /> Maintenance
          </span>
        </div>
      </div>

      <div className="relative overflow-x-auto pb-2">
        <div className="flex flex-col gap-1.5 p-2">
          {grid.map((row, ri) => (
            <div
              key={ri}
              className="grid gap-1.5"
              style={{ gridTemplateColumns: `repeat(${colCount}, minmax(3.5rem, 1fr))` }}
            >
              {row.map((cell, ci) => {
                if (!cell) {
                  return (
                    <div
                      key={`e-${ri}-${ci}`}
                      className="flex h-14 min-w-[3.5rem] items-center justify-center rounded-lg border border-dashed border-blue-200 bg-blue-50/50 text-[10px] text-slate-500 dark:border-white/5 dark:bg-slate-900/30 dark:text-slate-600"
                    >
                      —
                    </div>
                  )
                }
                const cls = stateStyles[cell.displayState] || 'bg-slate-700 text-white'
                return (
                  <div
                    key={cell.id}
                    title={`${cell.spaceNumber} · ${cell.slotCategory} · ${cell.displayState}`}
                    className={`flex h-14 min-w-[3.5rem] flex-col items-center justify-center rounded-lg text-[10px] font-semibold shadow-inner ${cls}`}
                  >
                    <span className="leading-none">{cell.spaceNumber}</span>
                    <span className="mt-0.5 text-[8px] font-normal opacity-80">{cell.slotCategory}</span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
