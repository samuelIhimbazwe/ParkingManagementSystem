import { useState } from 'react'
import api from '../../../api'
import { Plus, Edit2, Building2 } from 'lucide-react'
import { dataTableShell, tableBodyRow, tableHeadRow } from '../../../lib/dataDisplayThemes'
import { formatRwfPerHour } from '../../../lib/formatRwf'
import { useSelectedParkingLot } from '../../../context/SelectedParkingLotContext'

const emptyForm = { name: '', address: '', code: '', defaultHourlyRateRwf: 1000 }

export default function AdminLocationsPage() {
  const { lots, loading, error: ctxError, reloadLots, setSelectedLotId, selectedLotId } = useSelectedParkingLot()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const openNew = () => {
    setEditingId(null)
    setForm({ ...emptyForm })
    setError('')
    setModalOpen(true)
  }

  const openEdit = (lot) => {
    setEditingId(lot.id)
    setForm({
      name: lot.name,
      address: lot.address ?? '',
      code: lot.code ?? '',
      defaultHourlyRateRwf: lot.defaultHourlyRateRwf ?? 1000,
    })
    setError('')
    setModalOpen(true)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editingId) {
        await api.put(`/api/ParkingLots/${editingId}`, {
          name: form.name.trim(),
          address: form.address.trim() || null,
          code: form.code.trim() || null,
          defaultHourlyRateRwf: Number(form.defaultHourlyRateRwf),
        })
      } else {
        const { data } = await api.post('/api/ParkingLots', {
          name: form.name.trim(),
          address: form.address.trim() || null,
          code: form.code.trim() || null,
          defaultHourlyRateRwf: Number(form.defaultHourlyRateRwf),
        })
        if (data?.id) setSelectedLotId(data.id)
      }
      await reloadLots()
      setModalOpen(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-950 dark:text-white">Parking sites</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Each site is a real-world location. Managers lay out spaces and map coordinates per site; drivers pick the site where they
            are parking before viewing the map or booking.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg"
        >
          <Plus className="h-4 w-4" /> Add site
        </button>
      </div>
      {ctxError ? (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">{ctxError}</div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">{error}</div>
      ) : null}
      {loading && lots.length === 0 ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent dark:border-cyan-500" />
        </div>
      ) : (
        <div className={dataTableShell('emerald')}>
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className={tableHeadRow('emerald')}>
                <th className="p-3">Name</th>
                <th className="p-3">Code</th>
                <th className="p-3">Default / hr</th>
                <th className="p-3">Address</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lots.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    <Building2 className="mx-auto mb-2 h-10 w-10 opacity-40" /> No sites yet — add one to represent a parking location.
                  </td>
                </tr>
              ) : (
                lots.map((l) => (
                  <tr key={l.id} className={tableBodyRow('emerald')}>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">
                      {l.name}
                      {l.id === selectedLotId ? (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300">
                          Active in toolbar
                        </span>
                      ) : null}
                    </td>
                    <td className="p-3 font-mono text-xs text-slate-600 dark:text-slate-400">{l.code}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{formatRwfPerHour(l.defaultHourlyRateRwf ?? 0)}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{l.address || '—'}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(l)}
                        className="rounded-lg p-2 text-slate-600 hover:bg-emerald-100 dark:text-slate-300 dark:hover:bg-white/10"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] overflow-y-auto overscroll-y-contain bg-black/70 p-4 py-6 backdrop-blur-sm sm:py-10"
          role="presentation"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <form
            onSubmit={(e) => void save(e)}
            className="relative mx-auto mt-2 w-full max-w-md space-y-4 rounded-2xl border border-blue-200 bg-white p-6 pb-8 shadow-xl sm:mt-8 sm:mb-10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-blue-950 dark:text-white">{editingId ? 'Edit site' : 'New parking site'}</h2>
            <div>
              <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Display name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="e.g. Riverside Mall — Deck B"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Street / area (helps drivers search)</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="City, neighborhood, or full address"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Default hourly rate (RWF)</label>
              <input
                type="number"
                min={0}
                step={1}
                required
                value={form.defaultHourlyRateRwf}
                onChange={(e) => setForm({ ...form, defaultHourlyRateRwf: Number(e.target.value) })}
                className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <p className="mt-1 text-[10px] text-slate-500">Used for new spaces and as the site default. Managers can push this rate to all spaces from Site pricing.</p>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                Site code (optional — unique, A–Z 0–9 _ -)
              </label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder={editingId ? 'Leave blank to keep current code' : 'Auto-generated if empty'}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="flex-1 rounded-lg border border-blue-200 bg-blue-50 py-2 text-sm text-slate-800 dark:border-transparent dark:bg-slate-800 dark:text-slate-200">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
