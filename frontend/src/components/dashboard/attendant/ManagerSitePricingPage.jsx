import { useState } from 'react'
import api from '../../../api'
import { useSelectedParkingLot } from '../../../context/SelectedParkingLotContext'
import { formatRwfPerHour } from '../../../lib/formatRwf'

export default function ManagerSitePricingPage() {
  const { selectedLotId, selectedLot, reloadLots } = useSelectedParkingLot()
  const [rate, setRate] = useState('')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const current = selectedLot?.defaultHourlyRateRwf

  const apply = async (e) => {
    e.preventDefault()
    if (selectedLotId == null) {
      setError('Select a parking site in the bar above first.')
      return
    }
    const n = Number(rate)
    if (Number.isNaN(n) || n < 0) {
      setError('Enter a valid hourly rate (RWF).')
      return
    }
    setSaving(true)
    setError('')
    setMsg('')
    try {
      await api.patch(`/api/ParkingLots/${selectedLotId}/default-hourly-rate-rwf`, {
        defaultHourlyRateRwf: n,
      })
      setMsg(`Updated site default to ${formatRwfPerHour(n)} for all spaces at this site.`)
      setRate('')
      await reloadLots()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update pricing.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 dark:text-white">Site pricing</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Set the default hourly parking fee (Rwandan francs) for the site selected in the toolbar. This updates every space at that site to
          the same rate.
        </p>
      </div>
      {error ? (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      ) : null}
      {msg ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
          {msg}
        </div>
      ) : null}
      <div className="rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50/90 to-white p-6 shadow-sm dark:border-white/10 dark:from-slate-900 dark:to-slate-950 dark:shadow-none">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Active site:{' '}
          <span className="font-semibold text-blue-950 dark:text-white">{selectedLot?.name ?? '—'}</span>
        </p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Current default:{' '}
          <span className="font-medium text-emerald-800 dark:text-emerald-300">
            {current != null ? formatRwfPerHour(current) : '—'}
          </span>
        </p>
        <form onSubmit={(e) => void apply(e)} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">New default hourly rate (RWF)</label>
            <input
              type="number"
              min={0}
              step={1}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder={current != null ? String(Math.round(Number(current))) : 'e.g. 1500'}
              className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={saving || selectedLotId == null}
            className="rounded-xl bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Apply to all spaces'}
          </button>
        </form>
      </div>
    </div>
  )
}
