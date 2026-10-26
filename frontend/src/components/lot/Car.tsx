import { motion, AnimatePresence } from 'framer-motion'

interface CarProps {
  status: 'arriving' | 'leaving' | 'parked'
}

export default function Car({ status }: CarProps) {
  // Diff-based animation variants
  const carVariants: any = {
    initial_arriving: { x: '-140%', scale: 0.9, opacity: 0 },
    animate_arriving: { 
      x: 0, 
      scale: 1, 
      opacity: 1,
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } 
    },
    // The "parked" state doesn't replay the entrance
    animate_parked: { x: 0, scale: 1, opacity: 1 },
    // "leaving" state for when a spot becomes empty
    exit_leaving: { 
      scale: 0.5, 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  }

  const getAnimateState = () => {
    if (status === 'arriving') return 'animate_arriving'
    return 'animate_parked'
  }

  return (
    <AnimatePresence>
      {status !== 'leaving' && (
        <motion.div
          variants={carVariants}
          initial={status === 'arriving' ? 'initial_arriving' : false}
          animate={getAnimateState()}
          exit="exit_leaving"
          className="absolute inset-0 flex items-center justify-center animate-idle-bob"
        >
          {/* Radar Ping (Occupied) */}
          <div className="absolute top-1/2 left-1/2 w-8 h-8 rounded-full border border-cyan/40 animate-pulse-ring pointer-events-none" style={{ animationDelay: `${Math.random() * 2}s` }} />

          {/* Ground reflection glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full bg-[radial-gradient(circle_at_center,rgba(94,231,255,0.25),transparent_70%)] pointer-events-none blur-sm" />

          {/* Headlight glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] rounded-full animate-headlight z-0 pointer-events-none" />
          
          {/* The Car itself */}
          <div className="relative z-10 text-2xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            🚘
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
