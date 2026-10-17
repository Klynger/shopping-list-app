import { Select } from '@base-ui/react/select'
import { useIntl } from 'react-intl'

import { locales, type Locale } from '../i18n/locales.ts'
import { useI18n } from '../i18n/useI18n.ts'

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()
  const { formatMessage } = useIntl()

  return (
    <Select.Root
      items={locales}
      value={locale}
      onValueChange={(next: Locale | null) => {
        if (next) setLocale(next)
      }}
    >
      <Select.Trigger className="select-trigger select-trigger-sm language-trigger" aria-label={formatMessage({ id: 'common.language' })}>
        <GlobeIcon />
        {/* The trigger stays short so it fits a phone header; the menu has full names. */}
        <Select.Value>{(value: Locale) => shortLabels[value]}</Select.Value>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner className="select-positioner" sideOffset={6} align="end" alignItemWithTrigger={false}>
          <Select.Popup className="select-popup">
            <Select.List className="select-list">
              {locales.map((option) => (
                <Select.Item key={option.value} value={option.value} className="select-item">
                  <Select.ItemIndicator className="select-item-indicator">
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                      <path d="m2.5 6.5 2.5 2.5 4.5-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </Select.ItemIndicator>
                  <Select.ItemText>{option.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}

const shortLabels: Record<Locale, string> = {
  en: 'EN',
  'pt-BR': 'PT',
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.75 8h12.5M8 1.75c1.8 1.9 2.6 4 2.6 6.25S9.8 12.35 8 14.25C6.2 12.35 5.4 10.25 5.4 8S6.2 3.65 8 1.75Z" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}
