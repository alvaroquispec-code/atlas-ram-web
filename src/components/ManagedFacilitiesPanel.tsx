import { Building2 } from 'lucide-react'
import { useFetch } from '../hooks/useFetch'
import { verificationService } from '../services/verificationService'
import AccessRequestsPanel from './AccessRequestsPanel'

/**
 * Para el jefe de un establecimiento: aprueba a su propio personal sin pasar por el administrador global.
 * El servidor solo le muestra las solicitudes de los establecimientos que administra.
 */
export default function ManagedFacilitiesPanel() {
  const { data } = useFetch((signal) => verificationService.managedFacilities(signal), [])
  if (!data || data.length === 0) return null
  return (
    <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Building2 size={18} aria-hidden /> Establecimientos que administras
      </h2>
      <p className="text-sm text-slate-500">{data.map((f) => f.name).join(' · ')}</p>
      <AccessRequestsPanel onDecided={() => {}} />
    </div>
  )
}
