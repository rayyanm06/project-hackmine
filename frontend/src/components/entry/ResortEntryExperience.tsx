import { useState, useCallback } from 'react'
import { ResortLanding } from './ResortLanding'
import { ResortAuthCard } from './ResortAuthCard'
import { ResortTransition } from './ResortTransition'
import { CustomCursor } from './CustomCursor'
import { type AuthUser } from '@/lib/auth'

interface ResortEntryExperienceProps {
  initialView?: 'landing' | 'login'
  onEntered: () => void
}

export function ResortEntryExperience({
  initialView = 'landing',
  onEntered,
}: ResortEntryExperienceProps) {
  const [view, setView] = useState<'landing' | 'login'>(initialView)
  const [isTransitionActive, setIsTransitionActive] = useState(false)
  const [isCardExiting, setIsCardExiting] = useState(false)
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthUser | null>(null)

  // When user clicks "ENTER RESORT" on the Landing page
  const handleStartAuth = useCallback(() => {
    setView('login')
  }, [])

  // When user completes authentication on the Auth Card
  const handleAuthSuccess = useCallback((user: AuthUser) => {
    setAuthenticatedUser(user)
    setIsCardExiting(true)

    // After card begins descending, trigger the full-screen grand double-doors transition
    setTimeout(() => {
      setIsTransitionActive(true)
    }, 450)
  }, [])

  const isTransitioning = isCardExiting || isTransitionActive

  return (
    <div
      className={`relative w-full min-h-screen bg-[#FAF9F6] ${
        view === 'landing' && !isTransitioning ? 'overflow-y-auto' : 'overflow-hidden select-none'
      }`}
    >
      {/* Refined Custom Cursor active only during entry experience before door transition */}
      <CustomCursor active={!isTransitionActive} />

      {/* ── View 1: Daytime Landing Page ────────────────────────── */}
      {view === 'landing' && !isTransitioning && (
        <ResortLanding onEnter={handleStartAuth} />
      )}

      {/* ── View 2: Daytime Authentication Page ─────────────────── */}
      {(view === 'login' || isTransitioning) && (
        <div className="relative w-full min-h-screen flex items-center justify-center overflow-x-hidden overflow-y-auto">
          {/* Background image during auth with soft, bright daylight */}
          <div className="fixed inset-0 pointer-events-none z-0">
            <img
              src="/images/resort-day-hero.jpg"
              alt="Smart Resort 360"
              className="w-full h-full object-cover object-center filter brightness-[1.03] contrast-[1.01]"
            />
            {/* Gentle daylight resort atmospheric tint */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/45 to-sky-950/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-white/35" />
          </div>

          {/* Main Layout: Left branding + Right glass card (~60-70% horizontal position) */}
          <div className="relative z-10 w-full min-h-screen flex flex-col lg:flex-row items-center justify-between px-6 sm:px-10 lg:pl-[8vw] lg:pr-[10vw] py-10 lg:py-8 max-w-[1600px] mx-auto gap-10 lg:gap-12">
            {/* ── LEFT SIDE: Elegant Luxury Resort Branding (Supporting Content) ── */}
            <div
              className={`w-full lg:max-w-[480px] xl:max-w-[540px] flex flex-col items-center lg:items-start text-center lg:text-left space-y-5 transition-all duration-500 ${
                isCardExiting ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'
              }`}
            >
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/55 backdrop-blur-md border border-white/70 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4A89AC]" />
                <span className="text-[12px] sm:text-[13px] font-semibold tracking-[0.24em] text-[#3B7A9E] uppercase font-sans">
                  Smart Resort 360
                </span>
              </div>

              {/* Main Heading */}
              <h1 className="text-3xl sm:text-4xl lg:text-[44px] xl:text-[48px] font-bold text-[#172B3A] tracking-tight leading-[1.15]">
                Your stay.<br />
                <span className="text-[#3B7A9E]">Reimagined.</span>
              </h1>

              {/* Supporting Text */}
              <p className="text-[#3E5C70] text-[15px] sm:text-[16px] lg:text-[17px] font-medium leading-relaxed max-w-md">
                Seamless guest experiences, smarter resort operations.
              </p>

              {/* Decorative Luxury Divider & Pillars */}
              <div className="pt-2 flex flex-col items-center lg:items-start space-y-3">
                <div className="h-[1.5px] w-16 bg-[#A9D2E8]/80 rounded-full" />
                <div className="text-[12px] sm:text-[13px] font-semibold tracking-[0.16em] text-[#5D7F92] uppercase">
                  Guest Experience • Operations • Intelligence
                </div>
              </div>
            </div>

            {/* ── RIGHT SIDE: Frosted Architectural Glass Login Card ── */}
            <div className="w-full lg:w-auto flex justify-center lg:justify-end shrink-0">
              <ResortAuthCard
                onSuccess={handleAuthSuccess}
                isExitingDown={isCardExiting}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── View 3: Cinematic Daytime Transition (Resort Doors Reveal & Open) */}
      <ResortTransition
        active={isTransitionActive}
        userRole={authenticatedUser?.role}
        userName={authenticatedUser?.displayName}
        onComplete={() => {
          onEntered()
        }}
      />
    </div>
  )
}
