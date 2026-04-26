import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api'

const STORAGE_KEY = 'parkflow:activeParkingLotId'

const SelectedParkingLotContext = createContext(null)

export function SelectedParkingLotProvider({ children }) {
  const [lots, setLots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedLotId, setSelectedLotIdState] = useState(null)

  const reloadLots = useCallback(async () => {
    setError('')
    const { data } = await api.get('/api/ParkingLots')
    setLots(data)
    return data
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await reloadLots()
        if (cancelled) return
        const storedRaw = localStorage.getItem(STORAGE_KEY)
        const storedId = storedRaw ? Number(storedRaw) : NaN
        const pick =
          Number.isFinite(storedId) && data.some((l) => l.id === storedId)
            ? storedId
            : data[0]?.id ?? null
        setSelectedLotIdState(pick)
        if (pick != null) localStorage.setItem(STORAGE_KEY, String(pick))
        else localStorage.removeItem(STORAGE_KEY)
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.error || 'Could not load parking sites.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reloadLots])

  const setSelectedLotId = useCallback((id) => {
    setSelectedLotIdState(id)
    if (id == null) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, String(id))
  }, [])

  const selectedLot = useMemo(
    () => lots.find((l) => l.id === selectedLotId) ?? null,
    [lots, selectedLotId],
  )

  const value = useMemo(
    () => ({
      lots,
      loading,
      error,
      selectedLotId,
      selectedLot,
      setSelectedLotId,
      reloadLots,
    }),
    [lots, loading, error, selectedLotId, selectedLot, setSelectedLotId, reloadLots],
  )

  return <SelectedParkingLotContext.Provider value={value}>{children}</SelectedParkingLotContext.Provider>
}

export function useSelectedParkingLot() {
  const ctx = useContext(SelectedParkingLotContext)
  if (!ctx) throw new Error('useSelectedParkingLot must be used inside SelectedParkingLotProvider')
  return ctx
}
