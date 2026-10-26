import { motion, useReducedMotion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import { useCountUp } from '../../hooks/useCountUp'
import { useRef } from 'react'

interface KpiCardProps {
  title: string
  value: number
  unit: string
  subtitle?: string
  isPercentage?: boolean
}

export default function KpiCard({ title, value, unit, subtitle, isPercentage = false }: KpiCardProps) {
  const reducedMotion = useReducedMotion()
  const { value: displayValue, isComplete } = useCountUp(value, reducedMotion ? 0 : 700)
  const containerRef = useRef<HTMLDivElement>(null)

  // 3D Tilt Logic
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 })
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['3deg', '-3deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-3deg', '3deg'])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

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
      ref={containerRef}
      variants={cardVariants}
      onMouseMove={reducedMotion ? undefined : handleMouseMove}
      onMouseLeave={reducedMotion ? undefined : handleMouseLeave}
      style={{
        rotateX: reducedMotion ? 0 : rotateX,
        rotateY: reducedMotion ? 0 : rotateY,
        transformStyle: "preserve-3d"
      }}
      className="relative rounded-xl p-[1px] group cursor-default"
    >
      {/* Animated Conic Gradient Border */}
      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(94,231,255,0.8)_360deg)] animate-[spin_4s_linear_infinite]" />
      </div>

      <div 
        className="bg-panel rounded-xl p-5 shadow-sm h-full relative z-10 
                   group-hover:shadow-[0_8px_30px_rgba(94,231,255,0.15)] transition-shadow duration-300"
      >
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
          {title}
        </h3>
        <div className="relative inline-flex flex-col">
          <div className="flex items-baseline gap-1" style={{ transform: 'translateZ(20px)' }}>
            <span className="text-3xl font-bold font-display text-ink tabular-nums">
              {isPercentage ? displayValue.toFixed(1) : Math.round(displayValue)}
            </span>
            <span className="text-sm font-medium text-muted">
              {unit}
            </span>
          </div>
          {/* Count-up completion glow underline */}
          <AnimatePresence>
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: [0, 1, 0.2], scaleX: [0, 1, 1] }}
                transition={{ duration: 1.2, times: [0, 0.3, 1], ease: "easeOut" }}
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-cyan blur-[1px]"
              />
            )}
          </AnimatePresence>
        </div>
        {subtitle && (
          <p className="text-xs text-muted mt-2 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  )
}
