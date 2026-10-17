export type Locale = 'en' | 'pt-BR'

export const fallbackLocale: Locale = 'en'

export const locales: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
]

/**
 * Loads a locale's messages on top of the English ones, so a key missing from
 * a translation still shows English text instead of the raw id.
 */
export async function loadMessages(locale: Locale): Promise<Messages> {
  const candidates = locale === fallbackLocale ? [fallbackLocale] : [fallbackLocale, locale]
  const loaded = await Promise.all(candidates.map(loadLocaleFile))
  // English always loads first and has every key, so the merge is complete.
  return Object.assign({}, ...loaded) as Messages
}

export type Messages = Record<MessageId, string>

// Vite turns each match into its own lazily imported chunk, keyed by path.
const localeModules = import.meta.glob<{ default: Partial<Messages> }>('../locales/*.json')

async function loadLocaleFile(locale: Locale): Promise<Partial<Messages>> {
  const load = localeModules[`../locales/${locale.toLowerCase()}.json`]
  if (!load) return {}
  return (await load()).default
}
