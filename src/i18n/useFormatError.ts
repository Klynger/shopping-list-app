import { useCallback } from 'react'
import { useIntl } from 'react-intl'

import { ApiError } from '../api/client.ts'

/**
 * Returns a function that turns a failed request into a message in the current
 * language. The API's own `detail` text is English only, so the stable `code`
 * picks the message (`error.code.<CODE>` in the locale files).
 */
export function useFormatError() {
  const intl = useIntl()

  return useCallback(
    (error: unknown) => {
      if (error instanceof ApiError) {
        const id = `error.code.${error.code}`
        // Own keys only, so a code like "constructor" cannot hit Object.prototype.
        if (Object.hasOwn(intl.messages, id)) return intl.formatMessage({ id: id as MessageId })
        if (error.status === 422 || error.status === 400) return intl.formatMessage({ id: 'error.validation' })
        return intl.formatMessage({ id: 'error.generic' })
      }

      if (error instanceof TypeError) return intl.formatMessage({ id: 'error.network' })

      return intl.formatMessage({ id: 'error.generic' })
    },
    [intl],
  )
}
