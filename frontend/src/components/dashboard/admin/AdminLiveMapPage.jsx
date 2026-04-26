import ParkingMap from '../../ParkingMap'
import { useSelectedParkingLot } from '../../../context/SelectedParkingLotContext'

export default function AdminLiveMapPage() {
  const { selectedLotId, selectedLot } = useSelectedParkingLot()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-950 dark:text-white">Live map</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Real-time slot states for <span className="font-medium text-blue-800 dark:text-slate-200">{selectedLot?.name ?? 'the selected site'}</span>{' '}
          — switch site in the bar
          above.
        </p>
      </div>
      <ParkingMap title="Deck overview" parkingLotId={selectedLotId ?? undefined} pollMs={12000} />
    </div>
  )
}
