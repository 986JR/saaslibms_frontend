import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { RegisterSuccessPage } from './pages/auth/RegisterSuccessPage'
import { SetupAdminPage } from './pages/auth/SetupAdminPage'
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { BooksPage } from './pages/books/BooksPage'
import { AuthorsPage } from './pages/authors/AuthorsPage'
import { CategoriesPage } from './pages/categories/CategoriesPage'
import { MembersPage } from './pages/members/MembersPage'
import { LoansPage } from './pages/loans/LoansPage'
import { ReservationsPage } from './pages/reservations/ReservationsPage'
import { UsersPage } from './pages/users/UsersPage'
import { AuditLogsPage } from './pages/audit-logs/AuditLogsPage'
import { SystemInstitutionsPage } from './pages/system/SystemInstitutionsPage'
import { SystemUsersPage } from './pages/system/SystemUsersPage'
import { NotFoundPage } from './pages/errors'
import { AuthInitializer } from './components/AuthInitializer'
import { BookAuthorsPage } from './pages/book-authors/BookAuthorsPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { ResetPasswordPage }  from './pages/auth/ResetPasswordPage'
import { AnalyticsPage } from './pages/analytics/AnalyticsPage'
import { useAuthStore } from './store/authStore'

function RequireSystem({ children }) {
  const { user } = useAuthStore()

  if (user?.role !== 'SYSTEM') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default function App() {
  return (
    <AuthInitializer>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/success" element={<RegisterSuccessPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/setup-admin" element={<SetupAdminPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Dashboard */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/books" element={<BooksPage />} />
            <Route path="/authors" element={<AuthorsPage />} />
            <Route path="/book-authors" element={<BookAuthorsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/loans" element={<LoansPage />} />
            <Route path="/reservations" element={<ReservationsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/analytics" element={<RequireSystem><AnalyticsPage /></RequireSystem>} />
            <Route path="/system/institutions" element={<SystemInstitutionsPage />} />
            <Route path="/system/users" element={<SystemUsersPage />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes> 
      </BrowserRouter>
    </AuthInitializer>
  )
}
