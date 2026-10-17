import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { IntlProvider, useIntl } from 'react-intl'

import { fallbackLocale, loadMessages, type Locale, type Messages } from './locales.ts'
import { I18nContext } from './useI18n.ts'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const [loaded, setLoaded] = useState<{ locale: Locale; messages: Messages } | null>(null)

  useEffect(() => {
    let cancelled = false
    void loadMessages(locale).then((messages) => {
      if (!cancelled) setLoaded({ locale, messages })
    })
    return () => {
      cancelled = true
    }
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      localStorage.setItem(localeStorageKey, next)
    } catch {
      // Storage can be unavailable (private mode); the choice then lasts for this visit.
    }
  }, [])

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale])

  // Nothing renders until the first locale file arrives. When switching, the
  // previous language stays on screen until the new one has loaded.
  if (!loaded) return null

  return (
    <I18nContext value={value}>
      <IntlProvider locale={loaded.locale} defaultLocale={fallbackLocale} messages={loaded.messages}>
        <DocumentLanguage />
        {children}
      </IntlProvider>
    </I18nContext>
  )
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

function DocumentLanguage() {
  const intl = useIntl()

  useEffect(() => {
    document.documentElement.lang = intl.locale
    document.title = intl.formatMessage({ id: 'app.name' })
  }, [intl])

  return null
}
