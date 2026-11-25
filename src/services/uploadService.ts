import type { DataOrigin, DataUpload, Facility } from '../types/api'
import { apiClient } from './apiClient'

export const uploadService = {
  /** Establecimientos donde el usuario puede cargar datos. */
  async myFacilities(signal?: AbortSignal) {
    const { data } = await apiClient.get<Facility[]>('/auth/me/facilities', { signal })
    return data
  },

  /** El servidor responde 202 y procesa el archivo en segundo plano; el estado se consulta con get(). */
  async upload(file: File, facilityId: number, origin: DataOrigin) {
    const form = new FormData()
    form.append('file', file)
    form.append('facilityId', String(facilityId))
    form.append('origin', origin)
    const { data } = await apiClient.post<DataUpload>('/uploads', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    })
    return data
  },

  async get(id: number, signal?: AbortSignal) {
    const { data } = await apiClient.get<DataUpload>(`/uploads/${id}`, { signal })
    return data
  },
}
