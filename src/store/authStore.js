import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  accessToken: null,
  user: null,

  setAccessToken: (token) => set({ accessToken: token }),

  setUser: (user) => set({ user }),

  login: (token, user) => set({ accessToken: token, user }),

  logout: () => set({ accessToken: null, user: null }),

  isAuthenticated: () => {
    // This is a getter helper — not reactive, use with care
    return !!useAuthStore.getState().accessToken
  },
}))
