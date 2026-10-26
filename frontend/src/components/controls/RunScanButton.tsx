import { useState, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'
import { useRunScan } from '../../api/queries'

interface Ripple {
  id: number
  x: number
  y: number
}

export default function RunScanButton() {
  const { selectedDate, selectedTime, selectedLot } = useAppStore()
  const scan = useRunScan()
  const [ripples, setRipples] = useState<Ripple[]>([])
  const reducedMotion = useReducedMotion()

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // Add ripple
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const id = Date.now()
      setRipples(prev => [...prev, { id, x, y }])

      // Trigger scan
      scan.mutate({
        date: selectedDate,
        time: selectedTime,
        selected_lot: selectedLot,
      })
    },
    [selectedDate, selectedTime, selectedLot, scan],
  )

  const removeRipple = useCallback((id: number) => {
    setRipples(prev => prev.filter(r => r.id !== id))
  }, [])

  return (
    <motion.button
      onClick={handleClick}
      disabled={scan.isPending}
      whileTap={reducedMotion ? undefined : { scale: 0.97 }}
      className={`
        relative w-full overflow-hidden rounded-xl px-6 py-3.5
        bg-gradient-to-r from-cyan to-[#3ac4e0]
        text-[#071018] font-bold text-sm tracking-wide
        shadow-lg shadow-cyan/20
        disabled:opacity-70 disabled:cursor-not-allowed
        transition-all duration-200 ease-premium
        ${!scan.isPending ? 'animate-idle-glow' : ''}
        focus:outline-none focus:ring-2 focus:ring-cyan/40
      `}
    >
      {/* Continuous Shimmer Sweep */}
      {!reducedMotion && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-15deg] w-20 animate-streak pointer-events-none" />
      )}

      {/* Ripple effects */}
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 18, opacity: 0 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.6, ease: 'easeOut' }}
          onAnimationComplete={() => removeRipple(ripple.id)}
          className="absolute w-2 h-2 -ml-1 -mt-1 rounded-full bg-white/50 pointer-events-none"
          style={{ left: ripple.x, top: ripple.y }}
        />
      ))}

      {/* Label */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {scan.isPending ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Scanning…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            RUN PARKING SCAN
          </>
        )}
      </span>
    </motion.button>
  )
}
