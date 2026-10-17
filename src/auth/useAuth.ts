import { createContext, use } from 'react'

import type * as api from '../api/endpoints.ts'

export type AuthStatus = 'checking' | 'authenticated' | 'anonymous' | 'unreachable'

export type AuthContextValue = {
  status: AuthStatus
  /**
   * True when the session ended on its own (a 401), as opposed to the user
   * logging out. Only then is returning to the previous page useful.
   */
  sessionExpired: boolean
  username: string | null
  login: (form: api.LoginForm) => Promise<void>
  logout: () => Promise<void>
  recheck: () => void
}

export function useAuth() {
  const value = use(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return value
}

export const AuthContext = createContext<AuthContextValue | null>(null)
