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
  onComplete,
}: ResortTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const leftDoorRef = useRef<HTMLDivElement>(null)
  const rightDoorRef = useRef<HTMLDivElement>(null)
  const leftDoorShadowRef = useRef<HTMLDivElement>(null)
  const rightDoorShadowRef = useRef<HTMLDivElement>(null)
  const doorSeamRef = useRef<HTMLDivElement>(null)
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

    // ── Build Single Coherent Master GSAP Timeline ───────────────
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

      // 1. Initial State: Full-screen closed double doors
      gsap.set(containerRef.current, { opacity: 0, display: 'flex' })
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
      gsap.set(sunlightBloomRef.current, { opacity: 0, scale: 0.9 })

      // Target dashboard underlay for subtle entry approach
      const dashboardEl = document.getElementById('dashboard-reveal-container')
      if (dashboardEl) {
        gsap.set(dashboardEl, { scale: 1.03, opacity: 0.88, transformOrigin: 'center center' })
      }

      // 2. Door Scene Fades In (0.00s - 0.65s) while login card finishes descending
      tl.to(containerRef.current, { opacity: 1, duration: 0.65, ease: 'power2.inOut' })

      // 3. UNMISTAKABLE CLOSED-DOORS CINEMATIC PAUSE (1.0s visible hold)
      tl.to({}, { duration: 1.0 })

      // 4. Center seam glow fades as doors start to part
      tl.to(doorSeamRef.current, { opacity: 0, duration: 0.3 })

      // 5. DOUBLE DOORS PHYSICALLY OPEN OUTWARD ON HINGES (2.1s duration)
      // Pure 3D rotation around vertical edge hinges — ZERO horizontal sliding!
      tl.addLabel('doorsOpen')

      // Left door rotates around its left vertical hinge (-105deg)
      tl.to(
        leftDoorRef.current,
        {
          rotateY: -105,
          duration: 2.1,
          ease: 'power3.inOut',
        },
        'doorsOpen'
      )

      // Right door rotates around its right vertical hinge (105deg)
      tl.to(
        rightDoorRef.current,
        {
          rotateY: 105,
          duration: 2.1,
          ease: 'power3.inOut',
        },
        'doorsOpen'
      )

      // Depth shadow intensifies on the turning door faces for realistic 3D mass
      tl.to(
        leftDoorShadowRef.current,
        {
          opacity: 0.55,
          duration: 2.1,
          ease: 'power3.inOut',
        },
        'doorsOpen'
      )

      tl.to(
        rightDoorShadowRef.current,
        {
          opacity: 0.55,
          duration: 2.1,
          ease: 'power3.inOut',
        },
        'doorsOpen'
      )

      // Soft cool daylight and subtle #2D8CFF atmospheric bloom expands behind opening doors
      tl.fromTo(
        sunlightBloomRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 0.6, scale: 1.15, duration: 1.6, ease: 'power2.out' },
        'doorsOpen+=0.2'
      )
      tl.to(
        sunlightBloomRef.current,
        { opacity: 0, duration: 0.8, ease: 'power2.in' },
        'doorsOpen+=1.3'
      )

      // Dashboard progressive reveal & gentle approach (scale: 1.03 -> 1.0, opacity: 0.88 -> 1.0)
      if (dashboardEl) {
        tl.to(
          dashboardEl,
          {
            scale: 1.0,
            opacity: 1.0,
            duration: 2.1,
            ease: 'power2.out',
          },
          'doorsOpen+=0.1'
        )
      }

      // 6. Smooth settle into dashboard
      tl.to(
        containerRef.current,
        { opacity: 0, duration: 0.45, ease: 'power2.inOut' },
        '+=0.15'
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
      className="fixed inset-0 z-40 w-screen h-screen overflow-hidden select-none pointer-events-none"
      style={{ perspective: '1600px', transformStyle: 'preserve-3d' }}
    >
      {/* ── Daylight Atmospheric Bloom Layer behind doors ───────── */}
      <div
        ref={sunlightBloomRef}
        className="absolute inset-0 flex items-center justify-center opacity-0 pointer-events-none z-10"
      >
        <div className="w-[120vw] h-[120vh] bg-radial from-white/90 via-[#2D8CFF]/15 to-transparent blur-3xl" />
      </div>

      {/* ── Full-Screen Double Architectural Doors Layer ─────────── */}
      <div
        className="absolute inset-0 w-full h-full flex z-20"
        style={{ perspective: '1600px', transformStyle: 'preserve-3d' }}
      >
        {/* ── LEFT DOOR (Width ~50.5vw, Hinged on Left Edge) ─────── */}
        <div
          ref={leftDoorRef}
          className="relative w-[50.5vw] h-full flex items-center justify-end pr-8 sm:pr-12 md:pr-16 will-change-transform"
          style={{
            transformStyle: 'preserve-3d',
            transformOrigin: 'left center',
            background: 'linear-gradient(135deg, #1C2834 0%, #263746 40%, #30495A 80%, #223240 100%)',
            boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 0.45), inset -2px 0 6px rgba(255, 255, 255, 0.08)',
            borderRight: '1px solid rgba(45, 140, 255, 0.15)',
          }}
        >
          {/* Architectural Lintel & Base Accents */}
          <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-black/40 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Architectural Inset Molding Panels (Cool Slate-Blue Satin Layers) */}
          <div className="absolute inset-6 sm:inset-10 md:inset-14 flex flex-col justify-between py-4 pointer-events-none">
            {/* Top Recessed Panel */}
            <div className="h-[44%] w-full rounded-md border border-slate-600/40 bg-gradient-to-b from-[#1E2B38]/80 to-[#2A3B4D]/60 shadow-[inset_0_3px_12px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.06)] relative overflow-hidden">
              <div className="absolute inset-3 sm:inset-4 border border-slate-500/20 rounded-xs" />
              {/* Subtle architectural vertical line accent */}
              <div className="absolute right-6 inset-y-4 w-px bg-gradient-to-b from-transparent via-[#2D8CFF]/20 to-transparent" />
            </div>

            {/* Bottom Recessed Panel */}
            <div className="h-[52%] w-full rounded-md border border-slate-600/40 bg-gradient-to-b from-[#1E2B38]/80 to-[#2A3B4D]/60 shadow-[inset_0_3px_12px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.06)] relative overflow-hidden">
              <div className="absolute inset-3 sm:inset-4 border border-slate-500/20 rounded-xs" />
              <div className="absolute right-6 inset-y-4 w-px bg-gradient-to-b from-transparent via-[#2D8CFF]/20 to-transparent" />
            </div>
          </div>

          {/* Dynamic 3D depth shadow overlay during rotation */}
          <div
            ref={leftDoorShadowRef}
            className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent pointer-events-none opacity-0"
          />

          {/* Cool Brushed Silver / Chrome Hardware (Vertical Architectural Handle) */}
          <div className="relative z-30 flex items-center">
            {/* Upper Chrome Standoff Mount */}
            <div className="absolute -top-28 right-1 w-4 h-3 rounded-sm bg-gradient-to-r from-slate-400 via-white to-slate-400 shadow-md border border-slate-300" />
            {/* Lower Chrome Standoff Mount */}
            <div className="absolute -bottom-28 right-1 w-4 h-3 rounded-sm bg-gradient-to-r from-slate-400 via-white to-slate-400 shadow-md border border-slate-300" />
            {/* Main Vertical Bar */}
            <div
              className="w-3 sm:w-3.5 h-64 sm:h-72 rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.9)] border border-white/60 relative"
              style={{
                background: 'linear-gradient(to right, #94A3B8 0%, #E2E8F0 35%, #FFFFFF 50%, #CBD5E1 70%, #64748B 100%)',
              }}
            >
              {/* Soft specular reflection line */}
              <div className="absolute inset-y-2 left-0.5 w-[1.5px] bg-white/90 blur-[0.5px]" />
            </div>
          </div>
        </div>

        {/* ── RIGHT DOOR (Width ~50.5vw, Hinged on Right Edge) ────── */}
        <div
          ref={rightDoorRef}
          className="relative w-[50.5vw] h-full flex items-center justify-start pl-8 sm:pl-12 md:pl-16 will-change-transform"
          style={{
            transformStyle: 'preserve-3d',
            transformOrigin: 'right center',
            background: 'linear-gradient(135deg, #223240 0%, #30495A 20%, #263746 60%, #1C2834 100%)',
            boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 0.45), inset 2px 0 6px rgba(255, 255, 255, 0.08)',
            borderLeft: '1px solid rgba(45, 140, 255, 0.15)',
          }}
        >
          {/* Architectural Lintel & Base Accents */}
          <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-black/40 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Architectural Inset Molding Panels (Cool Slate-Blue Satin Layers) */}
          <div className="absolute inset-6 sm:inset-10 md:inset-14 flex flex-col justify-between py-4 pointer-events-none">
            {/* Top Recessed Panel */}
            <div className="h-[44%] w-full rounded-md border border-slate-600/40 bg-gradient-to-b from-[#1E2B38]/80 to-[#2A3B4D]/60 shadow-[inset_0_3px_12px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.06)] relative overflow-hidden">
              <div className="absolute inset-3 sm:inset-4 border border-slate-500/20 rounded-xs" />
              <div className="absolute left-6 inset-y-4 w-px bg-gradient-to-b from-transparent via-[#2D8CFF]/20 to-transparent" />
            </div>

            {/* Bottom Recessed Panel */}
            <div className="h-[52%] w-full rounded-md border border-slate-600/40 bg-gradient-to-b from-[#1E2B38]/80 to-[#2A3B4D]/60 shadow-[inset_0_3px_12px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.06)] relative overflow-hidden">
              <div className="absolute inset-3 sm:inset-4 border border-slate-500/20 rounded-xs" />
              <div className="absolute left-6 inset-y-4 w-px bg-gradient-to-b from-transparent via-[#2D8CFF]/20 to-transparent" />
            </div>
          </div>

          {/* Dynamic 3D depth shadow overlay during rotation */}
          <div
            ref={rightDoorShadowRef}
            className="absolute inset-0 bg-gradient-to-l from-black/60 via-black/40 to-transparent pointer-events-none opacity-0"
          />

          {/* Cool Brushed Silver / Chrome Hardware (Vertical Architectural Handle) */}
          <div className="relative z-30 flex items-center">
            {/* Upper Chrome Standoff Mount */}
            <div className="absolute -top-28 left-1 w-4 h-3 rounded-sm bg-gradient-to-r from-slate-400 via-white to-slate-400 shadow-md border border-slate-300" />
            {/* Lower Chrome Standoff Mount */}
            <div className="absolute -bottom-28 left-1 w-4 h-3 rounded-sm bg-gradient-to-r from-slate-400 via-white to-slate-400 shadow-md border border-slate-300" />
            {/* Main Vertical Bar */}
            <div
              className="w-3 sm:w-3.5 h-64 sm:h-72 rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.9)] border border-white/60 relative"
              style={{
                background: 'linear-gradient(to right, #94A3B8 0%, #E2E8F0 35%, #FFFFFF 50%, #CBD5E1 70%, #64748B 100%)',
              }}
            >
              <div className="absolute inset-y-2 left-0.5 w-[1.5px] bg-white/90 blur-[0.5px]" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Vertical Center Seam Light Glow (visible when doors closed) ── */}
      <div
        ref={doorSeamRef}
        className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-[#2D8CFF]/50 via-white/80 to-[#2D8CFF]/50 blur-[0.8px] z-30 pointer-events-none"
      />
    </div>
  )
}
