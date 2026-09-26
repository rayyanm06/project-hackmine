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
      className={`relative w-full min-h-screen bg-[#faf8f4] ${
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
        <div className="relative w-full min-h-screen flex items-center justify-center p-4">
          {/* Background image during auth with soft, bright daylight blur */}
          <div className="absolute inset-0 pointer-events-none">
            <img
              src="/images/resort-day-hero.jpg"
              alt="Smart Resort 360"
              className="w-full h-full object-cover object-center filter brightness-[1.0] contrast-[0.98] blur-[2px]"
            />
            <div className="absolute inset-0 bg-[#faf8f4]/65 backdrop-blur-[3px]" />
          </div>

          {/* Authentication Card (centered, descends downward when isCardExiting is true) */}
          <div className="relative z-10 w-full flex items-center justify-center">
            <ResortAuthCard
              onSuccess={handleAuthSuccess}
              isExitingDown={isCardExiting}
            />
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
