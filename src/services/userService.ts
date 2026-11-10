import type { Page, Role, User } from '../types/api'
import { apiClient } from './apiClient'

export const userService = {
  async list({ page, size }: { page: number; size: number }, signal?: AbortSignal) {
    const { data } = await apiClient.get<Page<User>>('/users', { params: { page, size, sort: 'email' }, signal })
    return data
  },

  async changeRole(id: number, role: Role) {
    const { data } = await apiClient.patch<User>(`/users/${id}/role`, null, { params: { role } })
    return data
  },

  async setActive(id: number, active: boolean) {
    const { data } = await apiClient.patch<User>(`/users/${id}/active`, null, { params: { active } })
    return data
  },
}