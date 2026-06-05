import { useEffect } from 'react'
import { refreshAccessToken } from '../api'
import { useAuthStore } from '../store/authStore'
import { buildUserFromAccessToken } from '../utils'

let authInitPromise = null

export function AuthInitializer({ children }) {
  const accessToken = useAuthStore((state) => state.accessToken)
  const user = useAuthStore((state) => state.user)
  const hydrateSession = useAuthStore((state) => state.hydrateSession)
  const logout = useAuthStore((state) => state.logout)
  const setAuthChecked = useAuthStore((state) => state.setAuthChecked)

  useEffect(() => {
    let cancelled = false

    async function initializeAuth() {
      if (accessToken) {
        setAuthChecked()
        return
      }

      try {
        authInitPromise = authInitPromise || refreshAccessToken()
        const token = await authInitPromise
        if (cancelled) return

        hydrateSession(token, user || buildUserFromAccessToken(token))
      } catch {
        if (!cancelled) logout()
      } finally {
        authInitPromise = null
        if (!cancelled) setAuthChecked()
      }
    }

    initializeAuth()

    return () => {
      cancelled = true
    }
  }, [accessToken, user, hydrateSession, logout, setAuthChecked])

  return children
}
