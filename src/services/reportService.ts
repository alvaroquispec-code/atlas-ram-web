import { apiClient } from './apiClient'

export const reportService = {
  /** Reporte PROA del establecimiento (NTS 184) en PDF: antibiograma acumulado y alertas activas. */
  async proaPdf(facilityId: number, from: string, to: string) {
    const { data } = await apiClient.get<Blob>('/reports/proa', {
      params: { facilityId, from, to },
      responseType: 'blob',
      timeout: 60000,
    })
    return data
  },
}
