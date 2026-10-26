import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface KpiRowProps {
  children: ReactNode
}

export default function KpiRow({ children }: KpiRowProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {children}
    </motion.div>
  )
}
