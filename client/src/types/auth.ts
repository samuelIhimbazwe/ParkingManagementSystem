export type AuthResponse = {
  accessToken: string
  refreshToken: string
  accessTokenExpiresUtc: string
  tokenType: string
}

export type UserProfile = {
  id: string
  email: string
  fullName: string | null
  roles: string[]
}
