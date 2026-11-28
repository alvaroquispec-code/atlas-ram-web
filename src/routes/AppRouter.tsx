import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import FullPageLoader from '../components/FullPageLoader'
import PrivateRoute from '../components/PrivateRoute'
import AppLayout from '../layouts/AppLayout'
import AuthLayout from '../layouts/AuthLayout'

const LoginPage = lazy(() => import('../pages/LoginPage'))
const RegisterPage = lazy(() => import('../pages/RegisterPage'))
const PrivacyPage = lazy(() => import('../pages/PrivacyPage'))
const TermsPage = lazy(() => import('../pages/TermsPage'))
const DashboardPage = lazy(() => import('../pages/DashboardPage'))
const IsolatesPage = lazy(() => import('../pages/IsolatesPage'))
const IsolateDetailPage = lazy(() => import('../pages/IsolateDetailPage'))
const UsersPage = lazy(() => import('../pages/UsersPage'))
const AntibioticsPage = lazy(() => import('../pages/AntibioticsPage'))
const AntibiogramPage = lazy(() => import('../pages/AntibiogramPage'))
const TrendPage = lazy(() => import('../pages/TrendPage'))
const WiscaPage = lazy(() => import('../pages/WiscaPage'))
const RealDataPage = lazy(() => import('../pages/RealDataPage'))
const UploadPage = lazy(() => import('../pages/UploadPage'))
const NewIsolatePage = lazy(() => import('../pages/NewIsolatePage'))
const AlertsPage = lazy(() => import('../pages/AlertsPage'))
const InventoryPage = lazy(() => import('../pages/InventoryPage'))
const BreakpointsPage = lazy(() => import('../pages/BreakpointsPage'))
const AccountPage = lazy(() => import('../pages/AccountPage'))
const VerifyEmailPage = lazy(() => import('../pages/VerifyEmailPage'))
const FacilityRequestPage = lazy(() => import('../pages/FacilityRequestPage'))
const ForbiddenPage = lazy(() => import('../pages/ForbiddenPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

export default function AppRouter() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route path="/privacidad" element={<PrivacyPage />} />
        <Route path="/terminos" element={<TermsPage />} />
        <Route path="/verificar-correo" element={<VerifyEmailPage />} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/antibiogram" element={<AntibiogramPage />} />
          <Route path="/trend" element={<TrendPage />} />
          <Route path="/wisca" element={<WiscaPage />} />
          <Route path="/real-data" element={<RealDataPage />} />
          <Route
            path="/alerts"
            element={
              <PrivateRoute roles={['ADMIN', 'EPIDEMIOLOGIST']}>
                <AlertsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <PrivateRoute roles={['ADMIN', 'PHARMACIST', 'EPIDEMIOLOGIST']}>
                <InventoryPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/uploads"
            element={
              <PrivateRoute roles={['ADMIN', 'LAB_TECHNICIAN']}>
                <UploadPage />
              </PrivateRoute>
            }
          />
          {/* Datos por aislamiento: solo los roles que el servidor autoriza en GET /isolates/** */}
          <Route
            path="/isolates"
            element={
              <PrivateRoute roles={['ADMIN', 'LAB_TECHNICIAN', 'EPIDEMIOLOGIST']}>
                <IsolatesPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/isolates/new"
            element={
              <PrivateRoute roles={['ADMIN', 'LAB_TECHNICIAN']}>
                <NewIsolatePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/isolates/:id"
            element={
              <PrivateRoute roles={['ADMIN', 'LAB_TECHNICIAN', 'EPIDEMIOLOGIST']}>
                <IsolateDetailPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute roles={['ADMIN']}>
                <UsersPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/antibiotics"
            element={
              <PrivateRoute roles={['ADMIN']}>
                <AntibioticsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/breakpoints"
            element={
              <PrivateRoute roles={['ADMIN']}>
                <BreakpointsPage />
              </PrivateRoute>
            }
          />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/establecimientos/registrar" element={<FacilityRequestPage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
