import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { BooksPage } from './pages/books/BooksPage'
import { AuthorsPage } from './pages/authors/AuthorsPage'
import { CategoriesPage } from './pages/categories/CategoriesPage'
import { MembersPage } from './pages/members/MembersPage'
import { LoansPage } from './pages/loans/LoansPage'
import { ReservationsPage } from './pages/reservations/ReservationsPage'
import { UsersPage } from './pages/users/UsersPage'
import { NotFoundPage } from './pages/errors'
import { AuthInitializer } from './components/AuthInitializer'
import { BookAuthorsPage } from './pages/book-authors/BookAuthorsPage'

export default function App() {
  return (
    <AuthInitializer>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

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
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthInitializer>
  )
}
