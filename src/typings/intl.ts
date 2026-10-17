import type localesEn from '../locales/en.json'
import type localesPtBR from '../locales/pt-br.json'

// Message ids are checked against the English file, so a typo fails the build.
declare global {
  type MessageId = keyof typeof localesEn

  namespace FormatjsIntl {
    interface Message {
      ids: MessageId
    }
  }
}

/**
 * These fail to compile when the Portuguese file is missing a key that English
 * has, or has a key English does not.
 */
export type PtBRHasEveryEnglishKey = Expect<Equal<Exclude<keyof typeof localesEn, keyof typeof localesPtBR>, never>>

export type PtBRHasNoExtraKeys = Expect<Equal<Exclude<keyof typeof localesPtBR, keyof typeof localesEn>, never>>

type Expect<T extends true> = T

type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
