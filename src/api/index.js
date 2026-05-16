import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const BASE_URL = '/api/v1'

// Main API instance
export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // needed for HttpOnly refresh cookie
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 — silently refresh, then retry original request
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    // If 401 and we haven't already retried
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // Queue the request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`
            return api(original)
          })
          .catch((err) => Promise.reject(err))
      }

      original._retry = true
      isRefreshing = true

      try {
        // Refresh using HttpOnly cookie (no body needed)
        const res = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        const newToken = res.data.data.accessToken
        useAuthStore.getState().setAccessToken(newToken)
        processQueue(null, newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  registerInstitution: (data) =>
    api.post('/auth/institution/register', data),
  verifyInstitution: (data) =>
    api.post('/auth/institution/verify', data),
  setupAdmin: (data) =>
    api.post('/auth/institution/setup-admin', data),
  login: (data) =>
    api.post('/auth/login', data),
  logout: () =>
    api.post('/auth/logout'),
  refresh: () =>
    api.post('/auth/refresh'),
}

// ─── Users ───────────────────────────────────────────────────────────────────
export const usersApi = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
}

// ─── Books ───────────────────────────────────────────────────────────────────
export const booksApi = {
  list: (params) => api.get('/books', { params }),
  get: (id) => api.get(`/books/${id}`),
  create: (data) => api.post('/books', data),
  update: (id, data) => api.patch(`/books/${id}`, data),
  delete: (id) => api.delete(`/books/${id}`),
}

// ─── Authors ─────────────────────────────────────────────────────────────────
export const authorsApi = {
  list: (params) => api.get('/authors', { params }),
  get: (id) => api.get(`/authors/${id}`),
  create: (data) => api.post('/authors', data),
  update: (id, data) => api.patch(`/authors/${id}`, data),
  delete: (id) => api.delete(`/authors/${id}`),
}

// ─── Book-Authors ─────────────────────────────────────────────────────────────
export const bookAuthorsApi = {
  getByBook: (bookId) => api.get(`/book-authors/book/${bookId}`),
  getByAuthor: (authorId) => api.get(`/book-authors/author/${authorId}`),
  link: (data) => api.post('/book-authors', data),
  update: (id, data) => api.patch(`/book-authors/${id}`, data),
  unlink: (id) => api.delete(`/book-authors/${id}`),
}

// ─── Categories ───────────────────────────────────────────────────────────────
export const categoriesApi = {
  list: (params) => api.get('/categories', { params }),
  get: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.patch(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
}

// ─── Members ──────────────────────────────────────────────────────────────────
export const membersApi = {
  list: (params) => api.get('/members', { params }),
  get: (id) => api.get(`/members/${id}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.patch(`/members/${id}`, data),
  updateStatus: (id, data) => api.patch(`/members/${id}/status`, data),
  delete: (id) => api.delete(`/members/${id}`),
}

// ─── Loans ────────────────────────────────────────────────────────────────────
export const loansApi = {
  list: (params) => api.get('/loans', { params }),
  get: (id) => api.get(`/loans/${id}`),
  create: (data) => api.post('/loans', data),
  return: (id, data) => api.patch(`/loans/${id}/return`, data),
  archive: (id) => api.patch(`/loans/${id}/archive`),
  getMemberActive: (memberId) =>
    api.get(`/loans/member/${memberId}/active`),
}

// ─── Reservations ─────────────────────────────────────────────────────────────
export const reservationsApi = {
  list: (params) => api.get('/reservations', { params }),
  get: (id) => api.get(`/reservations/${id}`),
  create: (data) => api.post('/reservations', data),
  cancel: (id) => api.patch(`/reservations/${id}/cancel`),
}
