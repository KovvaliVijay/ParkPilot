import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'

// Generate time options: 08:00, 08:30, ..., 16:30
const TIME_OPTIONS: string[] = []
for (let h = 8; h <= 16; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`)
  if (h < 16 || h === 16) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`)
  }
}
// Remove 17:00 if it got added (we stop at 16:30)
const TIMES = TIME_OPTIONS.filter(t => {
  const [h] = t.split(':').map(Number)
  return h <= 16
})

export default function TimeSelect() {
  const { selectedTime, setSelectedTime } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen])

  // Scroll selected item into view when opening
  useEffect(() => {
    if (isOpen && listRef.current) {
      const selectedEl = listRef.current.querySelector('[data-selected="true"]')
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'center' })
      }
    }
  }, [isOpen])

  const handleSelect = (time: string) => {
    setSelectedTime(time)
    setIsOpen(false)
  }

  // Format display: "08:00 AM" style
  const formatDisplay = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${h12}:${String(m).padStart(2, '0')} ${period}`
  }

  const dropdownVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -4 },
    visible: { opacity: 1, scale: 1, y: 0 },
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
        Arrival Time
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5
                   bg-panel border border-line rounded-lg text-ink text-sm font-medium
                   hover:border-cyan/40 transition-all duration-200 ease-premium
                   focus:outline-none focus:ring-2 focus:ring-cyan/30"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          {formatDisplay(selectedTime)}
        </span>
        <svg
          className={`w-4 h-4 text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={listRef}
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={reducedMotion ? { duration: 0 } : { duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-50 top-full left-0 mt-1.5 w-full max-h-52
                       bg-panel border border-line rounded-xl shadow-2xl shadow-black/20
                       overflow-y-auto"
            role="listbox"
          >
            {TIMES.map(time => {
              const isSelected = time === selectedTime
              return (
                <button
                  key={time}
                  onClick={() => handleSelect(time)}
                  data-selected={isSelected}
                  role="option"
                  aria-selected={isSelected}
                  className={`
                    w-full text-left px-3 py-2 text-sm transition-colors duration-100
                    flex items-center justify-between
                    ${isSelected
                      ? 'bg-cyan/10 text-cyan font-semibold'
                      : 'text-ink hover:bg-panel2'
                    }
                  `}
                >
                  <span>{formatDisplay(time)}</span>
                  <span className="text-xs text-muted">{time}</span>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
