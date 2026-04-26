import ParkingMap from '../../ParkingMap'
import { useSelectedParkingLot } from '../../../context/SelectedParkingLotContext'

export default function DriverLiveMapPage() {
  const { selectedLotId, selectedLot } = useSelectedParkingLot()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 dark:text-white">Live map</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Availability at <span className="font-medium text-blue-800 dark:text-slate-200">{selectedLot?.name ?? 'your chosen site'}</span>. Pick the place where you want to
          park using the site selector above, then read the map for that location.
        </p>
      </div>
      <ParkingMap title="Live availability" parkingLotId={selectedLotId ?? undefined} pollMs={12000} />
    </div>
  )
}
