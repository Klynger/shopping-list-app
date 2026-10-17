import { createContext, use } from 'react'

import type { Locale } from './locales.ts'

export type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
}

/**
 * The current language and a way to change it. Text itself comes from
 * react-intl's `useIntl().formatMessage`.
 */
export function useI18n() {
  const value = use(I18nContext)
  if (!value) {
    throw new Error('useI18n must be used inside I18nProvider')
  }
  return value
}

export const I18nContext = createContext<I18nContextValue | null>(null)
