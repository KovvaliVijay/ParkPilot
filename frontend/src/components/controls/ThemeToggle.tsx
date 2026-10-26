import { useAppStore } from '../../store/useAppStore'
import { motion } from 'framer-motion'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useAppStore()
  const isDark = theme === 'dark'

  return (
    <motion.button
      onClick={toggleTheme}
      whileTap={{ scale: 0.9, boxShadow: "0 0 20px rgba(94,231,255,0.8)", borderColor: "rgba(94,231,255,0.8)" }}
      className="relative flex items-center justify-center w-10 h-10 rounded-xl
                 bg-panel2 border border-line text-ink
                 hover:border-cyan/40 transition-all duration-300 ease-premium
                 focus:outline-none focus:ring-2 focus:ring-cyan/30"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <motion.span
        key={theme}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="text-lg"
      >
        {isDark ? '🌙' : '☀️'}
      </motion.span>
    </motion.button>
  )
}
