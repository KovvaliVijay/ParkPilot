import { create } from 'zustand'
import type { ForecastResponse } from '../types'

interface AppState {
  theme: 'dark' | 'light'
  toggleTheme: () => void
  selectedDate: string
  selectedTime: string
  selectedLot: number
  setSelectedDate: (v: string) => void
  setSelectedTime: (v: string) => void
  setSelectedLot: (v: number) => void
  result: ForecastResponse | null
  previousOccupied: number[]     // enables real diff-based car animation
  setResult: (r: ForecastResponse) => void
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  toggleTheme: () => set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  selectedDate: '2016-12-19',
  selectedTime: '08:00',
  selectedLot: 1,
  setSelectedDate: v => set({ selectedDate: v }),
  setSelectedTime: v => set({ selectedTime: v }),
  setSelectedLot: v => set({ selectedLot: v }),
  result: null,
  previousOccupied: [],
  setResult: r => set(s => ({ result: r, previousOccupied: s.result?.occupied_spots ?? [] })),
}))
