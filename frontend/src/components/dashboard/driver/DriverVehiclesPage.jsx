import { useEffect, useState } from 'react'
import api from '../../../api'
import { CarFront, Trash2 } from 'lucide-react'
import { contentPanel } from '../../../lib/dataDisplayThemes'

export default function DriverVehiclesPage() {
  const [vehicles, setVehicles] = useState([])
  const [newPlate, setNewPlate] = useState({ plate: '', label: '' })
  const [error, setError] = useState('')

  const loadVehicles = async () => {
    try {
      const { data } = await api.get('/api/Vehicles')
      setVehicles(data)
    } catch {
      setVehicles([])
    }
  }

  useEffect(() => {
    void loadVehicles()
  }, [])

  const addVehicle = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/api/Vehicles', { plateNumber: newPlate.plate, label: newPlate.label || null })
      setNewPlate({ plate: '', label: '' })
      await loadVehicles()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add vehicle.')
    }
  }

  const removeVehicle = async (id) => {
    if (!window.confirm('Remove this vehicle?')) return
    try {
      await api.delete(`/api/Vehicles/${id}`)
      await loadVehicles()
    } catch (err) {
      setError(err.response?.data?.error || 'Remove failed.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 dark:text-white">My vehicles</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Save plate numbers you park with.</p>
      </div>
      {error ? (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">{error}</div>
      ) : null}
      <div className={contentPanel('emerald')}>
        <div className="pointer-events-none absolute -left-4 bottom-2 h-24 w-24 rounded-full bg-teal-300/35 blur-2xl dark:bg-teal-500/10" aria-hidden />
        <div className="relative mb-4 flex items-center gap-2 text-emerald-950 dark:text-white">
          <CarFront className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="font-semibold">Registered plates</h2>
        </div>
        <form onSubmit={addVehicle} className="relative mb-4 flex flex-wrap gap-2">
          <input
            required
            placeholder="Plate"
            value={newPlate.plate}
            onChange={(e) => setNewPlate({ ...newPlate, plate: e.target.value })}
            className="min-w-[8rem] flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <input
            placeholder="Label (optional)"
            value={newPlate.label}
            onChange={(e) => setNewPlate({ ...newPlate, label: e.target.value })}
            className="min-w-[8rem] flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <button type="submit" className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500">
            Add
          </button>
        </form>
        <ul className="relative flex flex-wrap gap-2">
          {vehicles.map((v) => (
            <li
              key={v.id}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/90 px-3 py-1 text-sm text-slate-900 shadow-sm dark:border-emerald-500/20 dark:bg-slate-900/70 dark:text-white dark:shadow-none"
            >
              <span className="font-mono">{v.plateNumber}</span>
              {v.label ? <span className="text-xs text-slate-600 dark:text-slate-400">{v.label}</span> : null}
              <button type="button" onClick={() => void removeVehicle(v.id)} className="text-slate-500 hover:text-red-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
        {vehicles.length === 0 ? <p className="relative text-sm text-slate-500">No saved plates yet.</p> : null}
      </div>
    </div>
  )
}
