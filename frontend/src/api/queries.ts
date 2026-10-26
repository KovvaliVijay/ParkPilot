import { useMutation, useQuery } from '@tanstack/react-query'
import { useAppStore } from '../store/useAppStore'
import { apiFetch } from './client'
import type { ForecastResponse, LotMeta, ForecastRequest } from '../types'

export function useLots() {
  return useQuery<LotMeta[]>({
    queryKey: ['lots'],
    queryFn: () => apiFetch<LotMeta[]>('/api/lots'),
  })
}

export function useRunScan() {
  const setResult = useAppStore(s => s.setResult)
  return useMutation({
    mutationFn: async (payload: ForecastRequest) => {
      return apiFetch<ForecastResponse>('/api/forecast', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    onSuccess: setResult,
  })
}
