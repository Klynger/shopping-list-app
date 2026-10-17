import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { ApiError, setUnauthorizedHandler } from '../api/client.ts'
import * as api from '../api/endpoints.ts'
import { AuthContext, type AuthStatus } from './useAuth.ts'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AuthStatus>('checking')
  const [username, setUsername] = useState(readStoredUsername)
  const [checkCount, setCheckCount] = useState(0)
  const [sessionExpired, setSessionExpired] = useState(false)

  const endSession = useCallback((reason: 'expired' | 'logout') => {
    setSessionExpired(reason === 'expired')
    setStatus('anonymous')
    storeUsername(null)
    setUsername(null)
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    setUnauthorizedHandler(() => endSession('expired'))
    return () => setUnauthorizedHandler(null)
  }, [endSession])

  // The API has no "who am I" endpoint, so a cheap authenticated read doubles as
  // the session probe (and warms the groups cache for the home page).
  useEffect(() => {
    let cancelled = false

    // Called outside the query cache on purpose: a 401 runs endSession, which
    // clears the cache and would cancel a cached query mid-flight.
    api
      .listGroups()
      .then((groups) => {
        if (cancelled) return
        queryClient.setQueryData(api.queryKeys.groups, groups)
        setStatus('authenticated')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        // Only a 401 means "not logged in". With the API down, the dev proxy
        // answers 502, and a 5xx is a server fault; neither should log anyone out.
        setStatus(error instanceof ApiError && error.status === 401 ? 'anonymous' : 'unreachable')
      })

    return () => {
      cancelled = true
    }
  }, [queryClient, checkCount])

  const login = useCallback(
    async (form: api.LoginForm) => {
      const response = await api.login(form)
      queryClient.clear()
      storeUsername(response.username)
      setUsername(response.username)
      setSessionExpired(false)
      setStatus('authenticated')
    },
    [queryClient],
  )

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } finally {
      endSession('logout')
    }
  }, [endSession])

  const recheck = useCallback(() => {
    setStatus('checking')
    setCheckCount((count) => count + 1)
  }, [])

  const value = useMemo(
    () => ({ status, sessionExpired, username, login, logout, recheck }),
    [status, sessionExpired, username, login, logout, recheck],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

const usernameStorageKey = 'shopping-list.username'

function readStoredUsername() {
  try {
    return localStorage.getItem(usernameStorageKey)
  } catch {
    return null
  }
}

function storeUsername(username: string | null) {
  try {
    if (username) {
      localStorage.setItem(usernameStorageKey, username)
    } else {
      localStorage.removeItem(usernameStorageKey)
    }
  } catch {
    // Storage can be unavailable (private mode); the name is only a display nicety.
  }
}
