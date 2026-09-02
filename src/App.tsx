import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { TrucksPage } from './pages/trucks/TrucksPage'
import { TruckDetailPage } from './pages/trucks/TruckDetailPage'
import { DriversPage } from './pages/drivers/DriversPage'
import { TripsPage } from './pages/trips/TripsPage'
import { ChecklistsPage } from './pages/checklists/ChecklistsPage'
import { ChecklistWizard } from './pages/checklists/ChecklistWizard'
import { OccurrencesPage } from './pages/occurrences/OccurrencesPage'
import { MaintenancePage } from './pages/maintenance/MaintenancePage'
import { HistoryPage } from './pages/history/HistoryPage'
import { ReportsPage } from './pages/reports/ReportsPage'
import { SettingsPage } from './pages/settings/SettingsPage'

function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 text-6xl">🔒</div>
      <h2 className="text-xl font-bold text-slate-800">Acesso não autorizado</h2>
      <p className="mt-2 text-sm text-slate-500">
        Você não tem permissão para acessar esta página.
      </p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected — app layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="trucks" element={<TrucksPage />} />
            <Route path="trucks/:id" element={<TruckDetailPage />} />
            <Route path="drivers" element={<DriversPage />} />
            <Route path="drivers/:id" element={<DriversPage />} />
            <Route path="trips" element={<TripsPage />} />
            <Route path="trips/:id" element={<TripsPage />} />
            <Route path="checklists" element={<ChecklistsPage />} />
            <Route path="checklists/new" element={<ChecklistWizard />} />
            <Route path="checklists/:id" element={<ChecklistsPage />} />
            <Route path="occurrences" element={<OccurrencesPage />} />
            <Route path="maintenance" element={<MaintenancePage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="reports" element={
              <ProtectedRoute requiredRoles={['admin']}><ReportsPage /></ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute requiredRoles={['admin']}><SettingsPage /></ProtectedRoute>
            } />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
