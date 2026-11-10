import type { DistrictResistance } from '../types/api'
import { apiClient } from './apiClient'

export interface ResistanceQuery {
  microorganismId: number
  antibioticId: number
  from: string
  to: string
}

export const antibiogramService = {
  async byDistrict(query: ResistanceQuery, signal?: AbortSignal) {
    const { data } = await apiClient.get<DistrictResistance[]>('/antibiogram/by-district', {
      params: query,
      signal,
    })
    return data
  },
}