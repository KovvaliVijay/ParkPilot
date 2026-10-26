import { useAppStore } from '../../store/useAppStore'

export default function LotSlider() {
  const { selectedLot, setSelectedLot } = useAppStore()

  return (
    <div className="w-full">
      <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
        Parking Lot
      </label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={1}
          max={27}
          value={selectedLot}
          onChange={e => setSelectedLot(Number(e.target.value))}
          className="flex-1"
        />
        <span className="min-w-[3ch] text-right text-sm font-bold text-cyan tabular-nums">
          #{selectedLot}
        </span>
      </div>
      <div className="flex justify-between text-[10px] text-muted mt-1 px-0.5">
        <span>Lot 1</span>
        <span>Lot 27</span>
      </div>
    </div>
  )
}
