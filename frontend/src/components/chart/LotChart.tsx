import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts'
import type { SeriesPoint } from '../../types'

interface LotChartProps {
  historicalSeries: SeriesPoint[]
  forecastSeries: SeriesPoint[]
}

export default function LotChart({ historicalSeries, forecastSeries }: LotChartProps) {
  // Combine data for recharts
  const combinedData: any[] = [...historicalSeries.map(p => ({ ...p, historical: p.value, forecast: null }))]
  
  // Attach the forecast to the last historical point so the line connects visually
  if (combinedData.length > 0 && forecastSeries.length > 0) {
    combinedData[combinedData.length - 1].forecast = combinedData[combinedData.length - 1].historical
  }
  
  forecastSeries.forEach(p => {
    combinedData.push({ ...p, historical: null, forecast: p.value })
  })

  // Format tick to just show time HH:MM
  const formatTick = (ts: string) => {
    try {
      const d = new Date(ts)
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    } catch {
      return ts
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-panel border border-line p-3 rounded-lg shadow-lg font-medium">
          <p className="text-xs text-muted mb-2">{label}</p>
          {payload.map((entry: any) => (
            <p key={entry.name} className="text-sm font-bold flex items-center gap-2" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name === 'historical' ? 'Historical' : 'Forecast'}: {entry.value.toFixed(1)}% Free
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0 }}
      animate={{ clipPath: 'inset(0 0 0 0)', opacity: 1 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="w-full h-full min-h-[350px] bg-panel border border-line rounded-xl p-4 pt-6 shadow-sm"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={combinedData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-line)" opacity={0.6} />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={formatTick} 
            minTickGap={30}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
            dy={10}
          />
          <YAxis 
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
          />
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '10px' }} />
          <Line 
            type="monotone" 
            dataKey="historical" 
            name="Historical"
            stroke="var(--color-cyan)" 
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: 'var(--color-panel)', stroke: 'var(--color-cyan)', strokeWidth: 2 }}
            isAnimationActive={true}
            animationDuration={1000}
            animationEasing="ease-in-out"
          />
          <Line 
            type="monotone" 
            dataKey="forecast" 
            name="Forecast"
            stroke="var(--color-red)" 
            strokeWidth={3}
            strokeDasharray="6 4"
            dot={false}
            activeDot={{ r: 6, fill: 'var(--color-panel)', stroke: 'var(--color-red)', strokeWidth: 2 }}
            isAnimationActive={true}
            animationDuration={1000}
            animationBegin={800}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
