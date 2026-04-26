import axios from 'axios'
import { tokenStore } from './tokenStore'

const baseURL = import.meta.env.VITE_API_URL ?? ''

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const url = typeof config.url === 'string' ? config.url : ''
  const isPublicAuth =
    url.includes('/api/auth/refresh') ||
    url.includes('/api/auth/login') ||
    url.includes('/api/auth/register') ||
    url.includes('/api/auth/forgot-password')

  if (!isPublicAuth) {
    const token = tokenStore.getAccess()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean }
    if (!original || original._retry) return Promise.reject(error)
    if (error.response?.status !== 401) return Promise.reject(error)
    if (typeof original.url === 'string' && original.url.includes('/api/auth/refresh')) {
      return Promise.reject(error)
    }
    if (typeof original.url === 'string' && original.url.includes('/api/auth/login')) {
      return Promise.reject(error)
    }

    const refresh = tokenStore.getRefresh()
    if (!refresh) {
      tokenStore.clear()
      return Promise.reject(error)
    }

    original._retry = true
    try {
      const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
        `${baseURL}/api/auth/refresh`,
        { refreshToken: refresh },
        { headers: { 'Content-Type': 'application/json' } },
      )
      tokenStore.persist(data.accessToken, data.refreshToken)
      original.headers.Authorization = `Bearer ${data.accessToken}`
      return api(original)
    } catch {
      tokenStore.clear()
      return Promise.reject(error)
    }
  },
)
