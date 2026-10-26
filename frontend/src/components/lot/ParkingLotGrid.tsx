import { useMemo } from 'react'
import { motion } from 'framer-motion'
import Spot from './Spot'
import { useAppStore } from '../../store/useAppStore'

interface ParkingLotGridProps {
  demoMode?: boolean
  demoOccupied?: number[]
}

export default function ParkingLotGrid({ demoMode = false, demoOccupied = [] }: ParkingLotGridProps) {
  const result = useAppStore(s => s.result)
  const previousOccupied = useAppStore(s => s.previousOccupied)

  const currentOccupied = demoMode ? demoOccupied : (result?.occupied_spots ?? [])
  const prevOccupied = demoMode ? [] : previousOccupied

  // The true diff logic from spec §5.7
  const getSpotStatus = (index: number): 'arriving' | 'leaving' | 'parked' | 'empty' => {
    const isNowOccupied = currentOccupied.includes(index)
    const wasOccupied = prevOccupied.includes(index)

    if (isNowOccupied && !wasOccupied) return 'arriving'
    if (!isNowOccupied && wasOccupied) return 'leaving'
    if (isNowOccupied && wasOccupied) return 'parked'
    return 'empty'
  }

  // Generate 45 spots with their current diff status
  const spots = useMemo(() => {
    return Array.from({ length: 45 }).map((_, i) => ({
      index: i,
      status: getSpotStatus(i)
    }))
  }, [currentOccupied, prevOccupied])

  const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.045 // --stagger-step from design.md
      }
    }
  }

  return (
    <motion.div 
      variants={gridVariants}
      initial="hidden"
      animate="visible"
      className="bg-panel border border-line rounded-xl p-6 max-w-4xl mx-auto w-full relative"
    >
      <div className="grid grid-cols-9 gap-x-2 gap-y-3 relative">
        {spots.map((spot, i) => {
          // Render a road divider after rows 1, 2, 3, 4 (indices 8, 17, 26, 35)
          const needsDivider = i > 0 && i % 9 === 0
          
          return (
            <div key={spot.index} className="contents">
              {needsDivider && (
                <div className="col-span-9 h-6 mb-3 relative flex items-center justify-center opacity-60">
                   {/* Scrolling dashed line */}
                   <div 
                     className="absolute w-2 h-14 bg-[linear-gradient(180deg,transparent_20%,var(--color-line)_20%,var(--color-line)_80%,transparent_80%)] animate-scroll-dash" 
                     style={{ backgroundSize: '100% 20px' }}
                   />
                </div>
              )}
              <Spot index={spot.index} status={spot.status} />
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
