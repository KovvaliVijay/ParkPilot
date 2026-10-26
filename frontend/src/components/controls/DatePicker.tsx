import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'

// Model's supported date range
const MIN_DATE = new Date(2016, 11, 13) // Dec 13, 2016
const MAX_DATE = new Date(2016, 11, 19) // Dec 19, 2016

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function formatDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDate(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function isInRange(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return d >= MIN_DATE && d <= MAX_DATE
}

export default function DatePicker() {
  const { selectedDate, setSelectedDate } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)
  const current = parseDate(selectedDate)
  const [viewYear, setViewYear] = useState(current.getFullYear())
  const [viewMonth, setViewMonth] = useState(current.getMonth())
  const containerRef = useRef<HTMLDivElement>(null)
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

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()

  const handleSelect = (day: number) => {
    const d = new Date(viewYear, viewMonth, day)
    if (isInRange(d)) {
      setSelectedDate(formatDate(d))
      setIsOpen(false)
    }
  }

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(y => y - 1)
      setViewMonth(11)
    } else {
      setViewMonth(m => m - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(y => y + 1)
      setViewMonth(0)
    } else {
      setViewMonth(m => m + 1)
    }
  }

  // Format display: "Dec 19, 2016"
  const displayDate = `${MONTH_NAMES[current.getMonth()].slice(0, 3)} ${current.getDate()}, ${current.getFullYear()}`

  const calendarVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -4 },
    visible: { opacity: 1, scale: 1, y: 0 },
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">
        Forecast Date
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
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          {displayDate}
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
            variants={calendarVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={reducedMotion ? { duration: 0 } : { duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-50 top-full left-0 mt-1.5 w-full
                       bg-panel border border-line rounded-xl shadow-2xl shadow-black/20 p-3"
          >
            {/* Month/year header with nav */}
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={prevMonth}
                className="w-7 h-7 flex items-center justify-center rounded-lg
                           text-muted hover:text-ink hover:bg-panel2 transition-colors"
                aria-label="Previous month"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-semibold text-ink">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <button
                onClick={nextMonth}
                className="w-7 h-7 flex items-center justify-center rounded-lg
                           text-muted hover:text-ink hover:bg-panel2 transition-colors"
                aria-label="Next month"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_NAMES.map(d => (
                <div key={d} className="text-center text-[10px] font-medium text-muted py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5">
              {/* Empty cells for offset */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {/* Actual days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const date = new Date(viewYear, viewMonth, day)
                const inRange = isInRange(date)
                const isSelected = isSameDay(date, current)
                const isToday = isSameDay(date, new Date())

                return (
                  <button
                    key={day}
                    onClick={() => handleSelect(day)}
                    disabled={!inRange}
                    className={`
                      h-8 w-full rounded-lg text-xs font-medium transition-all duration-150
                      flex items-center justify-center
                      ${isSelected
                        ? 'bg-cyan text-[#071018] font-bold shadow-lg shadow-cyan/25'
                        : inRange
                          ? 'text-ink hover:bg-panel2 hover:text-cyan cursor-pointer'
                          : 'text-muted/30 cursor-not-allowed'
                      }
                      ${isToday && !isSelected ? 'ring-1 ring-cyan/30' : ''}
                    `}
                  >
                    {day}
                  </button>
                )
              })}
            </div>

            {/* Range hint */}
            <div className="mt-2 pt-2 border-t border-line">
              <p className="text-[10px] text-muted text-center">
                Model range: Dec 13 – Dec 19, 2016
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
