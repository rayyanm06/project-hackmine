import { useState, useEffect, useRef } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Compass,
  ArrowRight,
  Download,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Wrench,
  Sparkles,
  BedDouble,
  Users,
  AlertTriangle,
  CheckSquare,
  ShieldCheck,
  TrendingUp,
  BrainCircuit,
  ChartNoAxesCombined,
  Camera,
  History,
  ClipboardList,
  Eye,
  Building,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { mockTasks } from '@/data/mock-tasks'
import { mockComplaints } from '@/data/mock-complaints'
import { mockStaff } from '@/data/mock-staff'
import { mockRooms } from '@/data/mock-rooms'
import { api } from '@/lib/api'
import { AuthService, type AuthUser } from '@/lib/auth'

// Register GSAP ScrollTrigger plugin safely
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export const Route = createFileRoute('/_layout/')({
  component: DashboardPage,
})

// ── Room Structure & Hospitality States ──────────────────────────────────────
export interface ResortRoom {
  id: string
  number: string
  wing: 'Ocean Wing' | 'Garden Wing' | 'Coastline Suites' | 'Beach Pavilions'
  type: string
  status: 'ready' | 'occupied' | 'cleaning' | 'needs_service'
  guestName?: string
  assignedStaff?: string
  activeIssue?: string
  priority?: 'low' | 'medium' | 'high'
  rate: number
  lastUpdated: string
}

const INITIAL_ROOMS: ResortRoom[] = [
  // Ocean Wing (101 - 105)
  { id: '101', number: '101', wing: 'Ocean Wing', type: 'Oceanview Suite', status: 'occupied', guestName: 'Arjun Kapoor', rate: 8500, lastUpdated: '12m ago' },
  { id: '102', number: '102', wing: 'Ocean Wing', type: 'Ocean Deluxe', status: 'occupied', guestName: 'Priya Patel', rate: 6500, lastUpdated: '45m ago' },
  { id: '103', number: '103', wing: 'Ocean Wing', type: 'Oceanview Suite', status: 'occupied', guestName: 'Sneha Reddy', rate: 8500, lastUpdated: '1h ago' },
  { id: '104', number: '104', wing: 'Ocean Wing', type: 'Ocean Deluxe', status: 'occupied', guestName: 'Rohan Mehta', rate: 6500, lastUpdated: '2h ago' },
  { id: '105', number: '105', wing: 'Ocean Wing', type: 'Deluxe Garden Room', status: 'ready', guestName: undefined, rate: 4500, lastUpdated: '18m ago' },

  // Garden Wing (106 - 110)
  { id: '106', number: '106', wing: 'Garden Wing', type: 'Garden Standard', status: 'occupied', guestName: 'Vikram Seth', rate: 3800, lastUpdated: '3h ago' },
  { id: '107', number: '107', wing: 'Garden Wing', type: 'Garden Standard', status: 'occupied', guestName: 'Ananya Roy', rate: 3800, lastUpdated: '4h ago' },
  { id: '108', number: '108', wing: 'Garden Wing', type: 'Garden Standard', status: 'occupied', guestName: 'Dev Sharma', rate: 3800, lastUpdated: '25m ago' },
  { id: '109', number: '109', wing: 'Garden Wing', type: 'Tropical Villa', status: 'occupied', guestName: 'Siddharth Roy', rate: 9200, lastUpdated: '5h ago' },
  { id: '110', number: '110', wing: 'Garden Wing', type: 'Tropical Villa', status: 'occupied', guestName: 'Kavita Nair', rate: 9200, lastUpdated: '1h ago' },

  // Coastline Suites (201 - 205)
  { id: '201', number: '201', wing: 'Coastline Suites', type: 'Coastline Villa', status: 'ready', guestName: undefined, rate: 9500, lastUpdated: '40m ago' },
  { id: '202', number: '202', wing: 'Coastline Suites', type: 'Coastline Suite', status: 'occupied', guestName: 'Meera Joshi', rate: 7800, lastUpdated: '2h ago' },
  { id: '203', number: '203', wing: 'Coastline Suites', type: 'Coastline Suite', status: 'occupied', guestName: 'Rajesh Gupta', rate: 7800, lastUpdated: '3h ago' },
  { id: '204', number: '204', wing: 'Coastline Suites', type: 'Coastline Suite', status: 'needs_service', guestName: 'Arjun Kapoor', activeIssue: 'AC cooling unit failing to regulate temperature', assignedStaff: 'Rahul Sharma', priority: 'high', rate: 7800, lastUpdated: '25m ago' },
  { id: '205', number: '205', wing: 'Coastline Suites', type: 'Coastline Deluxe', status: 'occupied', guestName: 'Karan Verma', rate: 6800, lastUpdated: '1h ago' },

  // Beach Pavilions (206 - 210)
  { id: '206', number: '206', wing: 'Beach Pavilions', type: 'Beachfront Deluxe', status: 'occupied', guestName: 'Neha Sengupta', rate: 7200, lastUpdated: '2h ago' },
  { id: '207', number: '207', wing: 'Beach Pavilions', type: 'Beachfront Standard', status: 'ready', guestName: undefined, rate: 4200, lastUpdated: '15m ago' },
  { id: '208', number: '208', wing: 'Beach Pavilions', type: 'Beachfront Standard', status: 'occupied', guestName: 'Amit Trivedi', rate: 4200, lastUpdated: '4h ago' },
  { id: '209', number: '209', wing: 'Beach Pavilions', type: 'Beach Pavilion Villa', status: 'cleaning', guestName: undefined, assignedStaff: 'Priya Nair', activeIssue: 'Turnover housekeeping & linen change', priority: 'medium', rate: 9800, lastUpdated: '10m ago' },
  { id: '210', number: '210', wing: 'Beach Pavilions', type: 'Beach Pavilion Villa', status: 'occupied', guestName: 'Sanjay Kapoor', rate: 9800, lastUpdated: '6h ago' },
]

// ── Shift Schedule Milestones ───────────────────────────────────────────────
const SHIFT_MILESTONES = [
  { time: '09:00', title: 'Check-outs Completed', count: '12 rooms', note: 'All keys returned to front desk', status: 'completed' },
  { time: '11:00', title: 'Turnover Housekeeping', count: '8 rooms prepped', note: 'Cleaned, sanitized & linen changed', status: 'completed' },
  { time: '14:00', title: 'Guest Arrivals & Check-ins', count: '16 arrivals', note: 'Current active shift focus', status: 'active' },
  { time: '18:00', title: 'Evening Guest Requests', count: '8 requests logged', note: 'Towels, dining & AC adjustments', status: 'upcoming' },
  { time: '20:00', title: 'Night Maintenance & Security', count: '3 checks pending', note: 'HVAC rounds & perimeter scan', status: 'upcoming' },
]

// ── Analytical Data ─────────────────────────────────────────────────────────
const OCCUPANCY_TREND = [
  { day: 'Mon', occupancy: 72, rooms: 14, revpar: 4320 },
  { day: 'Tue', occupancy: 76, rooms: 15, revpar: 4560 },
  { day: 'Wed', occupancy: 81, rooms: 16, revpar: 4860 },
  { day: 'Thu', occupancy: 79, rooms: 16, revpar: 4740 },
  { day: 'Fri', occupancy: 85, rooms: 17, revpar: 5100 },
  { day: 'Sat', occupancy: 91, rooms: 18, revpar: 5460 },
  { day: 'Sun', occupancy: 88, rooms: 18, revpar: 5280 },
]

const REQUEST_CATEGORIES = [
  { name: 'Maintenance', count: 4, color: '#C96B56' },
  { name: 'Housekeeping', count: 2, color: '#78AAA0' },
  { name: 'Plumbing', count: 1, color: '#5B9EA3' },
  { name: 'Front Desk', count: 1, color: '#D8C7AA' },
]

const TASK_FLOW_STAGES = [
  { stage: '1. Request', count: 8, fill: '#1C3035' },
  { stage: '2. Assigned', count: 6, fill: '#5B9EA3' },
  { stage: '3. In Progress', count: 4, fill: '#2D8CFF' },
  { stage: '4. Completed', count: 3, fill: '#78AAA0' },
  { stage: '5. QA Verified', count: 2, fill: '#15803d' },
]

