import { useCallback, useEffect, useState } from 'react'
import api from '../../../api'
import { Plus, Trash2, Edit2, CarFront } from 'lucide-react'
import { dataTableShell, tableBodyRow, tableHeadRow } from '../../../lib/dataDisplayThemes'
import { useSelectedParkingLot } from '../../../context/SelectedParkingLotContext'
import { formatRwfPerHour } from '../../../lib/formatRwf'

const emptyForm = {
  spaceNumber: '',
  location: '',
  status: 'Available',
  zone: 'General',
  hourlyRate: 1000,
  maxStayMinutes: '',
  parkingLotId: '',
  slotCategory: 'Standard',
  mapRow: '',
  mapColumn: '',
  isUnderMaintenance: false,
  managerEmail: '',
  managerFullName: '',
  managerPassword: '',
}

export default function AdminSpacesPage() {
  const { selectedLotId, lots, selectedLot } = useSelectedParkingLot()
  const siteDefaultRate = selectedLot?.defaultHourlyRateRwf ?? 1000
  const [spaces, setSpaces] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [createdManagerCreds, setCreatedManagerCreds] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = selectedLotId != null ? { parkingLotId: selectedLotId } : {}
      const { data } = await api.get('/api/ParkingSpaces', { params })
      setSpaces(data)
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load spaces.')
    } finally {
      setLoading(false)
    }
  }, [selectedLotId])

  useEffect(() => {
    void load()
  }, [load])

  const openNew = () => {
    setEditingId(null)
    setFormData({
      ...emptyForm,
      hourlyRate: siteDefaultRate,
      parkingLotId: selectedLotId != null ? String(selectedLotId) : '',
    })
    setModalOpen(true)
  }

  const openEdit = (s) => {
    const lotForSpace = lots.find((l) => l.id === s.parkingLotId)
    setEditingId(s.id)
    setFormData({
      spaceNumber: s.spaceNumber,
      location: s.location || '',
      status: s.status,
      zone: s.zone || 'General',
      hourlyRate: s.hourlyRate ?? lotForSpace?.defaultHourlyRateRwf ?? 1000,
      maxStayMinutes: s.maxStayMinutes ?? '',
      parkingLotId: s.parkingLotId != null ? String(s.parkingLotId) : '',
      slotCategory: s.slotCategory || 'Standard',
      mapRow: s.mapRow ?? '',
      mapColumn: s.mapColumn ?? '',
      isUnderMaintenance: !!s.isUnderMaintenance,
    })
    setModalOpen(true)
  }

  const saveSpace = async (e) => {
    e.preventDefault()
    const lotId = Number(formData.parkingLotId) || selectedLotId || lots[0]?.id
    if (!lotId) {
      setError('Add a parking site under Sites before creating spaces.')
      return
    }
    if (!editingId && formData.managerEmail.trim() && !formData.managerPassword) {
      setError('Enter an initial password for the manager account.')
      return
    }
    const body = {
      id: editingId ?? 0,
      spaceNumber: formData.spaceNumber,
      location: formData.location,
      status: formData.status,
      zone: formData.zone,
      hourlyRate: Number(formData.hourlyRate),
      maxStayMinutes: formData.maxStayMinutes === '' ? null : Number(formData.maxStayMinutes),
      parkingLotId: lotId,
      slotCategory: formData.slotCategory,
      mapRow: formData.mapRow === '' ? null : Number(formData.mapRow),
      mapColumn: formData.mapColumn === '' ? null : Number(formData.mapColumn),
      isUnderMaintenance: formData.isUnderMaintenance,
    }
    try {
      if (editingId) await api.put(`/api/ParkingSpaces/${editingId}`, { ...body, id: editingId })
      else {
        const { id: _i, ...create } = body
        const payload = {
          ...create,
          managerAccount: formData.managerEmail.trim()
            ? {
                email: formData.managerEmail.trim(),
                password: formData.managerPassword,
                fullName: formData.managerFullName.trim() || null,
              }
            : null,
        }
        const { data } = await api.post('/api/ParkingSpaces', payload)
        if (data?.managerCredentials?.email) setCreatedManagerCreds(data.managerCredentials)
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed.')
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this space?')) return
    try {
      await api.delete(`/api/ParkingSpaces/${id}`)
      await load()
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-950 dark:text-white">Parking spaces</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Slots for the site selected in the bar above — map row/column define the deck layout for that location. Switch sites to manage
            another place.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg"
        >
          <Plus className="h-4 w-4" /> Add space
        </button>
      </div>
      {error ? (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      ) : null}
      {createdManagerCreds ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
          Manager account assigned: <span className="font-semibold">{createdManagerCreds.email}</span>
          {createdManagerCreds.initialPassword ? (
            <span className="block text-xs">Initial password: {createdManagerCreds.initialPassword}</span>
          ) : (
            <span className="block text-xs">Existing manager account linked to this space.</span>
          )}
        </div>
      ) : null}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent dark:border-cyan-500" />
        </div>
      ) : (
        <div className={dataTableShell('rose')}>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className={tableHeadRow('rose')}>
                <th className="p-3">Space</th>
                <th className="p-3">Type</th>
                <th className="p-3">Zone</th>
                <th className="p-3">RWF / hr</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {spaces.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <CarFront className="mx-auto mb-2 h-10 w-10 opacity-40" /> No spaces yet.
                  </td>
                </tr>
              ) : (
                spaces.map((s) => (
                  <tr key={s.id} className={tableBodyRow('rose')}>
                    <td className="p-3 font-medium text-slate-900 dark:text-white">{s.spaceNumber}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{s.slotCategory || 'Standard'}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{s.zone}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{formatRwfPerHour(s.hourlyRate)}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          s.isUnderMaintenance
                            ? 'bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300'
                            : s.status === 'Available'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300'
                        }`}
                      >
                        {s.isUnderMaintenance ? 'Maintenance' : s.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(s)}
                        className="mr-2 rounded-lg p-2 text-slate-600 hover:bg-rose-100 dark:text-slate-300 dark:hover:bg-white/10"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => void remove(s.id)} className="rounded-lg p-2 hover:bg-red-500/20">
                        <Trash2 className="h-4 w-4 text-red-400" />
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
            onSubmit={saveSpace}
            className="relative mx-auto mt-2 w-full max-w-md space-y-4 rounded-2xl border border-blue-200 bg-white p-6 pb-8 shadow-xl sm:mt-8 sm:mb-10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-blue-950 dark:text-white">{editingId ? 'Edit space' : 'New space'}</h2>
            <Field label="Space number" value={formData.spaceNumber} onChange={(v) => setFormData({ ...formData, spaceNumber: v })} required />
            <Field label="Location" value={formData.location} onChange={(v) => setFormData({ ...formData, location: v })} />
            <Field label="Zone" value={formData.zone} onChange={(v) => setFormData({ ...formData, zone: v })} />
            <Field
              label="Hourly rate (RWF)"
              type="number"
              step="0.01"
              value={formData.hourlyRate}
              onChange={(v) => setFormData({ ...formData, hourlyRate: v })}
            />
            <Field
              label="Max stay (minutes, optional)"
              type="number"
              value={formData.maxStayMinutes}
              onChange={(v) => setFormData({ ...formData, maxStayMinutes: v })}
            />
            <div>
              <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Parking site</label>
              <select
                required
                value={formData.parkingLotId}
                onChange={(e) => setFormData({ ...formData, parkingLotId: e.target.value })}
                className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {lots.length === 0 ? (
                  <option value="">No sites — add under Sites</option>
                ) : (
                  lots.map((l) => (
                    <option key={l.id} value={String(l.id)}>
                      {l.name}
                      {l.address ? ` (${l.address})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Slot category</label>
              <select
                value={formData.slotCategory}
                onChange={(e) => setFormData({ ...formData, slotCategory: e.target.value })}
                className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="Standard">Standard</option>
                <option value="Vip">VIP / reserved</option>
                <option value="Disabled">Disabled parking</option>
                <option value="EvCharging">EV charging (availability)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Map row" type="number" value={formData.mapRow} onChange={(v) => setFormData({ ...formData, mapRow: v })} />
              <Field label="Map column" type="number" value={formData.mapColumn} onChange={(v) => setFormData({ ...formData, mapColumn: v })} />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={formData.isUnderMaintenance}
                onChange={(e) => setFormData({ ...formData, isUnderMaintenance: e.target.checked })}
                className="rounded border-slate-600"
              />
              Under maintenance (blocked)
            </label>
            {!editingId ? (
              <div className="space-y-2 rounded-lg border border-emerald-200/70 bg-emerald-50/60 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900 dark:text-emerald-300">Optional manager account for this space</p>
                <Field label="Manager email" type="email" value={formData.managerEmail} onChange={(v) => setFormData({ ...formData, managerEmail: v })} />
                <Field label="Manager full name" value={formData.managerFullName} onChange={(v) => setFormData({ ...formData, managerFullName: v })} />
                <Field label="Manager initial password" type="password" value={formData.managerPassword} onChange={(v) => setFormData({ ...formData, managerPassword: v })} />
                <p className="text-[10px] text-slate-500">If email is provided, password is required and this account gets ParkingManager role.</p>
              </div>
            ) : null}
            <div>
              <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="flex-1 rounded-lg border border-blue-200 bg-blue-50 py-2 text-sm text-slate-800 dark:border-transparent dark:bg-slate-800 dark:text-slate-200">
                Cancel
              </button>
              <button type="submit" className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-2 text-sm font-medium text-white">
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required, step }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">{label}</label>
      <input
        type={type}
        step={step}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />
    </div>
  )
}
