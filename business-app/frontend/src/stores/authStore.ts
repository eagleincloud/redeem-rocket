import { create } from 'zustand'
import { User, AuthTokens } from '../types'

interface AuthStore {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  setUser: (user: User | null) => void
  setTokens: (tokens: AuthTokens | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
  clearError: () => void
  loadFromStorage: () => void
  saveToStorage: () => void
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setTokens: (tokens) => set({ tokens }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      // API call will be implemented
      const response = await fetch('/api/v1/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) throw new Error('Login failed')

      const data = await response.json()
      set({
        tokens: data.tokens,
        user: data.user,
        isAuthenticated: true,
        error: null,
      })
      get().saveToStorage()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      set({ error: errorMessage, isLoading: false })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/v1/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Registration failed')

      const result = await response.json()
      set({
        tokens: result.tokens,
        user: result.user,
        isAuthenticated: true,
        error: null,
      })
      get().saveToStorage()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'
      set({ error: errorMessage, isLoading: false })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  logout: () => {
    set({ user: null, tokens: null, isAuthenticated: false, error: null })
    localStorage.removeItem('auth_store')
  },

  saveToStorage: () => {
    const state = get()
    localStorage.setItem('auth_store', JSON.stringify({
      user: state.user,
      tokens: state.tokens,
    }))
  },

  loadFromStorage: () => {
    const stored = localStorage.getItem('auth_store')
    if (stored) {
      try {
        const { user, tokens } = JSON.parse(stored)
        set({ user, tokens, isAuthenticated: !!user })
      } catch (error) {
        console.error('Failed to load auth from storage:', error)
      }
    }
  },
}))
