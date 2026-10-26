import { useEffect, useState, useRef } from 'react'

export function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const raf = useRef<number | undefined>(undefined)

  useEffect(() => {
    setIsComplete(false)
    const start = performance.now()
    const from = value

    function tick(now: number) {
      if (duration === 0) {
        setValue(target)
        setIsComplete(true)
        return
      }
      
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(from + (target - from) * eased)
      
      if (p < 1) {
        raf.current = requestAnimationFrame(tick)
      } else {
        setIsComplete(true)
      }
    }

    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration])

  return { value, isComplete }
}
