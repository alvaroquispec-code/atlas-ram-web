import type { AccessRequest, ProfessionalRequest } from '../types/api'
import { apiClient } from './apiClient'

export const accessRequestService = {
  /** Solicitudes pendientes (solo ADMIN). */
  async pending(signal?: AbortSignal) {
    const { data } = await apiClient.get<AccessRequest[]>('/access-requests', { signal })
    return data
  },
  async mine(signal?: AbortSignal) {
    const { data } = await apiClient.get<AccessRequest[]>('/access-requests/mine', { signal })
    return data
  },
  async request(payload: ProfessionalRequest) {
    const { data } = await apiClient.post<AccessRequest>('/access-requests/mine', payload)
    return data
  },
  async approve(id: number) {
    const { data } = await apiClient.post<AccessRequest>(`/access-requests/${id}/approve`)
    return data
  },
  async reject(id: number, note?: string) {
    const { data } = await apiClient.post<AccessRequest>(`/access-requests/${id}/reject`, { note })
    return data
  },
}
