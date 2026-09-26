import { createContext, useContext, useEffect, useState } from 'react'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

// ── Types ──────────────────────────────────────────────────────────────────
export type TextSize = 'default' | 'large' | 'xl'

type AccessibilityState = {
  textSize: TextSize
  setTextSize: (s: TextSize) => void
  highContrast: boolean
  setHighContrast: (v: boolean) => void
  reducedMotion: boolean
  setReducedMotion: (v: boolean) => void
}

// ── Cookie keys + max-age (1 year) ─────────────────────────────────────────
const COOKIE_TEXT_SIZE       = 'a11y-text-size'
const COOKIE_HIGH_CONTRAST   = 'a11y-high-contrast'
const COOKIE_REDUCED_MOTION  = 'a11y-reduced-motion'
const MAX_AGE = 60 * 60 * 24 * 365

// ── HTML class helpers ─────────────────────────────────────────────────────
function applyTextSize(size: TextSize) {
  const root = document.documentElement
  root.classList.remove('text-size-large', 'text-size-xl')
  if (size === 'large') root.classList.add('text-size-large')
  if (size === 'xl')    root.classList.add('text-size-xl')
}

function applyHighContrast(enabled: boolean) {
  document.documentElement.classList.toggle('high-contrast', enabled)
}

function applyReducedMotion(enabled: boolean) {
  document.documentElement.classList.toggle('reduce-motion', enabled)
}

// ── Context ────────────────────────────────────────────────────────────────
const AccessibilityContext = createContext<AccessibilityState | null>(null)

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [textSize, _setTextSize] = useState<TextSize>(() => {
    const saved = getCookie(COOKIE_TEXT_SIZE) as TextSize | undefined
    return saved === 'large' || saved === 'xl' ? saved : 'default'
  })

  const [highContrast, _setHighContrast] = useState<boolean>(() => {
    return getCookie(COOKIE_HIGH_CONTRAST) === 'true'
  })

  const [reducedMotion, _setReducedMotion] = useState<boolean>(() => {
    // Cookie overrides, otherwise respect OS preference
    const saved = getCookie(COOKIE_REDUCED_MOTION)
    if (saved === 'true')  return true
    if (saved === 'false') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  // Apply classes on mount + whenever state changes
  useEffect(() => { applyTextSize(textSize)         }, [textSize])
  useEffect(() => { applyHighContrast(highContrast) }, [highContrast])
  useEffect(() => { applyReducedMotion(reducedMotion) }, [reducedMotion])

  const setTextSize = (s: TextSize) => {
    if (s === 'default') removeCookie(COOKIE_TEXT_SIZE)
    else setCookie(COOKIE_TEXT_SIZE, s, MAX_AGE)
    _setTextSize(s)
  }

  const setHighContrast = (v: boolean) => {
    setCookie(COOKIE_HIGH_CONTRAST, String(v), MAX_AGE)
    _setHighContrast(v)
  }

  const setReducedMotion = (v: boolean) => {
    setCookie(COOKIE_REDUCED_MOTION, String(v), MAX_AGE)
    _setReducedMotion(v)
  }

  return (
    <AccessibilityContext
      value={{ textSize, setTextSize, highContrast, setHighContrast, reducedMotion, setReducedMotion }}
    >
      {children}
    </AccessibilityContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAccessibility() {
  const ctx = useContext(AccessibilityContext)
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider')
  return ctx
}
