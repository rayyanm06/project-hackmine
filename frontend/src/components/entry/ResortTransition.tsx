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
  const leftDoorShadowRef = useRef<HTMLDivElement>(null)
  const rightDoorShadowRef = useRef<HTMLDivElement>(null)
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
      gsap.set(archPortalRef.current, { scale: 0.98, opacity: 0 })
      gsap.set(leftDoorRef.current, {
        rotateY: 0,
        transformOrigin: 'left center',
        opacity: 1,
      })
      gsap.set(rightDoorRef.current, {
        rotateY: 0,
        transformOrigin: 'right center',
        opacity: 1,
      })
      gsap.set(leftDoorShadowRef.current, { opacity: 0 })
      gsap.set(rightDoorShadowRef.current, { opacity: 0 })
      gsap.set(doorSeamRef.current, { opacity: 0.9 })
      gsap.set(statusBadgeRef.current, { opacity: 1, y: 0 })
      gsap.set(sunlightBloomRef.current, { opacity: 0, scale: 0.85 })

      // 2. Entrance Appears (0.00s - 0.70s)
      tl.to(containerRef.current, { opacity: 1, duration: 0.65 })
      tl.to(archPortalRef.current, { scale: 1.0, opacity: 1, duration: 0.7, ease: 'power2.out' }, 0.05)

      // 3. UNMISTAKABLE CLOSED-DOORS PAUSE (0.70s - 2.30s, exactly 1.6s visible hold)
      // The user clearly sees the closed ivory/blue double doors holding
      tl.to({}, { duration: 1.6 })

      // 4. Status badge softly fades before doors part (2.30s - 2.60s)
      tl.to(statusBadgeRef.current, { opacity: 0, y: -8, duration: 0.3, ease: 'power2.in' })
      tl.to(doorSeamRef.current, { opacity: 0, duration: 0.2 }, '<')

      // 5. DOUBLE DOORS PHYSICALLY OPEN OUTWARD ON HINGES (2.60s - 4.30s, 1.7s duration)
      // Pure 3D rotation around vertical edge hinges — ZERO xPercent or translateX sliding!
      tl.addLabel('doorsOpen')

      // Left door rotates around its left vertical hinge
      tl.to(
        leftDoorRef.current,
        {
          rotateY: -84,
          duration: 1.7,
          ease: 'power3.inOut',
        },
        'doorsOpen'
      )

      // Right door rotates around its right vertical hinge
      tl.to(
        rightDoorRef.current,
        {
          rotateY: 84,
          duration: 1.7,
          ease: 'power3.inOut',
        },
        'doorsOpen'
      )

      // Depth shadow intensifies on the turning door faces for realistic 3D mass
      tl.to(
        leftDoorShadowRef.current,
        {
          opacity: 0.45,
          duration: 1.7,
          ease: 'power3.inOut',
        },
        'doorsOpen'
      )

      tl.to(
        rightDoorShadowRef.current,
        {
          opacity: 0.45,
          duration: 1.7,
          ease: 'power3.inOut',
        },
        'doorsOpen'
      )

      // Soft white daylight and powder-blue atmospheric bloom expands behind opening doors
      tl.fromTo(
        sunlightBloomRef.current,
        { opacity: 0, scale: 0.85 },
        { opacity: 0.8, scale: 1.15, duration: 1.5, ease: 'power2.out' },
        'doorsOpen+=0.25'
      )

      // 6. Natural Daylight & Interior Reveal -> Fade Out Entrance to Dashboard
      tl.to(
        containerRef.current,
        { opacity: 0, duration: 0.75, ease: 'power2.inOut' },
        '+=0.3'
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
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#F8FAFC] select-none"
      style={{ perspective: '1600px' }}
    >
      {/* ── Background Daytime Coastal Resort Visual ─────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="/images/resort-day-entrance.jpg"
          alt="Smart Resort 360 Daytime Entrance"
          className="w-full h-full object-cover object-center filter brightness-[1.02] contrast-[1.01]"
        />
        {/* Soft, cool morning daylight wash with subtle sky reflection */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-sky-50/20 to-white/40" />
      </div>

      {/* ── Architectural Portal (Non-clipping 3D Viewport) ──────── */}
      <div
        ref={archPortalRef}
        className="relative z-20 w-[94vw] max-w-[920px] h-[82vh] max-h-[740px] flex flex-col will-change-transform"
        style={{ perspective: '1600px', transformStyle: 'preserve-3d' }}
      >
        {/* Subtle Architectural Transom Header (Light, clean, NOT a heavy gold box) */}
        <div className="relative h-24 rounded-t-3xl bg-gradient-to-b from-white/95 via-slate-50/90 to-sky-50/70 border-t border-x border-b border-slate-200/80 backdrop-blur-md shadow-xs flex flex-col items-center justify-center z-30">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-sky-50 border border-sky-200/90 shadow-xs">
            <svg
              className="w-5 h-5 text-[#1E40AF]"
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
          <span className="text-[11px] tracking-[0.26em] text-[#1E40AF] uppercase mt-1.5 font-bold">
            Smart Resort 360
          </span>
        </div>

        {/* ── Main Doorway Area (Unclipped 3D Viewport) ──────────── */}
        <div
          className="relative flex-1 w-full rounded-b-2xl border-x border-b border-slate-200/80 bg-slate-50/60 shadow-[0_25px_60px_rgba(15,23,42,0.12)]"
          style={{ perspective: '1600px', transformStyle: 'preserve-3d' }}
        >
          {/* Interior Glimpse Behind Doors */}
          <div className="absolute inset-0 rounded-b-2xl overflow-hidden pointer-events-none z-10">
            <img
              src="/images/resort-room-day.jpg"
              alt="Resort Interior Glimpse"
              className="w-full h-full object-cover object-center filter brightness-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white/75 via-sky-50/30 to-white/45" />

            {/* Soft White Daylight + Powder-Blue Atmospheric Bloom */}
            <div
              ref={sunlightBloomRef}
              className="absolute inset-0 bg-radial from-sky-100/70 via-sky-50/40 to-transparent flex items-center justify-center opacity-0"
            >
              <div className="w-full h-full bg-gradient-to-r from-transparent via-white/70 to-transparent blur-2xl" />
            </div>
          </div>

          {/* ── Status Badge on Closed Doors ─────────────────────── */}
          <div
            ref={statusBadgeRef}
            className="absolute bottom-16 inset-x-0 z-35 flex flex-col items-center justify-center text-center px-4 pointer-events-none"
          >
            <div className="px-6 py-3.5 rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200/90 shadow-[0_12px_32px_rgba(15,23,42,0.12)] space-y-2 max-w-sm pointer-events-auto">
              <div className="text-sm text-[#0F172A] font-bold tracking-tight">
                Welcome, <span className="text-[#1E40AF]">{userName || userRole}</span>
              </div>
              <div className="text-[11px] uppercase tracking-wider text-[#64748B] font-semibold">
                Preparing your resort experience...
              </div>
              {/* Soothing coastal blue progress indicator */}
              <div className="w-48 h-1 bg-slate-100 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-gradient-to-r from-sky-400 via-blue-600 to-indigo-900 animate-subtle-progress" />
              </div>
            </div>
          </div>

          {/* ── Double Architectural Resort Doors (Unclipped 3D Layer) ── */}
          <div
            className="absolute inset-0 flex z-25 pointer-events-none"
            style={{ perspective: '1600px', transformStyle: 'preserve-3d' }}
          >
            {/* Left Door Panel (Hinged on the Left Vertical Edge) */}
            <div
              ref={leftDoorRef}
              className="w-1/2 h-full rounded-bl-2xl bg-gradient-to-r from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] border-r border-slate-300/80 shadow-[inset_0_0_30px_rgba(15,23,42,0.05)] relative flex items-center justify-end pr-7 will-change-transform"
              style={{
                transformStyle: 'preserve-3d',
                transformOrigin: 'left center',
              }}
            >
              {/* Architectural Inset Panels with Soft Mist-Blue Tint */}
              <div className="absolute inset-6 border-2 border-slate-200/80 rounded-lg bg-gradient-to-b from-[#F0F7FA]/75 to-[#E8F0F8]/75 shadow-inner" />
              <div className="absolute inset-12 border border-sky-100/80 rounded-md" />

              {/* Dynamic 3D depth shadow overlay during rotation */}
              <div
                ref={leftDoorShadowRef}
                className="absolute inset-0 rounded-bl-2xl bg-slate-900/40 pointer-events-none opacity-0"
              />

              {/* Vertical Satin Silver Architectural Pull Handle */}
              <div className="relative z-10 w-2.5 h-44 rounded-full bg-gradient-to-b from-white via-slate-200 to-slate-400 shadow-[0_4px_14px_rgba(15,23,42,0.22)] border border-white" />
            </div>

            {/* Right Door Panel (Hinged on the Right Vertical Edge) */}
            <div
              ref={rightDoorRef}
              className="w-1/2 h-full rounded-br-2xl bg-gradient-to-l from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9] border-l border-slate-300/80 shadow-[inset_0_0_30px_rgba(15,23,42,0.05)] relative flex items-center justify-start pl-7 will-change-transform"
              style={{
                transformStyle: 'preserve-3d',
                transformOrigin: 'right center',
              }}
            >
              {/* Architectural Inset Panels with Soft Mist-Blue Tint */}
              <div className="absolute inset-6 border-2 border-slate-200/80 rounded-lg bg-gradient-to-b from-[#F0F7FA]/75 to-[#E8F0F8]/75 shadow-inner" />
              <div className="absolute inset-12 border border-sky-100/80 rounded-md" />

              {/* Dynamic 3D depth shadow overlay during rotation */}
              <div
                ref={rightDoorShadowRef}
                className="absolute inset-0 rounded-br-2xl bg-slate-900/40 pointer-events-none opacity-0"
              />

              {/* Vertical Satin Silver Architectural Pull Handle */}
              <div className="relative z-10 w-2.5 h-44 rounded-full bg-gradient-to-b from-white via-slate-200 to-slate-400 shadow-[0_4px_14px_rgba(15,23,42,0.22)] border border-white" />
            </div>
          </div>

          {/* Vertical Center Seam Soft Daylight Blue Glow (visible only when closed) */}
          <div
            ref={doorSeamRef}
            className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-sky-200/80 blur-[1px] z-30 pointer-events-none"
          />
        </div>
      </div>
    </div>
  )
}
