import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  accessToken: null,
  user: null,
  authChecked: false,
  authLoading: true,

  setAccessToken: (token) => set({ accessToken: token }),

  setUser: (user) => set({ user }),

  setAuthChecked: () => set({ authChecked: true, authLoading: false }),

  hydrateSession: (token, user) =>
    set({
      accessToken: token,
      user,
      authChecked: true,
      authLoading: false,
    }),

  login: (token, user) =>
    set({
      accessToken: token,
      user,
      authChecked: true,
      authLoading: false,
    }),

  logout: () =>
    set({
      accessToken: null,
      user: null,
      authChecked: true,
      authLoading: false,
    }),

  isAuthenticated: () => {
    // This is a getter helper - not reactive, use with care
    return !!useAuthStore.getState().accessToken
  },
}))
