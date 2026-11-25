export type Role = 'ADMIN' | 'LAB_TECHNICIAN' | 'EPIDEMIOLOGIST' | 'PUBLIC_VIEWER' | 'PHARMACIST'

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresInSeconds: number
  email: string
  fullName: string
  role: Role
}

export interface User {
  id: number
  email: string
  fullName: string
  role: Role
  active: boolean
  createdAt: string
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface ApiErrorBody {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
  fieldErrors?: Record<string, string>
}

export type Interpretation = 'SUSCEPTIBLE' | 'INTERMEDIATE' | 'RESISTANT'
export type Specimen = 'BLOOD' | 'URINE' | 'RESPIRATORY' | 'WOUND' | 'CSF' | 'STOOL' | 'OTHER'

export interface Microorganism {
  id: number
  code: string
  genus: string
  species: string | null
  gramStain: string
}

export type AwareCategory = 'ACCESS' | 'WATCH' | 'RESERVE' | 'NOT_RECOMMENDED'

export interface Antibiotic {
  id: number
  code: string
  name: string
  antibioticClass: string
  awareCategory?: AwareCategory | null
}

/** Campos que edita el formulario. awareCategory viaja aparte para no borrarlo al editar. */
export type AntibioticInput = Pick<Antibiotic, 'code' | 'name' | 'antibioticClass'>

export interface Isolate {
  id: number
  collectionDate: string
  specimenType: Specimen
  patientAge: number | null
  patientSex: string | null
  facilityName: string
  districtUbigeo: string
  districtName: string
  microorganismName: string
  dataUploadId: number | null
}

export interface SusceptibilityResult {
  id: number
  isolateId: number
  antibioticCode: string
  antibioticName: string
  micValue: number | null
  /** CIM con su calificador tal como la informa el equipo, por ejemplo ">=16" o "<=0.25". */
  micDisplay?: string | null
  diskDiffusionMm: number | null
  interpretation: Interpretation
  reportedInterpretation: Interpretation | null
  breakpointStandard: string
  breakpointVersion: string
}

export interface DistrictResistance {
  districtId: number
  ubigeo: string
  name: string
  totalTested: number
  resistantCount: number
  resistancePercentage: number | null
  sufficientData: boolean
  /** Solo en pares con punto de corte por sitio: el que se usó. */
  breakpointSite?: BreakpointSite | null
}

export type BreakpointSite = 'MENINGITIS' | 'NON_MENINGITIS'


export interface Facility {
  id: number
  code: string
  name: string
  districtId: number
  districtName: string
}

/** Procedencia: REAL (laboratorio) o SYNTHETIC (prueba y demostración). */
export type DataOrigin = 'REAL' | 'SYNTHETIC'

/** Fila del antibiograma acumulado (CLSI M39). Porcentajes de 0 a 100; intervalos de Wilson al 95 %. */
export interface AntibiogramEntry {
  microorganismName: string
  antibioticName: string
  totalTested: number
  resistantCount: number
  resistancePercentage: number
  microorganismId: number
  antibioticId: number
  susceptibleCount: number
  intermediateCount: number
  susceptiblePercentage: number
  susceptibleCiLow: number
  susceptibleCiHigh: number
  resistanceCiLow: number
  resistanceCiHigh: number
  sufficientData: boolean
  repeatIsolatesExcluded: number
  patientIdentifiedPercentage: number
  realDataPercentage: number
  /** Solo en pares con punto de corte por sitio (S. pneumoniae × ceftriaxona/cefepima). */
  breakpointSite?: BreakpointSite | null
}

export interface TrendPoint {
  periodStart: string
  totalTested: number
  resistantCount: number
  resistancePercentage: number | null
  resistanceCiLow: number | null
  resistanceCiHigh: number | null
  susceptiblePercentage: number | null
}

export interface TrendResult {
  microorganismId: number
  microorganismName: string
  antibioticId: number
  antibioticName: string
  interval: 'MONTH' | 'QUARTER'
  points: TrendPoint[]
  trend: {
    z: number
    pValue: number
    changePerYear: number
    direction: 'INCREASING' | 'DECREASING' | 'NO_SIGNIFICANT_TREND'
    periodsWithData: number
    totalTested: number
  } | null
  breakpointSite?: BreakpointSite | null
}

export type Syndrome = 'BACTEREMIA' | 'URINARY' | 'RESPIRATORY' | 'SKIN_SOFT_TISSUE' | 'MENINGITIS'

export interface WiscaRegimen {
  code: string
  antibioticNames: string[]
  coverageMedian: number
  coverageMean: number
  credibleLow: number
  credibleHigh: number
  probabilityAboveTarget: number
  probabilityBest: number
  untestedFrequency: number
  /** Sin pruebas ni fenotipo esperado de EUCAST: se cuentan como no cubiertos. */
  untestedPathogens: string[]
  /** Sin pruebas, sensibles esperados según EUCAST: se cuentan como cubiertos. */
  expectedSusceptiblePathogens?: string[]
  /** Sin pruebas, resistentes esperados según EUCAST: se cuentan como no cubiertos. */
  expectedResistantPathogens?: string[]
  byPathogen: { name: string; evaluated: number; covered: number; percentage: number | null }[]
}

export interface WiscaResult {
  syndrome: Syndrome
  syndromeLabel: string
  specimen: Specimen
  from: string
  to: string
  isolates: number
  sufficientData: boolean
  targetCoverage: number
  simulationDraws: number
  pathogens: { name: string; isolates: number; frequency: number }[]
  regimens: WiscaRegimen[]
  method: string
}

export type UploadStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REVERTED'

export interface DataUpload {
  id: number
  fileName: string
  status: UploadStatus
  totalRows: number | null
  processedRows: number | null
  failedRows: number | null
  errorLog: string | null
  startedAt: string | null
  finishedAt: string | null
  revertedAt: string | null
  revertedBy: string | null
  revertReason: string | null
  dataOrigin: DataOrigin
}

export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'CLOSED'

export interface ResistanceAlert {
  id: number
  facilityId: number
  facilityName: string
  microorganismName: string
  antibioticName: string
  antibioticClass: string
  status: AlertStatus
  detectedOn: string
  windowStart: string
  windowEnd: string
  testedCount: number
  resistantCount: number
  observedPercentage: number
  baselineTested: number
  baselineResistant: number
  baselinePercentage: number
  pValue: number
  createdAt: string
  updatedAt: string
  closedAt: string | null
  closeReason: string | null
}

export type StockState = 'STOCKOUT' | 'UNDERSTOCK' | 'NORMAL_STOCK' | 'OVERSTOCK' | 'NO_ROTATION' | 'NO_MOVEMENT'

export interface StockItemStatus {
  itemId: number
  antibioticId: number
  antibioticCode: string
  antibioticName: string
  awareCategory: AwareCategory | null
  presentation: string
  venClass: 'VITAL' | 'ESSENTIAL' | 'NON_ESSENTIAL'
  abcClass: 'A' | 'B' | 'C' | null
  abcVenCategory: number | null
  unitCost: number | null
  availableUnits: number
  expiredUnitsOnHand: number
  quantityOnOrder: number
  cpma: number
  monthsOfStock: number | null
  sismedState: StockState
  sismedStateLabel: string
  dailyRate: number
  coverageDays: number | null
  demandPattern: string
  adi: number | null
  cv2: number | null
  forecastMethod: 'SES' | 'SBA' | 'TSB' | 'NONE'
  forecastPerMonth: number | null
  historyMonths: number
  reviewPeriodDays: number
  leadTimeDays: number
  serviceLevel: number
  expectedProtectionDemand: number | null
  safetyStock: number | null
  safetyFloorApplied: boolean
  orderUpTo: number | null
  inventoryPosition: number
  suggestedOrder: number | null
  suggestedOrderValue: number | null
  unitsAtRiskOfExpiry: number
  valueAtRiskOfExpiry: number | null
  nextExpiry: string | null
  outbreakPressure: boolean
  outbreakReason: string | null
  monthlyConsumption: { month: string; units: number }[]
}

export interface FacilityStockReport {
  facilityId: number
  facilityName: string
  asOf: string
  itemCount: number
  itemsBySismedState: Record<StockState, number>
  itemsToOrder: number
  suggestedOrderValue: number
  itemsWithExpiryRisk: number
  valueAtRiskOfExpiry: number
  itemsUnderOutbreakPressure: number
  activeAlerts: number
  items: StockItemStatus[]
  method: string
}

export interface DddReport {
  facilityId: number
  from: string
  to: string
  occupiedBedDays: number | null
  bedDaysSource: 'REQUEST' | 'FACILITY' | 'UNAVAILABLE'
  totalDdd: number
  dddPer100BedDays: number | null
  byAware: { awareCategory: AwareCategory; ddd: number; dddPer100BedDays: number | null; share: number }[]
  accessShare: number | null
  whoAccessTarget: number
  itemsWithoutDdd: string[]
  itemsWithoutAware: string[]
  method: string
}

/** Normas con que se interpretan y agregan los resultados (GET /standards). */
export interface Standards {
  breakpoints: string
  breakpointStandard: string
  breakpointVersion: string
  aggregation: string
  expectedPhenotypes: string
}

/** Edición de puntos de corte cargada (GET /breakpoints/editions). */
export interface BreakpointEdition {
  standard: string
  version: string
  breakpoints: number
  active: boolean
}

/** Resultado de reinterpretar el histórico con una edición (POST /breakpoints/reinterpret). */
export interface ReinterpretationReport {
  standard: string
  version: string
  applied: boolean
  evaluated: number
  changed: number
  withoutBreakpoint: number
  changes: { microorganism: string; antibiotic: string; from: string; to: string; count: number }[]
}
