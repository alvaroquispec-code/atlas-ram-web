import type { DddReport, FacilityStockReport } from '../types/api'
import { apiClient } from './apiClient'

export const logisticsService = {
  async stock(facilityId: number, signal?: AbortSignal) {
    const { data } = await apiClient.get<FacilityStockReport>(`/logistics/facilities/${facilityId}/stock`, { signal })
    return data
  },

  async ddd(facilityId: number, from: string, to: string, signal?: AbortSignal) {
    const { data } = await apiClient.get<DddReport>(`/logistics/facilities/${facilityId}/ddd`, {
      params: { from, to },
      signal,
    })
    return data
  },
}
