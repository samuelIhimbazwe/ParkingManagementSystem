import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api'
import { clearTokens, getAccess, getRefresh, setTokens } from '../auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    const at = getAccess()
    if (!at) {
      setProfile(null)
      return
    }
    const { data } = await api.get('/api/auth/me')
    setProfile(data)
  }, [])

  const bootstrap = useCallback(async () => {
    setLoading(true)
    try {
      const at = getAccess()
      const rt = getRefresh()
      if (!at && rt) {
        const { data } = await api.post('/api/auth/refresh', { refreshToken: rt })
        setTokens(data.accessToken, data.refreshToken)
      }
      if (getAccess()) await loadProfile()
      else setProfile(null)
    } catch {
      clearTokens()
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [loadProfile])

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/api/auth/login', { email, password })
      setTokens(data.accessToken, data.refreshToken)
      await loadProfile()
    },
    [loadProfile],
  )

  const register = useCallback(
    async ({ email, password, fullName }) => {
      const { data } = await api.post('/api/auth/register', {
        email,
        password,
        fullName: fullName?.trim() || null,
      })
      setTokens(data.accessToken, data.refreshToken)
      await loadProfile()
    },
    [loadProfile],
  )

  const logout = useCallback(async () => {
    const rt = getRefresh()
    try {
      if (rt) await api.post('/api/auth/logout', { refreshToken: rt })
    } catch {
      /* ignore */
    }
    clearTokens()
    setProfile(null)
  }, [])

  const value = useMemo(
    () => ({
      profile,
      loading,
      login,
      register,
      logout,
      refreshProfile: loadProfile,
    }),
    [profile, loading, login, register, logout, loadProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
