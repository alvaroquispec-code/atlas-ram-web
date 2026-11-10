import type { Isolate, Page, SusceptibilityResult } from '../types/api'
import { apiClient } from './apiClient'

export interface IsolateQuery {
  page: number
  size: number
  facilityId?: number
}

export const isolateService = {
  async list({ page, size, facilityId }: IsolateQuery, signal?: AbortSignal) {
    const { data } = await apiClient.get<Page<Isolate>>('/isolates', {
      params: { page, size, facilityId, sort: 'collectionDate,desc' },
      signal,
    })
    return data
  },

  async findById(id: number, signal?: AbortSignal) {
    const { data } = await apiClient.get<Isolate>(`/isolates/${id}`, { signal })
    return data
  },

  async results(id: number, signal?: AbortSignal) {
    const { data } = await apiClient.get<SusceptibilityResult[]>(`/isolates/${id}/results`, { signal })
    return data
  },
}