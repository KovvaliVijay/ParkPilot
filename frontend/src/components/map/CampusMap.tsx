import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet'
import type { LotResult } from '../../types'
import { motion } from 'framer-motion'
import 'leaflet/dist/leaflet.css'

// Sync map center to selected lot
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true })
  }, [center, map])
  return null
}

function getAvailabilityColor(availability: number) {
  // simple RdYlGn fallback 
  if (availability >= 60) return '#58e391' // green
  if (availability >= 30) return '#ffd166' // yellow
  return '#ff647c' // red
}

export default function CampusMap({ lots, selectedLotId }: { lots: LotResult[], selectedLotId: number }) {
  
  const selectedLot = lots.find(l => l.ps_idx === selectedLotId)
  const center: [number, number] = selectedLot ? [selectedLot.latitude, selectedLot.longitude] : [52.478, -1.89]

  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full h-full min-h-[350px] bg-panel border border-line rounded-xl overflow-hidden p-1 shadow-sm relative z-10"
    >
      <div className="w-full h-full rounded-lg overflow-hidden">
        <MapContainer center={center} zoom={14} scrollWheelZoom={false} className="w-full h-full bg-[#202020]" zoomControl={false}>
          <TileLayer
            url={tileUrl}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapUpdater center={center} />
          
          {lots.map(lot => {
            const isSelected = lot.ps_idx === selectedLotId
            const radius = 6 + Math.pow(lot.availability, 0.6)
            const color = getAvailabilityColor(lot.availability)

            return (
              <div key={lot.ps_idx} className="contents">
                {/* Pulsing halo for selected marker */}
                {isSelected && (
                  <CircleMarker
                    center={[lot.latitude, lot.longitude]}
                    radius={radius * 1.8}
                    className="animate-pulse-ring"
                    pathOptions={{
                      fillColor: color,
                      fillOpacity: 0.4,
                      color: 'transparent',
                      weight: 0,
                    }}
                  />
                )}
                
                <CircleMarker
                  center={[lot.latitude, lot.longitude]}
                  radius={isSelected ? radius * 1.2 : radius}
                  pathOptions={{
                    fillColor: color,
                    fillOpacity: isSelected ? 0.9 : 0.6,
                    color: isSelected ? '#ffffff' : color,
                    weight: isSelected ? 2 : 0,
                  }}
                >
                  <Tooltip direction="top" opacity={1} className="bg-[#0b1019] text-white border-none rounded shadow-lg text-xs font-display font-medium">
                    <div>Lot {lot.ps_idx}</div>
                    <div className="text-cyan">{lot.availability.toFixed(1)}% Free</div>
                  </Tooltip>
                </CircleMarker>
              </div>
            )
          })}
        </MapContainer>
      </div>
    </motion.div>
  )
}
