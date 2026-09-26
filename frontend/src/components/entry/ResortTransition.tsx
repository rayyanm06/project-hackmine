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
      gsap.set(archPortalRef.current, { scale: 0.97, opacity: 0 })
      gsap.set(leftDoorRef.current, {
        rotateY: 0,
        xPercent: 0,
        transformOrigin: 'left center',
        opacity: 1,
      })
      gsap.set(rightDoorRef.current, {
        rotateY: 0,
        xPercent: 0,
        transformOrigin: 'right center',
        opacity: 1,
      })
      gsap.set(leftDoorShadowRef.current, { opacity: 0 })
      gsap.set(rightDoorShadowRef.current, { opacity: 0 })
      gsap.set(doorSeamRef.current, { opacity: 0.85 })
      gsap.set(statusBadgeRef.current, { opacity: 1, y: 0 })
      gsap.set(sunlightBloomRef.current, { opacity: 0, scale: 0.85 })

      // 2. Entrance Appears (0.00s - 0.70s)
      tl.to(containerRef.current, { opacity: 1, duration: 0.65 })
      tl.to(archPortalRef.current, { scale: 1.0, opacity: 1, duration: 0.75, ease: 'power2.out' }, 0.1)

      // 3. UNMISTAKABLE CLOSED-DOORS PAUSE (0.70s - 1.70s, 1000ms hold)
      // The user clearly sees the closed wooden doors and resort columns holding
      tl.to({}, { duration: 1.0 })

      // 4. Status badge softly fades before doors part (1.70s - 2.00s)
      tl.to(statusBadgeRef.current, { opacity: 0, y: -8, duration: 0.3, ease: 'power2.in' })
      tl.to(doorSeamRef.current, { opacity: 0, duration: 0.2 }, '<')

      // 5. DOUBLE DOORS PHYSICALLY OPEN OUTWARD ON HINGES (2.00s - 3.50s, 1.5s duration)
      // Realistic 3D rotation around edge hinges — NO xPercent or translateX sliding!
      tl.addLabel('doorsOpen')

      // Left door rotates around its left hinge
      tl.to(
        leftDoorRef.current,
        {
          rotateY: -85,
          duration: 1.45,
          ease: 'power2.inOut',
        },
        'doorsOpen'
      )

      // Right door rotates around its right hinge
      tl.to(
        rightDoorRef.current,
        {
          rotateY: 85,
          duration: 1.45,
          ease: 'power2.inOut',
        },
        'doorsOpen'
      )

      // Depth shadow intensifies on the turning faces for realistic 3D appearance
      tl.to(
        leftDoorShadowRef.current,
        {
          opacity: 0.45,
          duration: 1.45,
          ease: 'power2.inOut',
        },
        'doorsOpen'
      )

      tl.to(
        rightDoorShadowRef.current,
        {
          opacity: 0.45,
          duration: 1.45,
          ease: 'power2.inOut',
        },
        'doorsOpen'
      )

      // Natural morning sunlight bloom gently expands behind the opening doors
      tl.fromTo(
        sunlightBloomRef.current,
        { opacity: 0, scale: 0.85 },
        { opacity: 0.75, scale: 1.15, duration: 1.35, ease: 'power2.out' },
        'doorsOpen+=0.2'
      )

      // 6. Natural Daylight & Interior Reveal -> Fade Out Entrance to Dashboard
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
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#FAF9F6] select-none"
      style={{ perspective: '1600px' }}
    >
      {/* ── Background Daytime Architectural Resort Visual ──────── */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="/images/resort-day-entrance.jpg"
          alt="Smart Resort 360 Grand Daytime Entrance"
          className="w-full h-full object-cover object-center filter brightness-[1.0] contrast-[1.01]"
        />
        {/* Soft, warm morning daylight wash */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F6]/70 via-transparent to-[#FAF9F6]/40" />
      </div>

      {/* ── Grand Symmetrical Architectural Portal ───────────────── */}
      <div
        ref={archPortalRef}
        className="relative z-20 w-[94vw] max-w-[920px] h-[82vh] max-h-[740px] rounded-t-[220px] border-4 border-[#DCD5CB] shadow-[0_30px_90px_rgba(28,35,33,0.18),0_0_50px_rgba(61,90,69,0.12)] overflow-hidden flex flex-col will-change-transform"
      >
        {/* Arch Transom Header with Resort Botanical Lotus Emblem */}
        <div className="relative h-28 bg-gradient-to-b from-[#FAF9F6] via-[#F4F1EA] to-[#EAE6DF] border-b-2 border-[#DCD5CB] flex flex-col items-center justify-center z-30 shadow-sm">
          <div className="flex items-center justify-center w-11 h-11 rounded-full bg-[#EBF2ED] border border-[#C6D8CC] shadow-sm">
            <svg
              className="w-6 h-6 text-[#3D5A45]"
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
          <span className="text-[12px] tracking-[0.24em] text-[#3D5A45] uppercase mt-1.5 font-bold">
            Smart Resort 360
          </span>
        </div>

        {/* ── Doorway Interior Space (Behind the Doors) ──────────── */}
        <div className="relative flex-1 w-full overflow-hidden bg-[#FAF9F6] flex items-center justify-center">
          {/* Warm Natural Sunlight Bloom */}
          <div
            ref={sunlightBloomRef}
            className="absolute inset-0 bg-radial from-amber-50/70 via-white/60 to-transparent flex items-center justify-center z-10 opacity-0 pointer-events-none"
          >
            <div className="w-full h-full bg-gradient-to-r from-transparent via-white/70 to-transparent blur-xl" />
          </div>

          {/* Lobby Architecture Glimpse Behind Doors */}
          <div className="absolute inset-0 pointer-events-none opacity-85">
            <img
              src="/images/resort-room-day.jpg"
              alt="Resort Interior Glimpse"
              className="w-full h-full object-cover object-center filter brightness-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white/75 via-transparent to-white/45" />
          </div>

          {/* ── Status Badge on Closed Doors ─────────────────────── */}
          <div
            ref={statusBadgeRef}
            className="absolute bottom-16 z-35 flex flex-col items-center justify-center text-center px-4"
          >
            <div className="px-6 py-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#DCD5CB] shadow-[0_12px_32px_rgba(28,35,33,0.12)] space-y-2 max-w-sm">
              <div className="text-sm text-[#1C2321] font-semibold tracking-normal">
                Welcome, <span className="text-[#3D5A45] font-bold">{userName || userRole}</span>
              </div>
              <div className="text-[11px] uppercase tracking-wider text-[#5B6661] font-semibold">
                Preparing your resort experience...
              </div>
              {/* Soothing sage progress indicator */}
              <div className="w-48 h-1 bg-[#E8E4DC] rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#5A7B64] via-[#3D5A45] to-[#25372B] animate-subtle-progress" />
              </div>
            </div>
          </div>

          {/* ── Grand Double Wooden Doors Container (3D Perspective Viewport) ── */}
          <div
            className="absolute inset-0 flex z-25"
            style={{ perspective: '1600px', transformStyle: 'preserve-3d' }}
          >
            {/* Left Door Panel (Hinged on the Left) */}
            <div
              ref={leftDoorRef}
              className="w-1/2 h-full bg-gradient-to-r from-[#9E8160] via-[#A88C6C] to-[#8F7252] border-r border-[#634E35]/40 relative shadow-[inset_0_0_35px_rgba(40,30,15,0.25)] flex items-center justify-end pr-7 will-change-transform"
              style={{
                transformStyle: 'preserve-3d',
                transformOrigin: 'left center',
              }}
            >
              {/* Architectural Wood Inset Mouldings */}
              <div className="absolute inset-6 border-2 border-[#BEA586]/35 rounded-sm bg-gradient-to-b from-[#A48767] to-[#8A6D4D] opacity-90 shadow-inner" />
              <div className="absolute inset-12 border border-[#BEA586]/25 rounded-sm" />

              {/* Dynamic 3D depth shadow overlay during rotation */}
              <div
                ref={leftDoorShadowRef}
                className="absolute inset-0 bg-black/60 pointer-events-none opacity-0"
              />

              {/* Vertical Brushed Satin Champagne Architectural Pull Handle */}
              <div className="relative z-10 w-2.5 h-44 rounded-full bg-gradient-to-b from-[#FAF8F5] via-[#D8D2C6] to-[#A8A092] shadow-[0_4px_14px_rgba(28,35,33,0.35)] border border-white/60" />
            </div>

            {/* Right Door Panel (Hinged on the Right) */}
            <div
              ref={rightDoorRef}
              className="w-1/2 h-full bg-gradient-to-l from-[#9E8160] via-[#A88C6C] to-[#8F7252] border-l border-[#634E35]/40 relative shadow-[inset_0_0_35px_rgba(40,30,15,0.25)] flex items-center justify-start pl-7 will-change-transform"
              style={{
                transformStyle: 'preserve-3d',
                transformOrigin: 'right center',
              }}
            >
              {/* Architectural Wood Inset Mouldings */}
              <div className="absolute inset-6 border-2 border-[#BEA586]/35 rounded-sm bg-gradient-to-b from-[#A48767] to-[#8A6D4D] opacity-90 shadow-inner" />
              <div className="absolute inset-12 border border-[#BEA586]/25 rounded-sm" />

              {/* Dynamic 3D depth shadow overlay during rotation */}
              <div
                ref={rightDoorShadowRef}
                className="absolute inset-0 bg-black/60 pointer-events-none opacity-0"
              />

              {/* Vertical Brushed Satin Champagne Architectural Pull Handle */}
              <div className="relative z-10 w-2.5 h-44 rounded-full bg-gradient-to-b from-[#FAF8F5] via-[#D8D2C6] to-[#A8A092] shadow-[0_4px_14px_rgba(28,35,33,0.35)] border border-white/60" />
            </div>
          </div>

          {/* Vertical Center Seam Soft Daylight (visible only when closed) */}
          <div
            ref={doorSeamRef}
            className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-amber-100/70 blur-[1px] z-30 pointer-events-none"
          />
        </div>
      </div>
    </div>
  )
}
