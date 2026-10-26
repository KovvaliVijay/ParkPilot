import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAppStore } from './store/useAppStore'
import Sidebar from './components/layout/Sidebar'
import { useRunScan } from './api/queries'

// Components
import KpiRow from './components/kpi/KpiRow'
import KpiCard from './components/kpi/KpiCard'
import ParkingLotGrid from './components/lot/ParkingLotGrid'
import ForecastRadar from './components/forecast/ForecastRadar'
import AlertBanner from './components/alerts/AlertBanner'
import CampusMap from './components/map/CampusMap'
import LotChart from './components/chart/LotChart'
import { SkeletonCard, SkeletonGrid, SkeletonMap } from './components/shared/Skeleton'
import { motion, AnimatePresence } from 'framer-motion'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000 },
  },
})

function AppContent() {
  const theme = useAppStore(s => s.theme)
  const result = useAppStore(s => s.result)
  const scan = useRunScan()
  
  // Toggle dark class on <html>
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  // Top layout definition
  return (
    <div className="flex min-h-screen bg-bg transition-colors duration-400 ease-premium font-sans relative overflow-hidden">
      
      {/* Global Ambient Layer - Animated Blobs */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-20 dark:opacity-30 mix-blend-screen transition-opacity duration-1000">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle_at_center,rgba(94,231,255,0.15),transparent_60%)] blur-3xl animate-blob-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,100,124,0.1),transparent_60%)] blur-3xl animate-blob-float-reverse" />
      </div>

      <Sidebar />
      
      <main className="flex-1 relative h-screen z-10 overflow-hidden">
        {/* Scanlines overlay - now fixed relative to main so it doesn't scroll */}
        <div className="absolute inset-0 scanlines z-0 pointer-events-none" />
        
        {/* Scrolling container */}
        <div className="absolute inset-0 overflow-y-auto p-8 z-10">
          <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-12 relative z-20">
          
          <AnimatePresence mode="wait">
            {!result && !scan.isPending && (
              <motion.div 
                key="empty" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="mt-12 space-y-12"
              >
                {/* Empty State / Pre-scan Instructions */}
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                  <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-cyan/20 to-green/20 mb-4 animate-float-idle text-ink">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold font-display text-ink tracking-tight">
                    Welcome to ParkPilot AI
                  </h2>
                  <p className="text-muted text-base leading-relaxed">
                    Set your forecast parameters in the sidebar and click 
                    <span className="text-cyan font-bold mx-1">RUN PARKING SCAN</span> 
                    to predict campus parking availability.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {['1. Select Date & Time', '2. Pick a Lot', '3. Run Forecast'].map((title, i) => (
                    <motion.div 
                      key={title}
                      className="bg-panel border border-line rounded-xl p-6 text-center"
                      style={{ animation: `floatIdle 4.5s ease-in-out ${1 + i * 0.2}s infinite alternate` }}
                    >
                      <h3 className="font-bold text-ink mb-2">{title}</h3>
                      <p className="text-sm text-muted">Configure in the left sidebar</p>
                    </motion.div>
                  ))}
                </div>

                {/* Demo Grid */}
                <div className="max-w-2xl mx-auto opacity-60 pointer-events-none">
                  <h3 className="text-center text-sm font-semibold text-muted uppercase tracking-widest mb-4">Live Layout Preview</h3>
                  {/* Fake a 58% availability grid (roughly 19 spots occupied) */}
                  <ParkingLotGrid demoMode={true} demoOccupied={[2,4,7,12,15,19,23,26,29,32,34,38,40,41,43]} />
                </div>
              </motion.div>
            )}

            {scan.isPending && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                </div>
                <SkeletonGrid />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SkeletonMap /><SkeletonMap />
                </div>
              </motion.div>
            )}

            {result && !scan.isPending && (
              <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                
                <AlertBanner />

                {/* Top KPIs */}
                <KpiRow>
                  <KpiCard title="Target Lot" value={result.selected_lot} unit="" subtitle={`Availability: ${result.availability_level}`} />
                  <KpiCard title="Predicted Availability" value={result.selected_availability} unit="%" isPercentage subtitle={`At ${result.checkpoints[0]?.label || 'requested time'}`} />
                  <KpiCard title="Best Alternative" value={result.best_lot.ps_idx} unit="" subtitle={`Lot ${result.best_lot.ps_idx} (${result.best_lot.availability.toFixed(1)}% free)`} />
                  <KpiCard title="Campus Average" value={result.avg_availability} unit="%" isPercentage subtitle="Across all 27 lots" />
                </KpiRow>

                {/* Forecast Radar */}
                <div className="pt-2">
                  <h3 className="text-sm font-bold text-ink mb-4 font-display tracking-tight flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan" /> 
                    Availability Forecast Horizon
                  </h3>
                  <ForecastRadar checkpoints={result.checkpoints} />
                </div>

                {/* Main Parking Grid */}
                <div className="pt-2 max-w-4xl">
                  <div className="flex items-end justify-between mb-4">
                    <h3 className="text-sm font-bold text-ink font-display tracking-tight flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan" /> 
                      Lot {result.selected_lot} Layout Preview
                    </h3>
                    <div className="flex gap-4 text-xs font-medium text-muted">
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-green/20 border border-green/30" /> Free</div>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-panel2 border border-line" /> Occupied</div>
                    </div>
                  </div>
                  <ParkingLotGrid />
                </div>

                {/* Map and Chart Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                  <div>
                    <h3 className="text-sm font-bold text-ink mb-4 font-display tracking-tight flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan" /> 
                      Campus Heatmap
                    </h3>
                    <CampusMap lots={result.all_lots} selectedLotId={result.selected_lot} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink mb-4 font-display tracking-tight flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan" /> 
                      Trend Analysis
                    </h3>
                    <LotChart historicalSeries={result.historical_series} forecastSeries={result.forecast_series} />
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
          
          </div>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}
