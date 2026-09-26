import { createContext, useContext, useEffect, useState } from 'react'
import { getCookie, setCookie } from '@/lib/cookies'
import {
  type LangCode,
  type TranslationKey,
  LANGUAGES,
  translations,
} from './translations'

const LANG_COOKIE = 'sr360-lang'
const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

/** Detect browser/system language and map to a supported LangCode. */
function detectBrowserLang(): LangCode {
  const supported = Object.keys(LANGUAGES) as LangCode[]
  const browserLangs = navigator.languages ?? [navigator.language]
  for (const lang of browserLangs) {
    const base = lang.split('-')[0].toLowerCase() as LangCode
    if (supported.includes(base)) return base
  }
  return 'en'
}

type I18nContextType = {
  lang: LangCode
  setLang: (lang: LangCode) => void
  t: (key: TranslationKey) => string
  languages: typeof LANGUAGES
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, _setLang] = useState<LangCode>(() => {
    const saved = getCookie(LANG_COOKIE) as LangCode | undefined
    if (saved && saved in LANGUAGES) return saved
    return detectBrowserLang()
  })

  // Apply dir attribute for RTL languages (none of our 10 are RTL,
  // but wiring it correctly for future-proofing)
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = (newLang: LangCode) => {
    setCookie(LANG_COOKIE, newLang, LANG_COOKIE_MAX_AGE)
    _setLang(newLang)
  }

  const t = (key: TranslationKey): string => {
    const dict = translations[lang]
    return dict?.[key] ?? translations['en'][key] ?? key
  }

  return (
    <I18nContext value={{ lang, setLang, t, languages: LANGUAGES }}>
      {children}
    </I18nContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
