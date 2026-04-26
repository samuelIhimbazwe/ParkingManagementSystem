import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../lib/api'
import { tokenStore } from '../lib/tokenStore'
import type { AuthResponse, UserProfile } from '../types/auth'

type AuthContextValue = {
  user: UserProfile | null
  bootstrapped: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: { email: string; password: string; fullName?: string }) => Promise<void>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<{ message: string }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [bootstrapped, setBootstrapped] = useState(false)

  const fetchProfile = useCallback(async () => {
    const { data } = await api.get<UserProfile>('/api/auth/me')
    setUser(data)
  }, [])

  const bootstrap = useCallback(async () => {
    tokenStore.loadFromStorage()
    const access = tokenStore.getAccess()
    const refresh = tokenStore.getRefresh()
    try {
      if (access) {
        await fetchProfile()
      } else if (refresh) {
        const { data } = await api.post<AuthResponse>('/api/auth/refresh', {
          refreshToken: refresh,
        })
        tokenStore.persist(data.accessToken, data.refreshToken)
        await fetchProfile()
      }
    } catch {
      tokenStore.clear()
      setUser(null)
    } finally {
      setBootstrapped(true)
    }
  }, [fetchProfile])

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<AuthResponse>('/api/auth/login', { email, password })
      tokenStore.persist(data.accessToken, data.refreshToken)
      await fetchProfile()
    },
    [fetchProfile],
  )

  const register = useCallback(
    async (payload: { email: string; password: string; fullName?: string }) => {
      const { data } = await api.post<AuthResponse>('/api/auth/register', {
        email: payload.email,
        password: payload.password,
        fullName: payload.fullName?.trim() || null,
      })
      tokenStore.persist(data.accessToken, data.refreshToken)
      await fetchProfile()
    },
    [fetchProfile],
  )

  const logout = useCallback(async () => {
    const refresh = tokenStore.getRefresh()
    try {
      if (refresh) {
        await api.post('/api/auth/logout', { refreshToken: refresh })
      }
    } catch {
      // ignore network errors; still clear session locally
    }
    tokenStore.clear()
    setUser(null)
  }, [])

  const forgotPassword = useCallback(async (email: string) => {
    const { data } = await api.post<{ message: string }>('/api/auth/forgot-password', { email })
    return data
  }, [])

  const refreshProfile = useCallback(async () => {
    await fetchProfile()
  }, [fetchProfile])

  const value = useMemo(
    () => ({
      user,
      bootstrapped,
      login,
      register,
      logout,
      forgotPassword,
      refreshProfile,
    }),
    [user, bootstrapped, login, register, logout, forgotPassword, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
