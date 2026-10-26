import { motion, useReducedMotion } from 'framer-motion'
import type { ForecastCheckpoint } from '../../types'

interface ForecastCardProps {
  checkpoint: ForecastCheckpoint
}

export default function ForecastCard({ checkpoint }: ForecastCardProps) {
  const reducedMotion = useReducedMotion()
  const { label, occupancy_pct, is_tight } = checkpoint
  const availability = 100 - occupancy_pct

  const auraClass =
    availability >= 60 ? 'shadow-[0_0_15px_rgba(88,227,145,0.15)] border-green/20' :
      availability >= 30 ? 'shadow-[0_0_15px_rgba(255,209,102,0.15)] border-yellow/20' :
        'shadow-[0_0_15px_rgba(255,100,124,0.2)] border-red/30'

  const cardVariants: any = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] }
    }
  }

  return (
    <motion.div
      variants={cardVariants}
      className={`
        bg-panel border rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden transition-shadow duration-500
        ${auraClass} ${is_tight ? 'animate-tight-pulse border-red/50' : ''}
      `}
    >
      <div className="flex justify-between items-center z-10">
        <span className="text-xs font-semibold text-muted uppercase tracking-widest">{label}</span>
        <span className={`text-sm font-bold font-display ${is_tight ? 'text-red' : 'text-ink'}`}>
          {availability.toFixed(1)}% free
        </span>
      </div>

      <div className="h-1.5 w-full bg-line/50 rounded-full overflow-hidden z-10 relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${availability}%` }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className={`h-full rounded-full relative overflow-hidden ${is_tight ? 'bg-red' : 'bg-cyan'}`}
        >
          {/* Traveling shimmer streak */}
          {!reducedMotion && (
            <div className="absolute top-0 bottom-0 left-0 w-8 bg-white/40 blur-[2px] animate-streak" />
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
