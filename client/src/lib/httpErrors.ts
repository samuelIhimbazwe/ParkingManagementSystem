import { isAxiosError } from 'axios'

export function extractApiError(error: unknown): string {
  if (!isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Something went wrong'
  }

  const data = error.response?.data as
    | { error?: string; errors?: string[]; message?: string }
    | undefined

  if (data && typeof data === 'object') {
    if (typeof data.error === 'string') return data.error
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors.join(' ')
    }
    if (typeof data.message === 'string') return data.message
  }

  if (error.response?.status === 429) {
    return 'Too many attempts. Please wait a moment and try again.'
  }

  return error.message || 'Request failed'
}
