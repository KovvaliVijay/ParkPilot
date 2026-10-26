import ThemeToggle from '../controls/ThemeToggle'
import DatePicker from '../controls/DatePicker'
import TimeSelect from '../controls/TimeSelect'
import LotSlider from '../controls/LotSlider'
import RunScanButton from '../controls/RunScanButton'

export default function Sidebar() {
  return (
    <aside className="w-72 shrink-0 h-screen sticky top-0 overflow-y-auto
                      bg-panel border-r border-line
                      flex flex-col p-5 gap-6
                      transition-colors duration-400 ease-premium">
      {/* Logo area */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-cyan to-[#3ac4e0]
                          flex items-center justify-center overflow-hidden text-[#071018]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
              <path d="M9 16V8h4a2 2 0 0 1 0 4H9" />
            </svg>
            {/* Sheen effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent
                            translate-x-[-120%] animate-sheen" />
          </div>
          <div>
            <h1 className="text-sm font-bold font-display text-ink leading-tight">ParkPilot</h1>
            <p className="text-[10px] text-muted font-medium">AI Forecaster</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-panel2 border border-line relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-streak pointer-events-none" />
        <span className="relative flex h-2 w-2 z-10">
          <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full border border-green opacity-75" />
          <span className="animate-ping2 absolute inline-flex h-full w-full rounded-full bg-green opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green shadow-[0_0_8px_rgba(88,227,145,0.8)]" />
        </span>
        <span className="text-xs font-medium text-muted z-10">System Online</span>
      </div>

      {/* Divider */}
      <div className="h-px bg-line" />

      {/* Controls */}
      <div className="flex flex-col gap-5">
        <DatePicker />
        <TimeSelect />
        <LotSlider />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Scan button */}
      <RunScanButton />

      {/* Footer hint */}
      <p className="text-[10px] text-muted text-center leading-relaxed">
        Predictions based on XGBoost models<br />
        trained on campus parking data
      </p>
    </aside>
  )
}
