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
  const [exitPhase, setExitPhase] = useState<'idle' | 'card-to-center' | 'center-hold' | 'sliding-down'>('idle')

  // When user clicks "ENTER RESORT" on the Landing page
  const handleStartAuth = useCallback(() => {
    setView('login')
  }, [])

  // Post-Login Timeline:
  // 1. Login card moves from right to center (passes in front of left text, hiding it behind card)
  // 2. Card holds briefly in the center (0.35s)
  // 3. Card slides straight down off the screen
  // 4. Closed resort doors appear and hold for 1.6s before physical hinged opening
  const handleAuthSuccess = useCallback((_user: AuthUser) => {
    // Stage 1: Login card glides to center, covering the left text
    setExitPhase('card-to-center')

    // Stage 2: Center hold (settles briefly in the center)
    setTimeout(() => {
      setExitPhase('center-hold')
    }, 800)

    // Stage 3: Login card slides straight down off the screen
    setTimeout(() => {
      setExitPhase('sliding-down')
    }, 1150)

    // Stage 4: Closed resort doors appear and hold
    setTimeout(() => {
      setIsTransitionActive(true)
    }, 1750)
  }, [])

  const isTransitioning = exitPhase !== 'idle' || isTransitionActive

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
          {/* Background image during auth with luxury reception interior */}
          <div className="fixed inset-0 pointer-events-none z-0">
            <img
              src="/images/resort-reception.png"
              alt="Smart Resort 360 Reception"
              className="w-full h-full object-cover object-center filter brightness-[0.96] contrast-[1.03]"
            />
            {/* Subtle atmospheric vignette preserving the luxury reception architecture & warm lighting */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/25" />
          </div>

          {/* Main Layout: Left branding + Right glass card */}
          <div className="relative z-10 w-full min-h-screen flex flex-col lg:flex-row items-center justify-between px-6 sm:px-10 lg:pl-[8vw] lg:pr-[8vw] py-10 lg:py-8 max-w-[1600px] mx-auto gap-10 lg:gap-12">
            {/* ── LEFT SIDE: Large statement text (stays in place, disappears BEHIND the moving card) ── */}
            <div
              className={`w-full lg:max-w-[560px] xl:max-w-[620px] flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 z-10 ${
                exitPhase === 'idle' ? 'animate-login-left-slide' : ''
              }`}
              style={{
                clipPath: exitPhase === 'idle' ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)',
                transition: 'clip-path 750ms cubic-bezier(0.25, 1, 0.5, 1)',
              }}
            >
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#2D8CFF] shadow-[0_0_8px_#2D8CFF]" />
                <span className="text-[12px] sm:text-[14px] font-bold tracking-[0.24em] text-[#2D8CFF] uppercase font-sans">
                  Smart Resort 360
                </span>
              </div>

              {/* Main Heading (56–70px, bold, tight line-height, adapted to luxury reception) */}
              <h1 className="text-5xl sm:text-6xl lg:text-[64px] xl:text-[70px] font-extrabold tracking-tight leading-[0.98] lg:leading-[1.0]">
                <span className="text-[#FDFBF7] drop-shadow-[0_2px_14px_rgba(0,0,0,0.6)]">Your stay.</span><br />
                <span className="text-[#2D8CFF] drop-shadow-[0_2px_16px_rgba(45,140,255,0.4)]">Reimagined.</span>
              </h1>

              {/* Supporting Text (18–20px) */}
              <p className="text-[#E2E8F0] text-[18px] lg:text-[20px] font-medium leading-relaxed max-w-lg drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]">
                Seamless guest experiences, smarter resort operations.
              </p>

              {/* Decorative Luxury Divider & Pillars */}
              <div className="pt-2 flex flex-col items-center lg:items-start space-y-3.5">
                <div className="h-[2.5px] w-20 bg-[#2D8CFF] rounded-full shadow-[0_0_10px_rgba(45,140,255,0.6)]" />
                <div className="text-[12px] sm:text-[13px] font-semibold tracking-[0.16em] text-[#CBD5E1] uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
                  Guest Experience • Operations • Intelligence
                </div>
              </div>
            </div>

            {/* ── RIGHT SIDE: The Main Moving Object (Moves to center, covers left text, slides down) ── */}
            <div
              className={`w-full lg:w-auto flex justify-center lg:justify-end shrink-0 z-30 ${
                exitPhase === 'idle'
                  ? 'animate-login-right-slide'
                  : exitPhase === 'card-to-center' || exitPhase === 'center-hold'
                  ? 'translate-x-0 lg:-translate-x-[calc(42vw-260px)] translate-y-0 transition-transform duration-800 ease-[cubic-bezier(0.25,1,0.5,1)]'
                  : 'translate-x-0 lg:-translate-x-[calc(42vw-260px)] translate-y-[125vh] transition-transform duration-800 ease-[cubic-bezier(0.4,0,0.2,1)]'
              }`}
            >
              <ResortAuthCard
                onSuccess={handleAuthSuccess}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── View 3: Cinematic Daytime Transition (Resort Doors Reveal & Open) */}
      <ResortTransition
        active={isTransitionActive}
        onComplete={() => {
          onEntered()
        }}
      />
    </div>
  )
}
