import type { AlertStatus, ResistanceAlert } from '../types/api'
import { apiClient } from './apiClient'

export const alertService = {
  async list(status?: AlertStatus, signal?: AbortSignal) {
    const { data } = await apiClient.get<ResistanceAlert[]>('/alerts', { params: status ? { status } : {}, signal })
    return data
  },

  async updateStatus(id: number, status: AlertStatus) {
    const { data } = await apiClient.patch<ResistanceAlert>(`/alerts/${id}/status`, { status })
    return data
  },

  /** Reevalúa un periodo pasado semana a semana; las alertas detectadas quedan registradas. */
  async replay(facilityId: number, from: string, to: string) {
    const { data } = await apiClient.post<ResistanceAlert[]>('/alerts/replay', null, {
      params: { facilityId, from, to, stepDays: 7 },
      timeout: 60000,
    })
    return data
  },
}
