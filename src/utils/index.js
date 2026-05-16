import { clsx } from 'clsx'

// Combine class names
export function cn(...classes) {
  return clsx(...classes)
}

// Extract error message from backend ApiResponse
export function getErrorMessage(error) {
  if (!error) return 'Something went wrong'

  const data = error?.response?.data

  if (!data) return error.message || 'Network error — is the server running?'

  if (data.errors?.length > 0) {
    return data.errors.map((e) => e.message).join(', ')
  }

  return data.message || 'An error occurred'
}

// Format date string to readable form
export function formatDate(dateString) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// Format datetime
export function formatDateTime(dateString) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Status badge color mapping
export const statusColors = {
  // Loan
  BORROWED: 'blue',
  RETURNED: 'green',
  LATE: 'red',
  // Reservation
  PENDING: 'yellow',
  FULFILLED: 'green',
  CANCELLED: 'gray',
  EXPIRED: 'gray',
  // Member
  ACTIVE: 'green',
  BLOCKED: 'red',
  // General
  true: 'green',
  false: 'gray',
}

export function truncate(str, n = 40) {
  if (!str) return ''
  return str.length > n ? str.slice(0, n) + '…' : str
}
