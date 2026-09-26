import { useEffect, useRef } from 'react'
import gsap from 'gsap'

interface ResortTransitionProps {
  active: boolean
  userRole?: string
  userName?: string
  onComplete: () => void
}

export function ResortTransition({
  active,
  userRole = 'Guest',
  userName = 'Resort User',
  onComplete,
}: ResortTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const archPortalRef = useRef<HTMLDivElement>(null)
  const leftDoorRef = useRef<HTMLDivElement>(null)
  const rightDoorRef = useRef<HTMLDivElement>(null)
  const doorSeamRef = useRef<HTMLDivElement>(null)
  const statusBadgeRef = useRef<HTMLDivElement>(null)
  const sunlightBloomRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    if (!active) return

    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // If reduced motion is requested, perform an understated quick fade
    if (isReduced) {
      if (containerRef.current) {
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.45,
          onComplete: () => onComplete(),
        })
      } else {
        onComplete()
      }
      return
    }

    // ── Build Single Coherent GSAP Timeline ──────────────────────
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        onComplete: () => {
          onComplete()
        },
      })

      timelineRef.current = tl
      if (typeof window !== 'undefined') {
        ;(window as any).__doorTimeline = tl
      }

      // 1. Initial State: Grand entrance appears with closed doors
      gsap.set(containerRef.current, { opacity: 0, display: 'flex' })
      gsap.set(archPortalRef.current, { scale: 0.97, opacity: 0 })
      gsap.set(leftDoorRef.current, { rotateY: 0, xPercent: 0, opacity: 1 })
      gsap.set(rightDoorRef.current, { rotateY: 0, xPercent: 0, opacity: 1 })
      gsap.set(doorSeamRef.current, { opacity: 0.85 })
      gsap.set(statusBadgeRef.current, { opacity: 1, y: 0 })
      gsap.set(sunlightBloomRef.current, { opacity: 0, scale: 0.85 })

      // 2. Entrance Appears (0.00s - 0.75s)
      tl.to(containerRef.current, { opacity: 1, duration: 0.65 })
      tl.to(archPortalRef.current, { scale: 1.0, opacity: 1, duration: 0.75, ease: 'power2.out' }, 0.1)

      // 3. UNMISTAKABLE CLOSED-DOORS PAUSE (0.75s - 1.75s, 1000ms hold)
      // The user clearly sees the closed wooden doors and resort columns holding
      tl.to({}, { duration: 1.0 })

      // 4. Status badge softly fades before doors part (1.75s - 2.05s)
      tl.to(statusBadgeRef.current, { opacity: 0, y: -8, duration: 0.3, ease: 'power2.in' })
      tl.to(doorSeamRef.current, { opacity: 0, duration: 0.2 }, '<')

      // 5. DOUBLE DOORS PHYSICALLY OPEN OUTWARD (2.05s - 3.55s, 1.5s duration)
      tl.addLabel('doorsOpen')

      // Left door swings back and slides open to the left
      tl.to(
        leftDoorRef.current,
        {
          transformOrigin: 'left center',
          rotateY: -86,
          xPercent: -45,
          duration: 1.45,
          ease: 'power3.inOut',
        },
        'doorsOpen'
      )

      // Right door swings back and slides open to the right
      tl.to(
        rightDoorRef.current,
        {
          transformOrigin: 'right center',
          rotateY: 86,
          xPercent: 45,
          duration: 1.45,
          ease: 'power3.inOut',
        },
        'doorsOpen'
      )

      // Natural morning sunlight bloom expands behind the doors
      tl.fromTo(
        sunlightBloomRef.current,
        { opacity: 0, scale: 0.8 },
        { opacity: 0.85, scale: 1.15, duration: 1.35, ease: 'power2.out' },
        'doorsOpen+=0.15'
      )

      // 6. Natural Daylight & Interior Reveal -> Fade Out Entrance
      tl.to(
        containerRef.current,
        { opacity: 0, duration: 0.75, ease: 'power2.inOut' },
        '+=0.35'
      )
    })

    return () => {
      ctx.revert()
    }
  }, [active, onComplete])

  if (!active) return null

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#faf8f4] select-none"
      style={{ perspective: '1600px' }}
    >
      {/* ── Background Daytime Architectural Resort Visual ──────── */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="/images/resort-day-entrance.jpg"
          alt="Smart Resort 360 Grand Daytime Entrance"
          className="w-full h-full object-cover object-center filter brightness-[1.0] contrast-[1.02]"
        />
        {/* Soft, warm morning daylight wash */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#fbf8f2]/60 via-transparent to-[#fbf8f2]/30" />
      </div>

      {/* ── Grand Symmetrical Architectural Portal ───────────────── */}
      <div
        ref={archPortalRef}
        className="relative z-20 w-[94vw] max-w-[920px] h-[82vh] max-h-[740px] rounded-t-[220px] border-4 border-[#cfbc9e] shadow-[0_30px_90px_rgba(70,50,20,0.28),0_0_50px_rgba(180,140,75,0.2)] overflow-hidden flex flex-col will-change-transform"
      >
        {/* Arch Transom Header with Resort Lotus Emblem */}
        <div className="relative h-28 bg-gradient-to-b from-[#fbf8f2] via-[#f7eedf] to-[#eee2cf] border-b-2 border-[#d4bc94]/80 flex flex-col items-center justify-center z-30 shadow-md">
          <div className="flex items-center justify-center w-11 h-11 rounded-full bg-[#f4ebd7] border border-[#d4bc94] shadow-[0_2px_8px_rgba(180,140,75,0.2)]">
            <svg
              className="w-6 h-6 text-[#8c672b]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C11.5 5 9 8 5 9C9 10 11.5 13 12 16C12.5 13 15 10 19 9C15 8 12.5 5 12 2Z" />
              <path
                d="M12 16C10.5 18 9 20 6 21C9 21.5 11 22 12 22C13 22 15 21.5 18 21C15 20 13.5 18 12 16Z"
                opacity="0.8"
              />
              <path
                d="M12 7C12 9 10.5 11 8 11.5C10.5 12 12 14 12 16C12 14 13.5 12 16 11.5C13.5 11 12 9 12 7Z"
                opacity="0.6"
              />
            </svg>
          </div>
          <span className="font-serif text-[11px] tracking-[0.28em] text-[#6d5e4b] uppercase mt-1.5 font-semibold">
            Smart Resort 360
          </span>
        </div>

        {/* ── Doorway Interior Space (Behind the Doors) ──────────── */}
        <div className="relative flex-1 w-full overflow-hidden bg-[#faf8f4] flex items-center justify-center">
          {/* Warm Natural Sunlight Bloom */}
          <div
            ref={sunlightBloomRef}
            className="absolute inset-0 bg-radial from-amber-100 via-amber-200/50 to-transparent flex items-center justify-center z-10 opacity-0 pointer-events-none"
          >
            <div className="w-full h-full bg-gradient-to-r from-transparent via-white/80 to-transparent blur-lg" />
          </div>

          {/* Lobby Architecture Glimpse Behind Doors */}
          <div className="absolute inset-0 pointer-events-none opacity-80">
            <img
              src="/images/resort-room-day.jpg"
              alt="Resort Interior Glimpse"
              className="w-full h-full object-cover object-center filter brightness-[1.05]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-white/40" />
          </div>

          {/* ── Status Badge on Closed Doors ─────────────────────── */}
          <div
            ref={statusBadgeRef}
            className="absolute bottom-16 z-35 flex flex-col items-center justify-center text-center px-4"
          >
            <div className="px-6 py-3 rounded-full bg-white/95 backdrop-blur-md border border-[#d8c5a4] shadow-lg space-y-1.5 max-w-sm">
              <div className="text-xs font-serif text-[#6d5e4b] font-medium tracking-wide">
                Welcome back, <span className="text-[#8c672b] font-semibold">{userName || userRole}</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-[#8a7b68] font-medium">
                Preparing your resort experience...
              </div>
              {/* Elegant gold progress indicator */}
              <div className="w-48 h-1 bg-[#e8dcce] rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#9e7634] via-[#b48c4b] to-[#8c672b] animate-subtle-progress" />
              </div>
            </div>
          </div>

          {/* ── Grand Double Wooden Doors Container ──────────────── */}
          <div
            className="absolute inset-0 flex z-25"
            style={{ perspective: '1600px', transformStyle: 'preserve-3d' }}
          >
            {/* Left Door Panel (Oak Wood + Inset Mouldings + Vertical Gold Handle) */}
            <div
              ref={leftDoorRef}
              className="w-1/2 h-full bg-gradient-to-r from-[#9c7849] via-[#ab8655] to-[#8e6b3e] border-r border-[#6e5029]/60 relative shadow-[inset_0_0_35px_rgba(70,50,20,0.35)] flex items-center justify-end pr-6 will-change-transform"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Wood Inset Moulding Panels */}
              <div className="absolute inset-6 border-2 border-[#caa472]/45 rounded-sm bg-gradient-to-b from-[#a37e4e] to-[#866336] opacity-90 shadow-inner" />
              <div className="absolute inset-12 border border-[#caa472]/30 rounded-sm" />

              {/* Vertical Brushed Gold Handle */}
              <div className="relative z-10 w-3 h-44 rounded-full bg-gradient-to-b from-[#f5e3ba] via-[#d4bc80] to-[#9c7c42] shadow-[0_4px_14px_rgba(80,50,20,0.45)] border border-[#fbf3db]/70" />
            </div>

            {/* Right Door Panel (Oak Wood + Inset Mouldings + Vertical Gold Handle) */}
            <div
              ref={rightDoorRef}
              className="w-1/2 h-full bg-gradient-to-l from-[#9c7849] via-[#ab8655] to-[#8e6b3e] border-l border-[#6e5029]/60 relative shadow-[inset_0_0_35px_rgba(70,50,20,0.35)] flex items-center justify-start pl-6 will-change-transform"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Wood Inset Moulding Panels */}
              <div className="absolute inset-6 border-2 border-[#caa472]/45 rounded-sm bg-gradient-to-b from-[#a37e4e] to-[#866336] opacity-90 shadow-inner" />
              <div className="absolute inset-12 border border-[#caa472]/30 rounded-sm" />

              {/* Vertical Brushed Gold Handle */}
              <div className="relative z-10 w-3 h-44 rounded-full bg-gradient-to-b from-[#f5e3ba] via-[#d4bc80] to-[#9c7c42] shadow-[0_4px_14px_rgba(80,50,20,0.45)] border border-[#fbf3db]/70" />
            </div>
          </div>

          {/* Vertical Center Seam Daylight Glow (visible only when closed) */}
          <div
            ref={doorSeamRef}
            className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-amber-200/90 blur-[1px] z-30 pointer-events-none"
          />
        </div>
      </div>
    </div>
  )
}
