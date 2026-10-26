import { motion } from 'framer-motion'
import Car from './Car'

interface SpotProps {
  index: number
  status: 'arriving' | 'leaving' | 'parked' | 'empty'
}

export default function Spot({ index, status }: SpotProps) {
  const isEmpty = status === 'empty' || status === 'leaving'
  
  // Base entrance animation for the spot itself (only plays on initial mount)
  const spotVariants: any = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] }
    }
  }

  const tooltipText = `Spot ${String(index + 1).padStart(2, '0')} · ${isEmpty ? 'Free' : 'Occupied'}`

  return (
    <motion.div
      variants={spotVariants}
      className="relative group cursor-default"
    >
      <div 
        className={`
          w-full aspect-square rounded-lg border-2 flex items-center justify-center
          transition-all duration-180 ease-premium relative z-10
          group-hover:scale-105 group-hover:z-20
          ${isEmpty 
            ? 'border-green/50 bg-green/10 animate-free-breathe shadow-[0_0_10px_rgba(88,227,145,0.2)] group-hover:shadow-[0_0_20px_rgba(88,227,145,0.6)]' 
            : 'border-line bg-panel2 group-hover:shadow-[0_0_20px_rgba(94,231,255,0.4)] group-hover:border-cyan/50'
          }
        `}
      >
        <span className="absolute top-1 left-1 text-[9px] font-bold text-muted/50 select-none">
          {String(index + 1).padStart(2, '0')}
        </span>
        
        {/* Car renders conditionally based on status, handling its own diff animation */}
        {(status === 'arriving' || status === 'leaving' || status === 'parked') && (
          <Car status={status} />
        )}
      </div>

      {/* Hover Tooltip */}
      <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-[#0b1019] text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap
                      opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30 pointer-events-none shadow-lg">
        {tooltipText}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-solid border-b-[#0b1019] border-b-4 border-x-transparent border-x-4 border-t-0" />
      </div>
    </motion.div>
  )
}
