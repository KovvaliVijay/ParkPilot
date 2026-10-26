import { motion } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'

export default function AlertBanner() {
  const result = useAppStore(s => s.result)

  if (!result) return null

  const { alert_level, alert_message } = result

  let bgClass = ''
  let borderClass = ''
  let icon = ''
  let textClass = ''

  if (alert_level === 'good') {
    bgClass = 'bg-green/10'
    borderClass = 'border-green/20'
    textClass = 'text-green'
    icon = ''
  } else if (alert_level === 'warn') {
    bgClass = 'bg-yellow/10'
    borderClass = 'border-yellow/20'
    textClass = 'text-yellow'
    icon = '⚠️'
  } else {
    bgClass = 'bg-red/10'
    borderClass = 'border-red/20'
    textClass = 'text-red'
    icon = '🚨'
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`flex items-center gap-3 p-4 rounded-xl border ${bgClass} ${borderClass} mb-6 relative overflow-hidden`}
    >
      {/* Light Sweep on mount */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-glow-sweep pointer-events-none" />
      
      {icon && (
        <span className="text-xl animate-[pulseRing_2s_infinite] filter drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] relative z-10">
          {icon}
        </span>
      )}
      <p className={`text-sm font-medium ${textClass} relative z-10`}>
        {alert_message}
      </p>
    </motion.div>
  )
}
