const ACCESS_KEY = 'pms_access_token'
const REFRESH_KEY = 'pms_refresh_token'

let accessToken: string | null = null
let refreshToken: string | null = null

function readStorage() {
  accessToken = localStorage.getItem(ACCESS_KEY)
  refreshToken = localStorage.getItem(REFRESH_KEY)
}

readStorage()

export const tokenStore = {
  loadFromStorage() {
    readStorage()
  },

  persist(access: string, refresh: string) {
    accessToken = access
    refreshToken = refresh
    localStorage.setItem(ACCESS_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
  },

  clear() {
    accessToken = null
    refreshToken = null
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },

  getAccess() {
    return accessToken
  },

  getRefresh() {
    return refreshToken
  },
}
