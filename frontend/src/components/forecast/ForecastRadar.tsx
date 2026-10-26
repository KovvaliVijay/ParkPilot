import { motion } from 'framer-motion'
import type { ForecastCheckpoint } from '../../types'
import ForecastCard from './ForecastCard'

interface ForecastRadarProps {
  checkpoints: ForecastCheckpoint[]
}

export default function ForecastRadar({ checkpoints }: ForecastRadarProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.045 }
    }
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 md:grid-cols-5 gap-3"
    >
      {checkpoints.map((cp, index) => (
        <ForecastCard key={`${cp.label}-${index}`} checkpoint={cp} />
      ))}
    </motion.div>
  )
}
