const ACCESS = 'pms_access_token'
const REFRESH = 'pms_refresh_token'

export function getAccess() {
  return localStorage.getItem(ACCESS)
}

export function getRefresh() {
  return localStorage.getItem(REFRESH)
}

export function setTokens(access, refresh) {
  localStorage.setItem(ACCESS, access)
  localStorage.setItem(REFRESH, refresh)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS)
  localStorage.removeItem(REFRESH)
}

/** @returns {string[]} */
export function rolesFromAccessToken(token) {
  if (!token) return []
  try {
    const part = token.split('.')[1]
    const json = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')))
    const longKey = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
    const raw = json[longKey] ?? json.role ?? json.roles
    if (!raw) return []
    return Array.isArray(raw) ? raw : [raw]
  } catch {
    return []
  }
}
