import { createContext, use } from 'react'

import type { Locale, Messages } from './messages.ts'

export type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Messages
  formatError: (error: unknown) => string
}

export function useI18n() {
  const value = use(I18nContext)
  if (!value) {
    throw new Error('useI18n must be used inside I18nProvider')
  }
  return value
}

export const I18nContext = createContext<I18nContextValue | null>(null)
