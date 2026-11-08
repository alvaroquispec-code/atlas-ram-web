import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import FullPageLoader from '../components/FullPageLoader'
import PrivateRoute from '../components/PrivateRoute'
import AppLayout from '../layouts/AppLayout'
import AuthLayout from '../layouts/AuthLayout'

const LoginPage = lazy(() => import('../pages/LoginPage'))
const RegisterPage = lazy(() => import('../pages/RegisterPage'))
const DashboardPage = lazy(() => import('../pages/DashboardPage'))
const IsolatesPage = lazy(() => import('../pages/IsolatesPage'))
const IsolateDetailPage = lazy(() => import('../pages/IsolateDetailPage'))
const ForbiddenPage = lazy(() => import('../pages/ForbiddenPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

export default function AppRouter() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
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
          <Route path="/isolates" element={<IsolatesPage />} />
          <Route path="/isolates/:id" element={<IsolateDetailPage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}