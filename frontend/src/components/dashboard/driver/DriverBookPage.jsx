import { useState } from 'react'
import api from '../../../api'
import { MapPin, Ticket } from 'lucide-react'
import { contentPanel } from '../../../lib/dataDisplayThemes'
import { formatRwfPerHour } from '../../../lib/formatRwf'
import { useSelectedParkingLot } from '../../../context/SelectedParkingLotContext'

function toLocalInput(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function DriverBookPage() {
  const { selectedLotId, selectedLot } = useSelectedParkingLot()
  const [avail, setAvail] = useState([])
  const [from, setFrom] = useState(toLocalInput(new Date()))
  const [to, setTo] = useState(toLocalInput(new Date(Date.now() + 2 * 60 * 60 * 1000)))
  const [book, setBook] = useState({ parkingSpaceId: '', start: '', end: '' })
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  const searchAvail = async (e) => {
    e?.preventDefault()
    setError('')
    setMsg('')
    try {
      const fromIso = new Date(from).toISOString()
      const toIso = new Date(to).toISOString()
      const params = { from: fromIso, to: toIso }
      if (selectedLotId != null) params.parkingLotId = selectedLotId
      const { data } = await api.get('/api/Availability', { params })
      setAvail(data)
      const where = selectedLot?.name ? ` at ${selectedLot.name}` : ''
      setMsg(`${data.length} space(s) free in that window${where}.`)
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed.')
    }
  }

  const reserve = async (e) => {
    e.preventDefault()
    setError('')
    setMsg('')
    try {
      const startInput = book.start || from
      const endInput = book.end || to
      const startDate = new Date(startInput)
      const endDate = new Date(endInput)
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        setError('Please enter a valid start and end time.')
        return
      }
      await api.post('/api/Reservations', {
        parkingSpaceId: Number(book.parkingSpaceId),
        startUtc: startDate.toISOString(),
        endUtc: endDate.toISOString(),
      })
      setMsg('Reservation confirmed.')
      setBook({ parkingSpaceId: '', start: '', end: '' })
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 dark:text-white">Book a slot</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Choose the parking site in the bar above (where you are headed), then search a time window and pick a space. Confirm with the
          space ID from the list.
        </p>
      </div>
      {error ? (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">{error}</div>
      ) : null}
      {msg ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
          {msg}
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className={contentPanel('sky')}>
          <div className="pointer-events-none absolute -right-8 top-0 h-24 w-24 rounded-full bg-sky-300/30 blur-2xl dark:bg-sky-500/10" aria-hidden />
          <div className="relative mb-4 flex items-center gap-2 text-blue-950 dark:text-white">
            <MapPin className="h-5 w-5 text-sky-600 dark:text-cyan-400" />
            <h2 className="font-semibold">Find availability</h2>
          </div>
          <form onSubmit={searchAvail} className="relative space-y-3">
            <label className="block text-xs text-slate-600 dark:text-slate-400">From</label>
            <input
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <label className="block text-xs text-slate-600 dark:text-slate-400">To</label>
            <input
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <button type="submit" className="w-full rounded-xl bg-cyan-600 py-2 text-sm font-semibold text-white hover:bg-cyan-500">
              Find spaces
            </button>
          </form>
          <ul className="relative mt-4 max-h-64 space-y-2 overflow-y-auto text-sm">
            {avail.map((a) => (
              <li
                key={a.id}
                className="flex flex-col gap-0.5 rounded-lg border border-sky-200/60 bg-white/70 px-3 py-2 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-slate-950/60"
              >
                <div>
                  <span className="font-medium text-blue-950 dark:text-white">
                    #{a.id} {a.spaceNumber}
                  </span>
                  <span className="ml-2 text-slate-600 dark:text-slate-400">
                    {a.lotName ? <span className="text-slate-500">{a.lotName} · </span> : null}
                    {a.zone} · {formatRwfPerHour(a.hourlyRate)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setBook((b) => ({ ...b, parkingSpaceId: String(a.id) }))}
                  className="mt-2 rounded-lg bg-blue-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-600 sm:mt-0"
                >
                  Use this space
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className={contentPanel('emerald')}>
          <div className="pointer-events-none absolute -left-6 bottom-0 h-28 w-28 rounded-full bg-emerald-300/35 blur-2xl dark:bg-emerald-500/10" aria-hidden />
          <div className="relative mb-4 flex items-center gap-2 text-emerald-950 dark:text-white">
            <Ticket className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="font-semibold">New reservation</h2>
          </div>
          <form onSubmit={reserve} className="relative space-y-3">
            {avail.length > 0 ? (
              <select
                required
                value={book.parkingSpaceId}
                onChange={(e) => setBook({ ...book, parkingSpaceId: e.target.value })}
                className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="">Select a space from availability results</option>
                {avail.map((a) => (
                  <option key={a.id} value={String(a.id)}>
                    #{a.id} {a.spaceNumber} - {a.zone} - {formatRwfPerHour(a.hourlyRate)}
                  </option>
                ))}
              </select>
            ) : (
              <input
                required
                type="number"
                placeholder="Space ID (search availability first)"
                value={book.parkingSpaceId}
                onChange={(e) => setBook({ ...book, parkingSpaceId: e.target.value })}
                className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            )}
            <label className="text-xs text-slate-600 dark:text-slate-400">Start</label>
            <input
              type="datetime-local"
              required
              value={book.start || from}
              onChange={(e) => setBook({ ...book, start: e.target.value })}
              className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <label className="text-xs text-slate-600 dark:text-slate-400">End</label>
            <input
              type="datetime-local"
              required
              value={book.end || to}
              onChange={(e) => setBook({ ...book, end: e.target.value })}
              className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <button type="submit" className="w-full rounded-xl bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
              Book slot
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
