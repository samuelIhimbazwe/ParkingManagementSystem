import axios from 'axios'
import { clearTokens, getAccess, getRefresh, setTokens } from './auth'

const baseURL = import.meta.env.VITE_API_URL ?? ''

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const url = typeof config.url === 'string' ? config.url : ''
  const isPublic =
    url.includes('/api/auth/refresh') ||
    url.includes('/api/auth/login') ||
    url.includes('/api/auth/register') ||
    url.includes('/api/auth/forgot-password')

  if (!isPublic) {
    const t = getAccess()
    if (t) config.headers.Authorization = `Bearer ${t}`
  }
  return config
})

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    if (!original || original._retry) return Promise.reject(error)
    if (error.response?.status !== 401) return Promise.reject(error)
    if (typeof original.url === 'string' && original.url.includes('/api/auth/refresh')) {
      return Promise.reject(error)
    }
    if (typeof original.url === 'string' && original.url.includes('/api/auth/login')) {
      return Promise.reject(error)
    }

    const rt = getRefresh()
    if (!rt) {
      clearTokens()
      return Promise.reject(error)
    }

    original._retry = true
    try {
      const { data } = await axios.post(
        `${baseURL}/api/auth/refresh`,
        { refreshToken: rt },
        { headers: { 'Content-Type': 'application/json' } },
      )
      setTokens(data.accessToken, data.refreshToken)
      original.headers.Authorization = `Bearer ${data.accessToken}`
      return api(original)
    } catch {
      clearTokens()
      return Promise.reject(error)
    }
  },
)

export default api
