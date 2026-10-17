import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { ApiError } from '../api/client.ts'
import { messages, type ApiErrorCode, type Locale, type Messages } from './messages.ts'
import { I18nContext } from './useI18n.ts'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const t = messages[locale]

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = t.app.name
  }, [locale, t])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      localStorage.setItem(localeStorageKey, next)
    } catch {
      // Storage can be unavailable (private mode); the choice then lasts for this visit.
    }
  }, [])

  const formatError = useCallback((error: unknown) => translateError(error, t), [t])

  const value = useMemo(() => ({ locale, setLocale, t, formatError }), [locale, setLocale, t, formatError])

  return <I18nContext value={value}>{children}</I18nContext>
}

const localeStorageKey = 'shopping-list.locale'

function initialLocale(): Locale {
  try {
    const stored = localStorage.getItem(localeStorageKey)
    if (stored === 'en' || stored === 'pt-BR') return stored
  } catch {
    // Fall through to the browser's preference.
  }

  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language]
  return preferred.some((language) => language.toLowerCase().startsWith('pt')) ? 'pt-BR' : 'en'
}

/**
 * Maps an API error to a message in the current language. The API's own
 * `detail` text is English only, so the stable `code` drives the translation.
 */
function translateError(error: unknown, t: Messages) {
  if (error instanceof ApiError) {
    // Own keys only, so a code like "constructor" cannot hit Object.prototype.
    if (Object.hasOwn(t.errors.codes, error.code)) return t.errors.codes[error.code as ApiErrorCode]
    if (error.status === 422 || error.status === 400) return t.errors.validation
    return t.errors.generic
  }

  if (error instanceof TypeError) return t.errors.network

  return t.errors.generic
}
