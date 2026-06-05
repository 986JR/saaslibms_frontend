import { create } from 'zustand'

const storedUserKey = 'lms_user'

function readStoredUser() {
  if (typeof window === 'undefined') return null

  try {
    const stored = window.sessionStorage.getItem(storedUserKey)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function storeUser(user) {
  if (typeof window === 'undefined') return

  if (!user) {
    window.sessionStorage.removeItem(storedUserKey)
    return
  }

  window.sessionStorage.setItem(storedUserKey, JSON.stringify(user))
}

export const useAuthStore = create((set, get) => ({
  accessToken: null,
  user: readStoredUser(),
  authChecked: false,
  authLoading: true,

  setAccessToken: (token) => set({ accessToken: token }),

  setUser: (user) => {
    storeUser(user)
    set({ user })
  },

  setAuthChecked: () => set({ authChecked: true, authLoading: false }),

  hydrateSession: (token, user) => {
    const sessionUser = user || get().user
    storeUser(sessionUser)
    set({
      accessToken: token,
      user: sessionUser,
      authChecked: true,
      authLoading: false,
    })
  },

  login: (token, user) => {
    storeUser(user)
    set({
      accessToken: token,
      user,
      authChecked: true,
      authLoading: false,
    })
  },

  logout: () => {
    storeUser(null)
    set({
      accessToken: null,
      user: null,
      authChecked: true,
      authLoading: false,
    })
  },

  isAuthenticated: () => {
    // This is a getter helper - not reactive, use with care
    return !!useAuthStore.getState().accessToken
  },
}))