const CANCELLATION_RISK_DATA = [
  { tier: 'Low Risk (<20%)', bookings: 14, percentage: 70, fill: '#78AAA0' },
  { tier: 'Medium Risk (20-60%)', bookings: 4, percentage: 20, fill: '#D8C7AA' },
  { tier: 'High Risk (>60%)', bookings: 2, percentage: 10, fill: '#C96B56' },
]

type AnalyticsTab = 'occupancy' | 'readiness' | 'requests' | 'flow' | 'rates' | 'cancellations'

interface OpeningFeatureState {
  label: string
  path: string
  note: string
  color: string
}

function DashboardPage() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => AuthService.getCurrentUser())
  const [rooms, setRooms] = useState<ResortRoom[]>(INITIAL_ROOMS)
  const [selectedRoom, setSelectedRoom] = useState<ResortRoom | null>(INITIAL_ROOMS.find(r => r.id === '204') || null)
  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTab>('occupancy')
  const [activeWingFilter, setActiveWingFilter] = useState<string>('all')
  const [activeZone, setActiveZone] = useState<string>('reception')
  const [openingFeature, setOpeningFeature] = useState<OpeningFeatureState | null>(null)
  const [hoveredAction, setHoveredAction] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const pulseTrackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsub = AuthService.subscribeToAuthState((user) => {
      setCurrentUser(user)
    })
    return () => unsub()
  }, [])

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Resort Operations'

  // Time-aware greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase()

  // Active guest issues and total registered rooms derived from mock/seed stores
  const activeComplaintsCount = mockComplaints.filter(c => c.status !== 'resolved' && c.status !== 'closed').length
  const totalRegisteredRooms = mockRooms.length > 0 ? rooms.length : 20

  // Derived counts from current live room state
  const occupiedCount = rooms.filter(r => r.status === 'occupied').length
  const readyCount = rooms.filter(r => r.status === 'ready').length
  const cleaningCount = rooms.filter(r => r.status === 'cleaning').length
  const needsServiceCount = rooms.filter(r => r.status === 'needs_service').length
  const totalRooms = totalRegisteredRooms
  const occupancyPercentage = Math.round((occupiedCount / totalRooms) * 100)

  // ── GSAP & ScrollTrigger Experience Engine ──────────────────────────────────
  useEffect(() => {
    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion || !containerRef.current) return

    const ctx = gsap.context(() => {
      // 1. Staggered reveal for Hero & Pulse line
      gsap.fromTo(
        '.gsap-hero-item',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power2.out' }
      )

      gsap.fromTo(
        '.gsap-pulse-node',
        { opacity: 0, scale: 0.92, y: 12 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, stagger: 0.08, delay: 0.3, ease: 'back.out(1.2)' }
      )

      // 2. Zone Scroll Triggers for Active Zone Wayfinding & Background Transition
      const zones = [
        { id: 'zone-reception', key: 'reception', bg: '#F3EEE3' },
        { id: 'zone-rooms', key: 'rooms', bg: '#FBF9F4' },
        { id: 'zone-shift-attention', key: 'service', bg: '#F7F2EA' },
        { id: 'zone-staff-desk', key: 'operations', bg: '#1C3035' },
        { id: 'zone-intelligence', key: 'intelligence', bg: '#F3EEE3' },
      ]

      zones.forEach(({ id, key, bg }) => {
        const el = document.getElementById(id)
        if (!el) return

        ScrollTrigger.create({
          trigger: el,
          start: 'top 50%',
          end: 'bottom 50%',
          onEnter: () => {
            setActiveZone(key)
            if (containerRef.current && key !== 'operations') {
              gsap.to(containerRef.current, {
                backgroundColor: bg,
                duration: 0.8,
                ease: 'power1.out',
              })
            }
          },
          onEnterBack: () => {
            setActiveZone(key)
            if (containerRef.current && key !== 'operations') {
              gsap.to(containerRef.current, {
                backgroundColor: bg,
                duration: 0.8,
                ease: 'power1.out',
              })
            }
          },
        })
      })

      // 3. Staggered reveal of room directory plaques on scroll
      const roomBoardEl = document.getElementById('zone-rooms')
      if (roomBoardEl) {
        gsap.fromTo(
          '.gsap-room-plaque',
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.03,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: roomBoardEl,
              start: 'top 75%',
            },
          }
        )
      }

      // 4. Staggered reveal of shift timeline
      const shiftEl = document.getElementById('zone-shift-attention')
      if (shiftEl) {
        gsap.fromTo(
          '.gsap-shift-item',
          { opacity: 0, x: -16 },
          {
            opacity: 1,
            x: 0,
            duration: 0.55,
            stagger: 0.09,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: shiftEl,
              start: 'top 70%',
            },
          }
        )
      }

      // 5. Staff Desk console entrance
      const deskEl = document.getElementById('zone-staff-desk')
      if (deskEl) {
        gsap.fromTo(
          '.gsap-desk-tile',
          { opacity: 0, y: 16 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.05,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: deskEl,
              start: 'top 75%',
            },
          }
        )
      }
    }, containerRef)

    return () => ctx.revert()
  }, [])

  // Needs Attention Items
  const attentionItems = [
    {
      id: 'att-1',
      location: 'ROOM 204',
      problem: 'AC Cooling Failure',
      area: 'Maintenance',
      urgency: 'High Priority',
      assignedTo: 'Rahul Sharma',
      timestamp: '25m ago',
      actionLabel: 'Inspect',
      actionPath: '/tasks',
      badgeColor: 'bg-[#C96B56] text-white',
    },
    {
      id: 'att-2',
      location: 'ROOM 112',
      problem: 'Bathroom Plumbing Leak',
      area: 'Plumbing',
      urgency: 'Awaiting Staff',
      assignedTo: 'Unassigned',
      timestamp: '55m ago',
      actionLabel: 'Dispatch',
      actionPath: '/complaints',
      badgeColor: 'bg-[#5B9EA3] text-white',
    },
    {
      id: 'att-3',
      location: 'ROOM 305',
      problem: 'Extra Towels & Amenities',
      area: 'Housekeeping',
      urgency: 'Guest Request',
      assignedTo: 'Priya Nair',
      timestamp: '15m ago',
      actionLabel: 'Handle',
      actionPath: '/tasks',
      badgeColor: 'bg-[#78AAA0] text-white',
    },
    {
      id: 'att-4',
      location: 'ROOM RATES',
      problem: 'Weekend Rate Optimization',
      area: 'Revenue Desk',
      urgency: '+₹400 / Night Lift',
      assignedTo: 'Duty Manager',
      timestamp: '1h ago',
      actionLabel: 'Adjust Rate',
      actionPath: '/pricing',
      badgeColor: 'bg-[#1C3035] text-[#FBF9F4]',
    },
  ]

  // Interactive Room Status Update (Physical floor interaction)
  const handleMarkRoomReady = (roomId: string) => {
    setRooms(prev => prev.map(r => {
      if (r.id === roomId) {
        return {
          ...r,
          status: 'ready',
          activeIssue: undefined,
          assignedStaff: undefined,
          priority: undefined,
          lastUpdated: 'Just now',
        }
      }
      return r
    }))

    if (selectedRoom?.id === roomId) {
      setSelectedRoom(prev => prev ? {
        ...prev,
        status: 'ready',
        activeIssue: undefined,
        assignedStaff: undefined,
        priority: undefined,
        lastUpdated: 'Just now',
      } : null)
    }

    toast.success(`Room ${roomId} marked Ready`, {
      description: 'Housekeeping status updated. Room is cleared for immediate guest check-in.',
    })
  }

  const handleExportSummary = async () => {
    try {
      await api.downloadOperationsReport()
      toast.success('Operations report downloaded', {
        description: 'Latest resort metrics exported to CSV.',
      })
    } catch {
      toast.success('Operations summary ready', {
        description: `${totalRooms} rooms (${occupiedCount} occupied, ${readyCount} ready), ${mockTasks.length} active tasks, ${mockStaff.length} staff on duty.`,
      })
    }
  }

  // ── Feature Morphing Transition (Before Route Navigation) ─────────────────
  const handleFeatureClick = (feature: { label: string; path: string; note: string; color: string }) => {
    setOpeningFeature(feature)
    // Smooth architectural aperture transition before navigating
    setTimeout(() => {
      navigate({ to: feature.path })
      // Clear overlay shortly after navigation begins
      setTimeout(() => setOpeningFeature(null), 350)
    }, 450)
  }

  const scrollToZone = (zoneId: string) => {
    const el = document.getElementById(zoneId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const wings = [
    { id: 'all', label: 'Entire Resort (20 Rooms)' },
    { id: 'Ocean Wing', label: 'Ocean Wing' },
    { id: 'Garden Wing', label: 'Garden Wing' },
    { id: 'Coastline Suites', label: 'Coastline Suites' },
    { id: 'Beach Pavilions', label: 'Beach Pavilions' },
  ]

  const displayedRooms = activeWingFilter === 'all'
    ? rooms
    : rooms.filter(r => r.wing === activeWingFilter)

  return (
    <div
      ref={containerRef}
      className="w-full min-h-screen px-4 sm:px-6 lg:px-8 py-8 space-y-16 max-w-[1600px] mx-auto select-none font-manrope bg-[#F3EEE3] dark:bg-slate-950 text-[#1C3035] dark:text-slate-100 transition-colors duration-700 relative"
    >
      
      {/* ── VERTICAL RESORT WAYFINDING RAIL (Progressive Scroll Tracker) ── */}
      <aside
        aria-label="Resort floor journey navigation"
        className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-center gap-3 p-2.5 rounded-full bg-[#1C3035]/85 text-[#FBF9F4] backdrop-blur-md border border-[#FBF9F4]/20 shadow-[0_8px_30px_rgb(0,0,0,0.25)]"
      >
        <span className="text-[8px] font-black tracking-widest text-[#5B9EA3] rotate-180 [writing-mode:vertical-lr] pb-1 uppercase">
          JOURNEY
        </span>
        {[
          { id: 'zone-reception', key: 'reception', label: '01 Reception' },
          { id: 'zone-rooms', key: 'rooms', label: '02 Rooms' },
          { id: 'zone-shift-attention', key: 'service', label: '03 Shift & Attention' },
          { id: 'zone-staff-desk', key: 'operations', label: '04 Operations Desk' },
          { id: 'zone-intelligence', key: 'intelligence', label: '05 Intelligence' },
        ].map((pt) => {
          const isActive = activeZone === pt.key
          return (
            <button
              key={pt.key}
              type="button"
              onClick={() => scrollToZone(pt.id)}
              title={pt.label}
              className={`group relative flex items-center justify-center size-7 rounded-full transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#2D8CFF] text-white ring-2 ring-white/60 scale-110'
                  : 'hover:bg-white/20 text-slate-300'
              }`}
            >
              <span className={`size-2 rounded-full ${isActive ? 'bg-white' : 'bg-slate-400 group-hover:bg-white'}`} />
              <span className="absolute right-9 px-2 py-1 rounded bg-[#1C3035] text-[10px] font-black uppercase tracking-wider text-white border border-white/20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-md">
                {pt.label}
              </span>
            </button>
          )
        })}
      </aside>

      {/* ── FEATURE OPENING APERTURE PORTAL (Interactive Feature Morphing) ── */}
      {openingFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C3035]/90 backdrop-blur-md text-[#FBF9F4] p-6 animate-in fade-in duration-300">
          <div className="max-w-md w-full p-8 rounded-2xl border-2 border-white/20 bg-[#1C3035] shadow-[8px_8px_0px_#5B9EA3] space-y-5 text-center animate-in zoom-in-95 duration-300">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#5B9EA3] text-[10px] font-black uppercase tracking-widest border border-white/20">
              <Loader2 className="size-3 animate-spin text-[#2D8CFF]" />
              <span>Connecting Department Console</span>
            </span>

            <div className="space-y-1.5">
              <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                {openingFeature.label}
              </h3>
              <p className="text-xs text-[#D8C7AA] font-semibold">
                {openingFeature.note}
              </p>
            </div>

            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden border border-white/10">
              <div className="h-full bg-[#2D8CFF] animate-[pulse_0.8s_ease-in-out_infinite] w-full" />
            </div>

            <p className="text-[11px] text-slate-400 font-mono">
              Live Resort Telemetry Synchronized
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 1: RECEPTION & RESORT PULSE (Zone 1)
          Bright linen architecture, connected resort telemetry
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="zone-reception" className="space-y-6 pt-2">
        
        {/* Editorial Greeting Statement */}
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 border-b-2 border-[#1C3035]/20 dark:border-slate-800 pb-7">
          <div className="space-y-2 max-w-3xl gsap-hero-item">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#1C3035] text-[#FBF9F4] text-[10px] font-extrabold uppercase tracking-widest shadow-[2px_2px_0px_#5B9EA3]">
                <Compass className="size-3 text-[#5B9EA3]" />
                <span>Zone 01 · Front Desk Reception</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#78AAA0]/20 text-[#1C3035] dark:text-slate-200 border border-[#78AAA0]/40 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-[#78AAA0] animate-pulse" />
                <span>Property Operating Normally</span>
              </span>
            </div>

            <div className="pt-1">
              <p className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.2em] text-[#1C3035]/60 dark:text-slate-400">
                {greeting},
              </p>
              <h1 className="text-3xl sm:text-5xl lg:text-[56px] font-black text-[#1C3035] dark:text-white uppercase tracking-tight leading-none">
                {displayName}.
              </h1>
              <p className="text-sm sm:text-base font-bold text-[#1C3035]/80 dark:text-slate-300 mt-2">
                The resort is running smoothly. {needsServiceCount + 2} items require your shift attention today.
              </p>
            </div>
          </div>

          {/* Quick Date Stamp & Global Floor Actions */}
          <div className="flex flex-col items-start lg:items-end gap-3 shrink-0 w-full sm:w-auto gsap-hero-item">
            <div className="text-left lg:text-right hidden sm:block">
              <div className="text-xs font-black tracking-widest text-[#1C3035] dark:text-slate-200">
                {todayFormatted}
              </div>
              <div className="text-[11px] text-[#1C3035]/60 dark:text-slate-400 font-semibold tracking-wide">
                Duty Manager Shift (08:00 – 20:00)
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <Button
                onClick={handleExportSummary}
                variant="outline"
                className="flex-1 sm:flex-initial rounded-lg px-4 py-2.5 h-auto text-xs font-black border-2 border-[#1C3035] dark:border-slate-700 bg-[#FBF9F4] dark:bg-slate-900 text-[#1C3035] dark:text-white hover:bg-[#D8C7AA]/40 shadow-[2px_2px_0px_#1C3035] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all gap-1.5 cursor-pointer"
              >
                <Download className="size-3.5" />
                <span>Export Shift Log</span>
              </Button>

              <Button
                onClick={() => navigate({ to: '/resort-360' })}
                className="flex-1 sm:flex-initial rounded-lg px-4 py-2.5 h-auto text-xs font-black bg-[#2D8CFF] hover:bg-[#1A7BFA] text-white border-2 border-[#1C3035] shadow-[3px_3px_0px_#1C3035] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all gap-1.5 cursor-pointer"
              >
                <Eye className="size-3.5" />
                <span>Open 3D Spatial Twin →</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ── THE RESORT PULSE: Horizontal Connected Operational System ── */}
        <div className="rounded-xl border-2 border-[#1C3035] dark:border-slate-800 bg-[#FBF9F4] dark:bg-slate-900 p-5 sm:p-6 shadow-[4px_4px_0px_#1C3035] dark:shadow-[4px_4px_0px_#0f172a] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1C3035]/15 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5B9EA3]" />
              <span className="text-xs font-black uppercase tracking-widest text-[#1C3035] dark:text-white">
                Resort Pulse · Connected Property Status
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              ONE RESORT · ONE PULSE
            </span>
          </div>

          {/* Connected Status Line with Nodes */}
          <div ref={pulseTrackRef} className="grid grid-cols-2 md:grid-cols-5 gap-6 relative">
            
            {/* Status 1: Rooms */}
            <div className="space-y-1 relative gsap-pulse-node">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5B9EA3]" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">ROOMS</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#1C3035] dark:text-white">
                {occupancyPercentage}%
              </div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {occupiedCount} occupied · {readyCount} ready
              </p>
            </div>

            {/* Status 2: Guests */}
            <div className="space-y-1 relative gsap-pulse-node">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C96B56]" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">GUESTS</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#1C3035] dark:text-white">
                {activeComplaintsCount < 10 ? `0${activeComplaintsCount}` : activeComplaintsCount}
              </div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Active requests · 1 high priority
              </p>
            </div>

            {/* Status 3: Tasks */}
            <div className="space-y-1 relative gsap-pulse-node">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2D8CFF]" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">TASKS</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#1C3035] dark:text-white">
                04
              </div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Tasks due now · 34m avg SLA
              </p>
            </div>

            {/* Status 4: Staff */}
            <div className="space-y-1 relative gsap-pulse-node">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#78AAA0]" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">STAFF</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#1C3035] dark:text-white">
                04
              </div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                On duty · 100% floor coverage
              </p>
            </div>

            {/* Status 5: Room Rates / Revenue */}
            <div className="space-y-1 relative col-span-2 md:col-span-1 gsap-pulse-node">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D8C7AA]" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">ROOM RATES</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400">
                +₹400
              </div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Weekend rate opportunity
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── EDITORIAL TRANSITION 01: INTO ROOMS ── */}
      <div className="flex items-center gap-4 py-2">
        <span className="text-[11px] font-mono font-bold text-[#1C3035]/40 dark:text-slate-500 tracking-widest uppercase">
          ZONE 02 · PROPERTY FLOORS
        </span>
        <div className="flex-1 h-[2px] bg-[#1C3035]/15 dark:bg-slate-800" />
        <span className="text-xs font-black uppercase tracking-widest text-[#1C3035] dark:text-slate-300">
          EVERY ROOM HAS A STORY
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 2: MAIN VISUAL — LIVE RESORT / ROOM BOARD
          Architectural Room Board + Progressive Disclosure Context Panel
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="zone-rooms" className="space-y-4">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#1C3035]/20 dark:border-slate-800 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Building className="size-4 text-[#5B9EA3]" />
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#1C3035] dark:text-white">
                Live Resort & Room Board
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
              Interactive property floor view. Select any room to inspect occupancy, guest needs, or change readiness.
            </p>
          </div>

          {/* Wing Filter Buttons */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {wings.map(w => (
              <button
                key={w.id}
                type="button"
                onClick={() => setActiveWingFilter(w.id)}
                className={`px-3 py-1 rounded text-xs font-black transition-all cursor-pointer ${
                  activeWingFilter === w.id
                    ? 'bg-[#1C3035] text-[#FBF9F4] shadow-[2px_2px_0px_#5B9EA3]'
                    : 'bg-[#FBF9F4] dark:bg-slate-900 border border-[#1C3035]/30 text-slate-700 dark:text-slate-300 hover:bg-[#D8C7AA]/40'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Visual Room Board & Context Panel Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: 20-Room Physical Resort Board (8 cols on lg) */}
          <div className="lg:col-span-8 rounded-xl border-2 border-[#1C3035] dark:border-slate-800 bg-[#FBF9F4] dark:bg-slate-900 p-5 sm:p-6 shadow-[4px_4px_0px_#1C3035] space-y-6">
            
            {/* Status Legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1C3035]/15 dark:border-slate-800 text-xs font-bold">
              <span className="text-slate-500 uppercase text-[10px] tracking-wider font-black">
                Room State Key:
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded-xs bg-[#5B9EA3]" />
                  <span>Ready ({readyCount})</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded-xs bg-[#1C3035] dark:bg-slate-700" />
                  <span>Occupied ({occupiedCount})</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded-xs bg-[#78AAA0]" />
                  <span>Cleaning ({cleaningCount})</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded-xs bg-[#C96B56]" />
                  <span>Needs Service ({needsServiceCount})</span>
                </span>
              </div>
            </div>

            {/* Room Plaques Grid (Physical Hospitality Signage Design) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
              {displayedRooms.map((room) => {
                const isSelected = selectedRoom?.id === room.id
                
                // Color mapping for physical signs
                let badgeBg = 'bg-[#1C3035] text-[#FBF9F4]'
                let statusLabel = 'OCCUPIED'
                let borderStyle = 'border-[#1C3035]/30'

                if (room.status === 'ready') {
                  badgeBg = 'bg-[#5B9EA3] text-white'
                  statusLabel = 'READY'
                } else if (room.status === 'cleaning') {
                  badgeBg = 'bg-[#78AAA0] text-[#1C3035]'
                  statusLabel = 'CLEANING'
                } else if (room.status === 'needs_service') {
                  badgeBg = 'bg-[#C96B56] text-white animate-pulse'
                  statusLabel = 'NEEDS SERVICE'
                  borderStyle = 'border-[#C96B56] ring-2 ring-[#C96B56]/30'
                }

                return (
                  <div
                    key={room.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedRoom(room)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedRoom(room)
                      }
                    }}
                    className={`gsap-room-plaque p-3.5 rounded-lg border-2 bg-[#F3EEE3]/80 dark:bg-slate-800/80 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[110px] text-left focus:outline-none ${borderStyle} ${
                      isSelected
                        ? 'border-[#2D8CFF] ring-2 ring-[#2D8CFF] shadow-[3px_3px_0px_#2D8CFF] -translate-y-1'
                        : 'hover:border-[#1C3035] hover:shadow-[3px_3px_0px_#1C3035] hover:-translate-y-0.5'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        {/* Large Architectural Room Number Motif */}
                        <span className="text-xl sm:text-2xl font-black text-[#1C3035] dark:text-white tracking-tight">
                          {room.number}
                        </span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${badgeBg}`}>
                          {statusLabel}
                        </span>
                      </div>
                      
                      <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5 truncate">
                        {room.wing.replace(' Wing', '').replace(' Suites', '').replace(' Pavilions', '')} · {room.type}
                      </div>
                    </div>

                    {/* Small Context Info */}
                    <div className="pt-2 border-t border-[#1C3035]/10 dark:border-slate-700/60 mt-2">
                      {room.status === 'needs_service' ? (
                        <p className="text-[10px] font-extrabold text-[#C96B56] truncate">
                          ⚠️ AC Issue · Rahul
                        </p>
                      ) : room.status === 'cleaning' ? (
                        <p className="text-[10px] font-bold text-[#78AAA0] truncate">
                          🧹 Turnover · Priya
                        </p>
                      ) : room.guestName ? (
                        <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                          👤 {room.guestName}
                        </p>
                      ) : (
                        <p className="text-[10px] font-bold text-[#5B9EA3] truncate">
                          ✓ Available Check-in
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Room Board Footer Wayfinding */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <BedDouble className="size-3.5 text-[#5B9EA3]" />
                <span>Showing {displayedRooms.length} of {totalRooms} rooms across resort grounds</span>
              </span>
              <button
                type="button"
                onClick={() => handleFeatureClick({ label: 'Rooms 360', path: '/rooms-360', note: 'Interactive virtual room inspection', color: '#5B9EA3' })}
                className="inline-flex items-center gap-1 text-xs font-black text-[#2D8CFF] hover:underline cursor-pointer"
              >
                <span>Open 360° Virtual Room Inspection →</span>
              </button>
            </div>
          </div>

          {/* RIGHT: PROGRESSIVE DISCLOSURE CONTEXT PANEL (4 cols on lg) */}
          <div className="lg:col-span-4 rounded-xl border-2 border-[#1C3035] dark:border-slate-800 bg-[#FBF9F4] dark:bg-slate-900 p-5 sm:p-6 shadow-[4px_4px_0px_#1C3035] space-y-4">
            {selectedRoom ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                
                {/* Panel Header */}
                <div className="flex items-start justify-between border-b-2 border-[#1C3035]/15 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Room Context & Actions
                    </span>
                    <h3 className="text-3xl font-black text-[#1C3035] dark:text-white tracking-tight mt-0.5">
                      ROOM {selectedRoom.number}
                    </h3>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      {selectedRoom.wing} · {selectedRoom.type}
                    </p>
                  </div>

                  <span className={`text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider ${
                    selectedRoom.status === 'ready'
                      ? 'bg-[#5B9EA3] text-white'
                      : selectedRoom.status === 'needs_service'
                      ? 'bg-[#C96B56] text-white'
                      : selectedRoom.status === 'cleaning'
                      ? 'bg-[#78AAA0] text-[#1C3035]'
                      : 'bg-[#1C3035] text-[#FBF9F4]'
                  }`}>
                    {selectedRoom.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Details Table / Plaque */}
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-lg bg-[#F3EEE3]/80 dark:bg-slate-800/60 border border-[#1C3035]/15 space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-500">Guest Information</span>
                    <p className="font-bold text-[#1C3035] dark:text-white">
                      {selectedRoom.guestName ? selectedRoom.guestName : 'No guest registered (Ready for Arrival)'}
                    </p>
                  </div>

                  {selectedRoom.activeIssue && (
                    <div className="p-3 rounded-lg bg-[#C96B56]/10 border border-[#C96B56]/30 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-[#C96B56]">Active Issue</span>
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-[#C96B56] text-white">
                          {selectedRoom.priority || 'High'} Priority
                        </span>
                      </div>
                      <p className="font-bold text-[#1C3035] dark:text-white text-xs">
                        {selectedRoom.activeIssue}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-[#F3EEE3]/80 dark:bg-slate-800/60 border border-[#1C3035]/15">
                      <span className="text-[10px] font-black uppercase text-slate-500 block">Assigned Staff</span>
                      <span className="font-bold text-[#1C3035] dark:text-white">
                        {selectedRoom.assignedStaff || 'None assigned'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#F3EEE3]/80 dark:bg-slate-800/60 border border-[#1C3035]/15">
                      <span className="text-[10px] font-black uppercase text-slate-500 block">Nightly Rate</span>
                      <span className="font-bold text-[#1C3035] dark:text-white">
                        ₹{selectedRoom.rate.toLocaleString()} / night
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] font-semibold text-slate-500 pt-1">
                    Last status verification: <span className="font-bold text-[#1C3035] dark:text-slate-300">{selectedRoom.lastUpdated}</span>
                  </div>
                </div>

                {/* Direct Hospitality Actions */}
                <div className="space-y-2 pt-2 border-t border-[#1C3035]/15 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Operational Verbs:
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleFeatureClick({ label: 'Rooms 360', path: '/rooms-360', note: 'Viewing Room 360 VR tour', color: '#1C3035' })}
                      className="rounded-lg text-xs font-black bg-[#1C3035] hover:bg-[#2A444B] text-[#FBF9F4] border border-[#1C3035] gap-1 cursor-pointer"
                    >
                      <Camera className="size-3.5 text-[#5B9EA3]" />
                      <span>View 360°</span>
                    </Button>

                    <Button
                      onClick={() => handleFeatureClick({ label: 'Tasks to Do', path: '/tasks', note: 'Assigning staff to Room task', color: '#2D8CFF' })}
                      variant="outline"
                      className="rounded-lg text-xs font-black border-2 border-[#1C3035] bg-[#FBF9F4] dark:bg-slate-800 text-[#1C3035] dark:text-white hover:bg-[#D8C7AA]/40 gap-1 cursor-pointer"
                    >
                      <Wrench className="size-3.5 text-[#2D8CFF]" />
                      <span>Assign Staff</span>
                    </Button>
                  </div>

                  {selectedRoom.status !== 'ready' && (
                    <Button
                      onClick={() => handleMarkRoomReady(selectedRoom.id)}
                      className="w-full rounded-lg text-xs font-black bg-[#5B9EA3] hover:bg-[#4A878C] text-white border-2 border-[#1C3035] shadow-[2px_2px_0px_#1C3035] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="size-4" />
                      <span>Mark Room as Ready for Check-in</span>
                    </Button>
                  )}
                </div>

              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <BedDouble className="size-8 mx-auto text-slate-400" />
                <p className="text-sm font-bold">Select any room on the board</p>
                <p className="text-xs">Click a room to view guest info, assign housekeeping, or change readiness.</p>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ── EDITORIAL TRANSITION 02: INTO SHIFT & ATTENTION ── */}
      <div className="flex items-center gap-4 py-2">
        <span className="text-[11px] font-mono font-bold text-[#1C3035]/40 dark:text-slate-500 tracking-widest uppercase">
          ZONE 03 · GUEST CARE
        </span>
        <div className="flex-1 h-[2px] bg-[#1C3035]/15 dark:bg-slate-800" />
        <span className="text-xs font-black uppercase tracking-widest text-[#C96B56]">
          SERVICE STARTS WITH SEEING
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 3: TODAY'S SHIFT & NEEDS ATTENTION QUEUE
          Shift Timeline + Real Operational Queue
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="zone-shift-attention" className="space-y-8">
        
        {/* Shift Schedule Timeline */}
        <div className="rounded-xl border-2 border-[#1C3035] dark:border-slate-800 bg-[#FBF9F4] dark:bg-slate-900 p-5 sm:p-6 shadow-[4px_4px_0px_#1C3035] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2 border-[#1C3035]/15 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-[#2D8CFF]" />
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#1C3035] dark:text-white">
                Today's Shift · Operations Schedule
              </h2>
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Flow of the Resort Day
            </span>
          </div>

          {/* Horizontal Shift Timeline Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1">
            {SHIFT_MILESTONES.map((item, idx) => (
              <div
                key={idx}
                className={`gsap-shift-item p-4 rounded-lg border-2 transition-all relative flex flex-col justify-between ${
                  item.status === 'active'
                    ? 'border-[#2D8CFF] bg-[#2D8CFF]/10 ring-2 ring-[#2D8CFF]/30 shadow-[2px_2px_0px_#2D8CFF]'
                    : item.status === 'completed'
                    ? 'border-[#1C3035]/20 bg-[#F3EEE3]/50 dark:bg-slate-800/40 opacity-80'
                    : 'border-[#1C3035]/20 bg-[#FBF9F4] dark:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-black tracking-wider text-[#1C3035] dark:text-white">
                      {item.time}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${
                      item.status === 'active'
                        ? 'bg-[#2D8CFF] text-white'
                        : item.status === 'completed'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {item.status === 'active' ? 'NOW' : item.status}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-black text-[#1C3035] dark:text-white uppercase tracking-tight">
                    {item.title}
                  </h3>
                  <div className="text-xs font-extrabold text-[#5B9EA3] mt-0.5">
                    {item.count}
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-2 pt-2 border-t border-[#1C3035]/10 dark:border-slate-700">
                  {item.note}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Needs Attention Queue & Today's Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: NEEDS ATTENTION QUEUE (7 cols on lg) */}
          <div className="lg:col-span-7 rounded-xl border-2 border-[#1C3035] dark:border-slate-800 bg-[#FBF9F4] dark:bg-slate-900 p-5 sm:p-6 shadow-[4px_4px_0px_#1C3035] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#1C3035]/15 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-[#C96B56]" />
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#1C3035] dark:text-white">
                  Needs Attention · Operational Queue
                </h2>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#C96B56]/15 text-[#C96B56] border border-[#C96B56]/30 uppercase tracking-wider">
                {attentionItems.length} Urgent Items
              </span>
            </div>

            {/* Operational Queue Rows */}
            <div className="space-y-3">
              {attentionItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-lg border-2 border-[#1C3035]/20 dark:border-slate-800 bg-[#F3EEE3]/70 dark:bg-slate-800/50 hover:border-[#1C3035] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded tracking-wider uppercase ${item.badgeColor}`}>
                        {item.location}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase text-slate-500">
                        {item.area} · {item.urgency}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {item.timestamp}
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-black text-[#1C3035] dark:text-white uppercase tracking-tight">
                      {item.problem}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      Responsible: <span className="font-bold text-[#1C3035] dark:text-slate-200">{item.assignedTo}</span>
                    </p>
                  </div>

                  <Button
                    onClick={() => handleFeatureClick({ label: item.problem, path: item.actionPath, note: `Proceeding to ${item.area} dispatch`, color: '#2D8CFF' })}
                    className="rounded-lg px-4 py-2 h-auto text-xs font-black bg-[#2D8CFF] hover:bg-[#1A7BFA] text-white border-2 border-[#1C3035] shadow-[2px_2px_0px_#1C3035] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all gap-1.5 shrink-0 self-start sm:self-center cursor-pointer"
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: TODAY'S ACTIVITY (5 cols on lg) */}
          <div className="lg:col-span-5 rounded-xl border-2 border-[#1C3035] dark:border-slate-800 bg-[#FBF9F4] dark:bg-slate-900 p-5 sm:p-6 shadow-[4px_4px_0px_#1C3035] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#1C3035]/15 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#78AAA0]" />
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#1C3035] dark:text-white">
                  Today's Activity
                </h2>
              </div>
              <button
                type="button"
                onClick={() => handleFeatureClick({ label: 'Audit Trail & Log', path: '/audit', note: 'Loading tamper-proof operational audit trail', color: '#1C3035' })}
                className="text-xs font-black text-[#2D8CFF] hover:underline cursor-pointer"
              >
                Full Log →
              </button>
            </div>

            {/* Activity Feed */}
            <div className="space-y-2.5 text-xs">
              {[
                { time: '18:42', person: 'Rahul Sharma', room: 'Room 204', desc: 'completed AC repair unit inspection' },
                { time: '18:31', person: 'Sneha Reddy', room: 'Room 305', desc: 'requested 2 extra bath towels' },
                { time: '18:18', person: 'Housekeeping', room: 'Room 105', desc: 'marked ready for guest check-in' },
                { time: '18:04', person: 'Priya Nair', room: 'Room 210', desc: 'assigned to evening turn-down inspection' },
                { time: '17:52', person: 'Duty Manager', room: 'Room 201', desc: 'verified villa turnover with photo QA' },
              ].map((act, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-[#F3EEE3]/60 dark:bg-slate-800/40 border border-[#1C3035]/15 dark:border-slate-700 flex items-start gap-2.5"
                >
                  <span className="text-[11px] font-mono font-bold text-slate-500 w-12 shrink-0 pt-0.5">
                    {act.time}
                  </span>
                  <p className="text-xs font-medium text-[#1C3035] dark:text-slate-200 leading-snug">
                    <span className="font-extrabold text-[#1C3035] dark:text-white">{act.person}</span>{' '}
                    ({act.room}) {act.desc}.
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#1C3035]/10 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>Real-time operations log</span>
              <span className="text-[#5B9EA3]">✓ Live & Synchronized</span>
            </div>
          </div>

        </div>
      </section>

      {/* ── EDITORIAL TRANSITION 03: INTO OPERATIONS DESK ── */}
      <div className="flex items-center gap-4 py-2">
        <span className="text-[11px] font-mono font-bold text-[#1C3035]/40 dark:text-slate-500 tracking-widest uppercase">
          ZONE 04 · OPERATIONS ENGINE
        </span>
        <div className="flex-1 h-[2px] bg-[#1C3035]/15 dark:bg-slate-800" />
        <span className="text-xs font-black uppercase tracking-widest text-[#5B9EA3]">
          THE ENGINE BEHIND THE LUXURY
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 4: STAFF DESK & OPERATIONS CONSOLE
          Deep behind-the-scenes resort engine with microcopy & feature morphing
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="zone-staff-desk"
        className="rounded-2xl border-2 border-[#1C3035] dark:border-slate-800 bg-[#1C3035] text-[#FBF9F4] p-6 sm:p-8 shadow-[6px_6px_0px_#5B9EA3] space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-white/15 pb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-[#5B9EA3]" />
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
                Staff Desk & Operations Console
              </h2>
            </div>
            <p className="text-xs text-[#D8C7AA] font-semibold">
              Live interactive operations bridge. Click any console to morph into its department.
            </p>
          </div>
          <span className="text-[10px] font-mono font-extrabold px-3 py-1 rounded bg-white/10 text-[#5B9EA3] border border-white/20 uppercase tracking-widest">
            HOTEL CONSOLE · ACTIVE
          </span>
        </div>

        {/* ── Quick Action Dock with Contextual Microcopy Hover Reveals ── */}
        <div className="p-4 rounded-xl border border-white/20 bg-white/5 backdrop-blur-xs space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
            <span className="uppercase tracking-widest font-black text-[#5B9EA3]">
              Quick Shift Verbs
            </span>
            <span className="font-mono text-[10px] text-[#D8C7AA]">
              {hoveredAction ? hoveredAction : 'Hover any button to preview action'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onMouseEnter={() => setHoveredAction('Tell us what needs attention across rooms')}
              onMouseLeave={() => setHoveredAction(null)}
              onClick={() => handleFeatureClick({ label: 'Guest Requests & Issues', path: '/complaints', note: 'Creating new guest issue report', color: '#C96B56' })}
              className="rounded-lg text-xs font-black bg-[#C96B56] hover:bg-[#b55b46] text-white border border-white/20 shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer gap-1.5 transition-all"
            >
              <ClipboardList className="size-3.5" />
              <span>+ Report Issue</span>
            </Button>

            <Button
              onMouseEnter={() => setHoveredAction('Dispatch staff with automated skill-matching & SLA')}
              onMouseLeave={() => setHoveredAction(null)}
              onClick={() => handleFeatureClick({ label: 'Tasks to Do', path: '/tasks', note: 'Opening task dispatch manager', color: '#2D8CFF' })}
              className="rounded-lg text-xs font-black bg-[#2D8CFF] hover:bg-[#1A7BFA] text-white border border-white/20 shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer gap-1.5 transition-all"
            >
              <CheckSquare className="size-3.5" />
              <span>+ Assign Task</span>
            </Button>

            <Button
              onMouseEnter={() => setHoveredAction('Inspect 360° virtual room readiness & panoramas')}
              onMouseLeave={() => setHoveredAction(null)}
              onClick={() => handleFeatureClick({ label: 'Rooms 360 Virtual Inspection', path: '/rooms-360', note: 'Launching virtual room tour', color: '#5B9EA3' })}
              className="rounded-lg text-xs font-black bg-[#5B9EA3] hover:bg-[#4A878C] text-white border border-white/20 shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer gap-1.5 transition-all"
            >
              <Camera className="size-3.5" />
              <span>+ Check Room</span>
            </Button>

            <Button
              onMouseEnter={() => setHoveredAction('Monitor staff shifts, attendance, and department load')}
              onMouseLeave={() => setHoveredAction(null)}
              onClick={() => handleFeatureClick({ label: 'Staff on Duty', path: '/staff', note: 'Opening duty roster & attendance', color: '#78AAA0' })}
              variant="outline"
              className="rounded-lg text-xs font-black border-2 border-white/30 bg-transparent text-white hover:bg-white/10 shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer gap-1.5 transition-all"
            >
              <Users className="size-3.5 text-[#78AAA0]" />
              <span>+ View Staff</span>
            </Button>

            <Button
              onMouseEnter={() => setHoveredAction('Inspect photo proof of completed maintenance & housekeeping')}
              onMouseLeave={() => setHoveredAction(null)}
              onClick={() => handleFeatureClick({ label: 'Check Completed Work', path: '/verification', note: 'Opening QA photo proof sign-off', color: '#15803d' })}
              variant="outline"
              className="rounded-lg text-xs font-black border-2 border-white/30 bg-transparent text-white hover:bg-white/10 shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer gap-1.5 transition-all"
            >
              <ShieldCheck className="size-3.5 text-emerald-400" />
              <span>+ Check Completed Work</span>
            </Button>
          </div>
        </div>

        {/* ── Staff Desk Rails (Hospitality Words Only with Interactive Micro-Animations) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {[
            { label: 'Rooms 360', path: '/rooms-360', icon: Camera, note: 'Virtual room directory', color: 'text-[#5B9EA3]' },
            { label: 'Guest Requests', path: '/complaints', icon: ClipboardList, note: '8 active issues', color: 'text-[#C96B56]' },
            { label: 'Tasks to Do', path: '/tasks', icon: CheckSquare, note: '4 dispatched', color: 'text-[#2D8CFF]' },
            { label: 'Staff on Duty', path: '/staff', icon: Users, note: '4 active roster', color: 'text-[#78AAA0]' },
            { label: 'Check Completed Work', path: '/verification', icon: ShieldCheck, note: 'Photo QA sign-off', color: 'text-emerald-400' },
            { label: 'Room Rates', path: '/pricing', icon: TrendingUp, note: 'Competitor benchmarks', color: 'text-[#D8C7AA]' },
            { label: 'Bookings at Risk', path: '/cancellation-risk', icon: BrainCircuit, note: 'Retention steps', color: 'text-[#C96B56]' },
            { label: 'Guest Preferences', path: '/recommendations', icon: Sparkles, note: 'Semantic matching', color: 'text-[#5B9EA3]' },
            { label: 'Resort Reports', path: '/insights', icon: ChartNoAxesCombined, note: 'SLA & efficiency', color: 'text-[#2D8CFF]' },
            { label: 'Audit Trail', path: '/audit', icon: History, note: 'Governance logs', color: 'text-white' },
          ].map((action, idx) => {
            const Icon = action.icon
            return (
              <div
                key={idx}
                role="button"
                tabIndex={0}
                onClick={() => handleFeatureClick({ label: action.label, path: action.path, note: action.note, color: action.color })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleFeatureClick({ label: action.label, path: action.path, note: action.note, color: action.color })
                  }
                }}
                className="gsap-desk-tile group p-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 hover:border-[#5B9EA3] hover:shadow-[4px_4px_0px_#5B9EA3] hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between focus:outline-none relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded border border-white/20 flex items-center justify-center bg-white/5 group-hover:scale-110 transition-transform">
                    <Icon className={`size-4 ${action.color}`} />
                  </div>
                  <ArrowUpRight className="size-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
                
                <div className="pt-3 mt-1">
                  <div className="text-xs sm:text-sm font-black text-white uppercase tracking-tight group-hover:text-[#5B9EA3] transition-colors">
                    {action.label}
                  </div>
                  <div className="text-[10px] text-slate-300 font-semibold truncate group-hover:translate-x-1 transition-transform">
                    {action.note}
                  </div>
                </div>

                {/* Subtle bottom accent line that draws on hover */}
                <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full bg-[#5B9EA3] transition-all duration-300" />
              </div>
            )
          })}
        </div>
      </section>

      {/* ── EDITORIAL TRANSITION 04: INTO RESORT INTELLIGENCE ── */}
      <div className="flex items-center gap-4 py-2">
        <span className="text-[11px] font-mono font-bold text-[#1C3035]/40 dark:text-slate-500 tracking-widest uppercase">
          ZONE 05 · STRATEGIC INTELLIGENCE
        </span>
        <div className="flex-1 h-[2px] bg-[#1C3035]/15 dark:bg-slate-800" />
        <span className="text-xs font-black uppercase tracking-widest text-[#2D8CFF]">
          RUN THE RESORT. UNDERSTAND THE RESORT.
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 5: RESORT INTELLIGENCE & DATA ANALYSIS
          Calm strategic manager's workspace placed strictly at the bottom
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="zone-intelligence"
        className="rounded-xl border-2 border-[#1C3035] dark:border-slate-800 bg-[#FBF9F4] dark:bg-slate-900 p-6 sm:p-8 shadow-[5px_5px_0px_#1C3035] space-y-6"
      >
        
        {/* Workspace Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-2 border-[#1C3035]/15 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#5B9EA3] rounded-xs" />
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#1C3035] dark:text-white">
                Resort Intelligence & Data Analysis
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
              Managerial trends, SLA metrics, revenue optimization, and retention models.
            </p>
          </div>

          {/* Analytics Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'occupancy', label: 'Occupancy Trend' },
              { id: 'readiness', label: 'Room Readiness' },
              { id: 'requests', label: 'Guest Requests' },
              { id: 'flow', label: 'Task Flow' },
              { id: 'rates', label: 'Room Rates' },
              { id: 'cancellations', label: 'Bookings at Risk' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAnalyticsTab(tab.id as AnalyticsTab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  analyticsTab === tab.id
                    ? 'bg-[#2D8CFF] text-white shadow-[2px_2px_0px_#1C3035]'
                    : 'bg-[#F3EEE3] dark:bg-slate-800 border border-[#1C3035]/30 text-slate-700 dark:text-slate-300 hover:bg-[#D8C7AA]/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Dynamic Tab View Content ── */}
        <div className="min-h-[320px]">
          
          {/* TAB 1: OCCUPANCY TREND */}
          {analyticsTab === 'occupancy' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black uppercase text-[#1C3035] dark:text-white">
                    7-Day Occupancy Trend & RevPAR
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Property averaging 81.7% occupancy with weekend peaks at 91%.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-black">
                  <span className="text-[#5B9EA3]">● Occupancy Rate (%)</span>
                  <span className="text-[#1C3035] dark:text-slate-200">Current: {occupancyPercentage}%</span>
                </div>
              </div>

              <div className="w-full h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={OCCUPANCY_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5B9EA3" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#5B9EA3" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1C3035" opacity={0.1} />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={11} fontWeight={700} />
                    <YAxis domain={[50, 100]} stroke="#64748b" fontSize={11} fontWeight={700} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1C3035',
                        borderColor: '#5B9EA3',
                        color: '#FBF9F4',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '12px',
                      }}
                      formatter={(value: any) => [`${value}% Occupied`, 'Capacity']}
                    />
                    <Area
                      type="monotone"
                      dataKey="occupancy"
                      stroke="#5B9EA3"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#occupancyGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center text-xs">
                <div className="p-3 rounded-lg bg-[#F3EEE3]/80 dark:bg-slate-800/60 border border-[#1C3035]/15">
                  <span className="text-[10px] font-black uppercase text-slate-500">Weekly Average</span>
                  <div className="text-lg font-black text-[#1C3035] dark:text-white">81.7%</div>
                </div>
                <div className="p-3 rounded-lg bg-[#F3EEE3]/80 dark:bg-slate-800/60 border border-[#1C3035]/15">
                  <span className="text-[10px] font-black uppercase text-slate-500">Saturday Peak</span>
                  <div className="text-lg font-black text-[#5B9EA3]">91.0%</div>
                </div>
                <div className="p-3 rounded-lg bg-[#F3EEE3]/80 dark:bg-slate-800/60 border border-[#1C3035]/15">
                  <span className="text-[10px] font-black uppercase text-slate-500">RevPAR Peak</span>
                  <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">₹5,460</div>
                </div>
                <div className="p-3 rounded-lg bg-[#F3EEE3]/80 dark:bg-slate-800/60 border border-[#1C3035]/15">
                  <span className="text-[10px] font-black uppercase text-slate-500">Downtime</span>
                  <div className="text-lg font-black text-slate-600 dark:text-slate-300">0%</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ROOM READINESS */}
          {analyticsTab === 'readiness' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black uppercase text-[#1C3035] dark:text-white">
                    Room Readiness Breakdown (20 Total Rooms)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Floor status distribution across all 4 resort wings.
                  </p>
                </div>
                <Button
                  onClick={() => handleFeatureClick({ label: 'Rooms 360', path: '/rooms-360', note: 'Inspecting property rooms in 360°', color: '#5B9EA3' })}
                  variant="outline"
                  size="sm"
                  className="text-xs font-black border-2 border-[#1C3035] bg-[#FBF9F4] text-[#1C3035]"
                >
                  Inspect Rooms in 360° →
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                <div className="p-4 rounded-xl border-2 border-[#5B9EA3] bg-[#5B9EA3]/10 space-y-1">
                  <span className="text-xs font-black uppercase text-[#5B9EA3]">Ready Rooms</span>
                  <div className="text-3xl font-black text-[#1C3035] dark:text-white">{readyCount}</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Immediate check-in</p>
                </div>

                <div className="p-4 rounded-xl border-2 border-[#1C3035] bg-[#1C3035]/5 space-y-1">
                  <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-300">Occupied</span>
                  <div className="text-3xl font-black text-[#1C3035] dark:text-white">{occupiedCount}</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">In-house guests</p>
                </div>

                <div className="p-4 rounded-xl border-2 border-[#78AAA0] bg-[#78AAA0]/10 space-y-1">
                  <span className="text-xs font-black uppercase text-[#78AAA0]">Housekeeping</span>
                  <div className="text-3xl font-black text-[#1C3035] dark:text-white">{cleaningCount}</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Turnover in progress</p>
                </div>

                <div className="p-4 rounded-xl border-2 border-[#C96B56] bg-[#C96B56]/10 space-y-1">
                  <span className="text-xs font-black uppercase text-[#C96B56]">Needs Service</span>
                  <div className="text-3xl font-black text-[#1C3035] dark:text-white">{needsServiceCount}</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">AC maintenance active</p>
                </div>
              </div>

              {/* Composition Bar */}
              <div className="space-y-1 pt-2">
                <div className="text-xs font-bold text-slate-500">Resort Floor Readiness Ratio</div>
                <div className="h-6 w-full rounded-lg overflow-hidden flex border-2 border-[#1C3035]">
                  <div style={{ width: `${(occupiedCount / totalRooms) * 100}%` }} className="bg-[#1C3035] text-white text-[10px] font-black flex items-center justify-center" title="Occupied">
                    {occupiedCount}
                  </div>
                  <div style={{ width: `${(readyCount / totalRooms) * 100}%` }} className="bg-[#5B9EA3] text-white text-[10px] font-black flex items-center justify-center" title="Ready">
                    {readyCount}
                  </div>
                  <div style={{ width: `${(cleaningCount / totalRooms) * 100}%` }} className="bg-[#78AAA0] text-[#1C3035] text-[10px] font-black flex items-center justify-center" title="Cleaning">
                    {cleaningCount}
                  </div>
                  <div style={{ width: `${(needsServiceCount / totalRooms) * 100}%` }} className="bg-[#C96B56] text-white text-[10px] font-black flex items-center justify-center" title="Needs Service">
                    {needsServiceCount}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GUEST REQUESTS */}
          {analyticsTab === 'requests' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black uppercase text-[#1C3035] dark:text-white">
                    Guest Requests by Department
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    8 total active requests · 94% on-track within SLA target.
                  </p>
                </div>
                <Button
                  onClick={() => handleFeatureClick({ label: 'Guest Requests', path: '/complaints', note: 'Opening guest desk issues', color: '#C96B56' })}
                  variant="outline"
                  size="sm"
                  className="text-xs font-black border-2 border-[#1C3035] bg-[#FBF9F4] text-[#1C3035]"
                >
                  Manage Guest Desk →
                </Button>
              </div>

              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={REQUEST_CATEGORIES} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1C3035" opacity={0.1} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontWeight={700} />
                    <YAxis allowDecimals={false} stroke="#64748b" fontSize={11} fontWeight={700} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1C3035',
                        borderColor: '#5B9EA3',
                        color: '#FBF9F4',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {REQUEST_CATEGORIES.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 4: TASK FLOW */}
          {analyticsTab === 'flow' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black uppercase text-[#1C3035] dark:text-white">
                    Shift Service Lifecycle Flow
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Real progression from Guest Request → Assigned → In Progress → Completed → Verified.
                  </p>
                </div>
                <Button
                  onClick={() => handleFeatureClick({ label: 'Tasks to Do', path: '/tasks', note: 'Opening task dispatch flow', color: '#2D8CFF' })}
                  variant="outline"
                  size="sm"
                  className="text-xs font-black border-2 border-[#1C3035] bg-[#FBF9F4] text-[#1C3035]"
                >
                  Open Task Dispatch →
                </Button>
              </div>

              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={TASK_FLOW_STAGES} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1C3035" opacity={0.1} />
                    <XAxis dataKey="stage" stroke="#64748b" fontSize={11} fontWeight={700} />
                    <YAxis allowDecimals={false} stroke="#64748b" fontSize={11} fontWeight={700} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1C3035',
                        borderColor: '#2D8CFF',
                        color: '#FBF9F4',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {TASK_FLOW_STAGES.map((entry, index) => (
                        <Cell key={`cell-flow-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 5: ROOM RATES */}
          {analyticsTab === 'rates' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black uppercase text-[#1C3035] dark:text-white">
                    Room Rates & Competitor Intelligence
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Coastline Suites demand above 90%. Suggested rate adjustment of +₹400 / room night.
                  </p>
                </div>
                <Button
                  onClick={() => handleFeatureClick({ label: 'Room Rates', path: '/pricing', note: 'Opening dynamic pricing intelligence', color: '#2D8CFF' })}
                  className="rounded-lg text-xs font-black bg-[#2D8CFF] hover:bg-[#1A7BFA] text-white border-2 border-[#1C3035] cursor-pointer"
                >
                  Adjust Room Rates →
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl border-2 border-[#1C3035] bg-[#F3EEE3]/80 dark:bg-slate-800/60 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500">Your Base Rate</span>
                  <div className="text-2xl font-black text-[#1C3035] dark:text-white">₹4,200</div>
                  <p className="text-xs font-semibold text-[#5B9EA3]">Deluxe Category</p>
                </div>

                <div className="p-4 rounded-xl border-2 border-[#1C3035] bg-[#F3EEE3]/80 dark:bg-slate-800/60 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500">Market Average</span>
                  <div className="text-2xl font-black text-[#1C3035] dark:text-white">₹4,800</div>
                  <p className="text-xs font-semibold text-slate-500">Regional Resort Comp Set</p>
                </div>

                <div className="p-4 rounded-xl border-2 border-emerald-700 bg-emerald-700/10 space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-700">Recommended Adjustment</span>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">₹4,600</div>
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">+₹400 / room night lift</p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-[#1C3035]/20 bg-[#FBF9F4] dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                💡 <span className="font-extrabold text-[#1C3035] dark:text-white">Hospitality Note:</span> Room rates increased by 8% as weekend occupancy crossed 85%. Competitive positioning remains strong against nearby beachfront properties.
              </div>
            </div>
          )}

          {/* TAB 6: BOOKINGS AT RISK */}
          {analyticsTab === 'cancellations' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black uppercase text-[#1C3035] dark:text-white">
                    Bookings at Risk · Retention Intelligence
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    2 reservations flagged with high cancellation probability. Recommended retention actions available.
                  </p>
                </div>
                <Button
                  onClick={() => handleFeatureClick({ label: 'Bookings at Risk', path: '/cancellation-risk', note: 'Opening ML retention model', color: '#C96B56' })}
                  className="rounded-lg text-xs font-black bg-[#C96B56] hover:bg-[#b55b46] text-white border-2 border-[#1C3035] cursor-pointer"
                >
                  Review At-Risk Bookings →
                </Button>
              </div>

              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CANCELLATION_RISK_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1C3035" opacity={0.1} />
                    <XAxis dataKey="tier" stroke="#64748b" fontSize={11} fontWeight={700} />
                    <YAxis allowDecimals={false} stroke="#64748b" fontSize={11} fontWeight={700} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1C3035',
                        borderColor: '#C96B56',
                        color: '#FBF9F4',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '12px',
                      }}
                      formatter={(value: any) => [`${value} Bookings`, 'Total']}
                    />
                    <Bar dataKey="bookings" radius={[4, 4, 0, 0]}>
                      {CANCELLATION_RISK_DATA.map((entry, index) => (
                        <Cell key={`cell-risk-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        </div>

      </section>

    </div>
  )
}
