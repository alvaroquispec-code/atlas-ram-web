import type { DistrictOption, FacilityRequest, FacilityRequestInput, ManagedFacility, Page } from '../types/api'
import { apiClient } from './apiClient'

export interface VerificationResult {
  emailVerified: boolean
  sent: boolean
  message: string
}

export const verificationService = {
  /** Abre el enlace del correo (no requiere sesión). */
  async verify(token: string) {
    const { data } = await apiClient.post<VerificationResult>('/auth/verify-email', { token })
    return data
  },
  async resend() {
    const { data } = await apiClient.post<VerificationResult>('/auth/me/verify-email')
    return data
  },
  async managedFacilities(signal?: AbortSignal) {
    const { data } = await apiClient.get<ManagedFacility[]>('/auth/me/managed-facilities', { signal })
    return data
  },
}

export const facilityRequestService = {
  async create(input: FacilityRequestInput) {
    const { data } = await apiClient.post<FacilityRequest>('/facility-requests/mine', input)
    return data
  },
  async mine(signal?: AbortSignal) {
    const { data } = await apiClient.get<FacilityRequest[]>('/facility-requests/mine', { signal })
    return data
  },
  async pending(signal?: AbortSignal) {
    const { data } = await apiClient.get<FacilityRequest[]>('/facility-requests', { signal })
    return data
  },
  async approve(id: number) {
    const { data } = await apiClient.post<FacilityRequest>(`/facility-requests/${id}/approve`)
    return data
  },
  async reject(id: number, note?: string) {
    const { data } = await apiClient.post<FacilityRequest>(`/facility-requests/${id}/reject`, { note })
    return data
  },
  async districts(signal?: AbortSignal) {
    const { data } = await apiClient.get<Page<DistrictOption>>('/districts', { params: { size: 200, sort: 'name' }, signal })
    return data.content
  },
  async addManager(facilityId: number, email: string) {
    const { data } = await apiClient.post('/facility-managers', { facilityId, email })
    return data
  },
}

/** Comprobaciones que piden atención (se muestran en ámbar). */
export const isWarningCheck = (c: string) =>
  c.startsWith('Atención') ||
  c.startsWith('Correo aún') ||
  c.startsWith('Quien pide') ||
  c.startsWith('Declaró') ||
  c.includes('no es del dominio') ||
  c.includes('no figura') ||
  c.startsWith('RUC inválido')
