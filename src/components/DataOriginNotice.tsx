import Alert from './Alert'

/** Aviso honesto sobre la procedencia de lo que se está mostrando. */
export default function DataOriginNotice({ realPercentage }: { realPercentage: number | null }) {
  if (realPercentage === null) return null
  if (realPercentage === 0) {
    return (
      <Alert tone="warning">
        Datos <strong>sintéticos</strong> de demostración, calibrados con estudios peruanos publicados. No
        corresponden a pacientes reales. Con el filtro «Procedencia: reales» se ven solo datos de laboratorio.
      </Alert>
    )
  }
  return (
    <Alert tone="info">
      El {realPercentage.toFixed(0)} % de los aislamientos de esta consulta proviene de laboratorios reales.
    </Alert>
  )
}
