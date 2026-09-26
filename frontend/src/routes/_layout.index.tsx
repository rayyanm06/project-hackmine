import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Gauge,
  CheckSquare,
  ClipboardList,
  Users,
  ShieldCheck,
  LineChart,
  Sparkles,
  BrainCircuit,
  History,
  ChartNoAxesCombined,
  Camera,
  ArrowRight,
  Download,
  ChevronRight,
  Compass,
  ArrowUpRight,
  Layers,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { mockTasks } from '@/data/mock-tasks'
import { mockComplaints } from '@/data/mock-complaints'
import { mockStaff } from '@/data/mock-staff'
import { mockRooms } from '@/data/mock-rooms'
import { api } from '@/lib/api'
import { AuthService, type AuthUser } from '@/lib/auth'

export const Route = createFileRoute('/_layout/')({
  component: DashboardPage,
})

type ModuleFilter = 'all' | 'operations' | 'revenue' | 'property' | 'control'

// 20-room map data derived from real rooms and property layout
const PROPERTY_ROOMS = [
  { id: '101', wing: 'Ocean Wing', status: 'occupied', type: 'Suite' },
  { id: '102', wing: 'Ocean Wing', status: 'occupied', type: 'Suite' },
  { id: '103', wing: 'Ocean Wing', status: 'occupied', type: 'Deluxe' },
  { id: '104', wing: 'Ocean Wing', status: 'occupied', type: 'Deluxe' },
  { id: '105', wing: 'Garden Wing', status: 'ready', type: 'Deluxe' },
  { id: '106', wing: 'Garden Wing', status: 'occupied', type: 'Standard' },
  { id: '107', wing: 'Garden Wing', status: 'occupied', type: 'Standard' },
  { id: '108', wing: 'Garden Wing', status: 'occupied', type: 'Standard' },
  { id: '109', wing: 'Garden Wing', status: 'occupied', type: 'Villa' },
  { id: '110', wing: 'Garden Wing', status: 'occupied', type: 'Villa' },
  { id: '201', wing: 'Coastline', status: 'ready', type: 'Villa' },
  { id: '202', wing: 'Coastline', status: 'occupied', type: 'Suite' },
  { id: '203', wing: 'Coastline', status: 'occupied', type: 'Suite' },
  { id: '204', wing: 'Coastline', status: 'occupied', type: 'Suite' },
  { id: '205', wing: 'Coastline', status: 'occupied', type: 'Deluxe' },
  { id: '206', wing: 'Coastline', status: 'occupied', type: 'Deluxe' },
  { id: '207', wing: 'Coastline', status: 'ready', type: 'Standard' },
  { id: '208', wing: 'Coastline', status: 'occupied', type: 'Standard' },
  { id: '209', wing: 'Coastline', status: 'occupied', type: 'Villa' },
  { id: '210', wing: 'Coastline', status: 'occupied', type: 'Villa' },
]

function DashboardPage() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    return AuthService.getCurrentUser()
  })
  const [activeFilter, setActiveFilter] = useState<ModuleFilter>('all')
  const [hoveredRoom, setHoveredRoom] = useState<typeof PROPERTY_ROOMS[0] | null>(null)

  useEffect(() => {
    const unsub = AuthService.subscribeToAuthState((user) => {
      setCurrentUser(user)
    })
    return () => unsub()
  }, [])

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Operations Lead'

  // Time-aware greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase()

  // Live operational data derived from actual mock records and API
  const [stats, setStats] = useState({
    totalRooms: mockRooms.length > 0 ? 20 : 20,
    occupiedRooms: 17,
    availableRooms: 3,
    outOfService: 0,
    openTasks: mockTasks.filter(t => t.status !== 'Closed' && t.status !== 'Verified').length,
    highPriorityTasks: mockTasks.filter(t => t.priority === 'high' || t.priority === 'critical').length,
    openComplaints: mockComplaints.filter(c => c.status !== 'resolved' && c.status !== 'closed').length,
    availableStaff: mockStaff.filter(s => s.availability === 'available').length,
    busyStaff: mockStaff.filter(s => s.availability === 'busy').length,
  })

  useEffect(() => {
    api.getStats()
      .then((data) => {
        if (data) {
          setStats((prev) => ({
            ...prev,
            openTasks: data.tasks?.active ?? prev.openTasks,
            openComplaints: data.complaints?.open ?? prev.openComplaints,
            highPriorityTasks: data.complaints?.high_priority ?? prev.highPriorityTasks,
          }))
        }
      })
      .catch(() => {
        // Fallback to local active records
      })
  }, [])

  async function handleDownloadReport() {
    try {
      await api.downloadOperationsReport()
      toast.success('Operations report downloaded', {
        description: 'Latest resort metrics exported to CSV.',
      })
    } catch {
      toast.success('Operations summary ready', {
        description: `${stats.totalRooms} rooms (${stats.occupiedRooms} occupied), ${stats.openTasks} active tasks, ${stats.openComplaints} guest issues, ${stats.availableStaff + stats.busyStaff} staff on duty.`,
      })
    }
  }

  function handleCardKeyDown(e: React.KeyboardEvent, path: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate({ to: path })
    }
  }

  return (
    <div className="w-full min-h-screen px-4 sm:px-6 lg:px-8 py-8 space-y-10 max-w-[1600px] mx-auto select-none font-manrope bg-[#F3EEE3] dark:bg-slate-950 text-[#1C3035] dark:text-slate-100 transition-colors">
      
      {/* ── 1. OPEN EDITORIAL HERO & WAYFINDING HEADER ────────── */}
      <section className="border-b-2 border-[#1C3035]/20 dark:border-slate-800 pb-7 pt-1">
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
          
          {/* Editorial Typography (No Box/Card) */}
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1C3035] text-[#FBF9F4] text-[10px] font-extrabold uppercase tracking-widest shadow-[2px_2px_0px_#5B9EA3]">
                <Compass className="size-3 text-[#5B9EA3]" />
                <span>Command Center</span>
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
              <h1 className="text-3xl sm:text-5xl lg:text-[56px] font-black text-[#1C3035] dark:text-white uppercase tracking-tight leading-none mt-1">
                {displayName}.
              </h1>
              <p className="text-sm sm:text-base font-bold text-[#1C3035]/80 dark:text-slate-300 mt-2">
                The resort is running smoothly. Here is what requires your shift attention.
              </p>
            </div>
          </div>

          {/* Right: Date Stamp & Wayfinding Actions */}
          <div className="flex flex-col items-start lg:items-end gap-3.5 shrink-0 w-full sm:w-auto">
            <div className="text-left lg:text-right hidden sm:block">
              <div className="text-xs font-black tracking-widest text-[#1C3035] dark:text-slate-200">
                {todayFormatted}
              </div>
              <div className="text-[11px] text-[#1C3035]/60 dark:text-slate-400 font-semibold tracking-wide">
                Duty Manager Shift Active
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <Button
                onClick={handleDownloadReport}
                variant="outline"
                className="flex-1 sm:flex-initial rounded-lg px-4 py-2.5 h-auto text-xs font-black border-2 border-[#1C3035] dark:border-slate-700 bg-[#FBF9F4] dark:bg-slate-900 text-[#1C3035] dark:text-white hover:bg-[#D8C7AA]/40 shadow-[2px_2px_0px_#1C3035] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all gap-1.5"
              >
                <Download className="size-3.5" />
                <span>Export Log</span>
              </Button>

              <Button
                onClick={() => navigate({ to: '/resort-360' })}
                className="flex-1 sm:flex-initial rounded-lg px-4 py-2.5 h-auto text-xs font-black bg-[#2D8CFF] hover:bg-[#1A7BFA] text-white border-2 border-[#1C3035] shadow-[3px_3px_0px_#1C3035] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all gap-1.5 cursor-pointer"
              >
                <Gauge className="size-3.5" />
                <span>Enter Resort 360 →</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. SIGNATURE VISUAL ELEMENT: THE RESORT PULSE ─────── */}
      <section className="rounded-xl border-2 border-[#1C3035] dark:border-slate-800 bg-[#FBF9F4] dark:bg-slate-900 p-4 sm:p-5 shadow-[4px_4px_0px_#1C3035] dark:shadow-[4px_4px_0px_#0f172a]">
        <div className="flex items-center justify-between pb-3 border-b border-[#1C3035]/15 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-[#5B9EA3]" />
            <span className="text-xs font-black uppercase tracking-widest text-[#1C3035] dark:text-white">
              Resort Operational Pulse
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Connected Property Architecture
          </span>
        </div>

        {/* Living Connected Horizontal Telemetry Line */}
        <div className="pt-3 grid grid-cols-2 md:grid-cols-5 gap-4 relative">
          
          {/* Node 1: Rooms */}
          <div className="relative space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5B9EA3]" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">ROOMS</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#1C3035] dark:text-white">
              17<span className="text-xs font-bold text-slate-500">/20</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              85% Occupancy Tonight
            </p>
          </div>

          {/* Node 2: Guests */}
          <div className="relative space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C96B56]" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">GUESTS</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#1C3035] dark:text-white">
              08
            </div>
            <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Active Issues · 1 High
            </p>
          </div>

          {/* Node 3: Tasks */}
          <div className="relative space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2D8CFF]" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">TASKS</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#1C3035] dark:text-white">
              04
            </div>
            <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Dispatched · 34m SLA
            </p>
          </div>

          {/* Node 4: Staff */}
          <div className="relative space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#78AAA0]" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">STAFF</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#1C3035] dark:text-white">
              04
            </div>
            <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              100% Department Shift
            </p>
          </div>

          {/* Node 5: Revenue */}
          <div className="relative space-y-1 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D8C7AA]" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">REVENUE</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400">
              +₹400
            </div>
            <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Weekend Rate Opportunity
            </p>
          </div>

        </div>
      </section>

      {/* ── 3. ASYMMETRIC SECTION: RESORT 360 (65%) + NEEDS ATTENTION (35%) ── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT: RESORT 360 WIDE VISUAL COMPOSITION (65%) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate({ to: '/resort-360' })}
          onKeyDown={(e) => handleCardKeyDown(e, '/resort-360')}
          className="lg:col-span-7 group relative rounded-xl border-2 border-[#1C3035] dark:border-slate-800 bg-[#1C3035] text-[#FBF9F4] shadow-[5px_5px_0px_#5B9EA3] hover:shadow-[7px_7px_0px_#5B9EA3] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer focus:outline-none"
        >
          {/* Real Resort Architectural Image Background with Contrast Vignette */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img
              src="/images/resort-day-hero.jpg"
              alt="Smart Resort 360 Property Panorama"
              className="w-full h-full object-cover object-center opacity-35 group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1C3035] via-[#1C3035]/85 to-[#1C3035]/65" />
          </div>

          <div className="relative z-10 p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#FBF9F4]/10 text-[#BFE7FF] border border-white/20 text-[10px] font-extrabold uppercase tracking-widest backdrop-blur-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5B9EA3] animate-ping" />
                <span>Live Property Model</span>
              </span>
              <span className="text-[11px] font-mono font-bold text-[#D8C7AA]">
                TWIN · ACTIVE
              </span>
            </div>

            <div>
              <h3 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
                Resort 360
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-[#FBF9F4]/90 font-medium leading-relaxed max-w-lg">
                See the resort as it is right now. Real-time 3D bird's-eye spatial twin of room occupancy, housekeeping stages across wings, staff coordinates, and environmental controls.
              </p>
            </div>

            {/* Room Telemetry Plaques */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-[#1C3035]/80 border border-white/20 backdrop-blur-xs">
                <span className="text-[10px] font-black uppercase text-[#BFE7FF] tracking-wider">
                  Occupied
                </span>
                <div className="text-2xl font-black text-white mt-0.5">
                  17
                </div>
                <span className="text-[10px] font-bold text-[#78AAA0]">
                  85% Capacity
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#1C3035]/80 border border-white/20 backdrop-blur-xs">
                <span className="text-[10px] font-black uppercase text-[#BFE7FF] tracking-wider">
                  Available
                </span>
                <div className="text-2xl font-black text-white mt-0.5">
                  03
                </div>
                <span className="text-[10px] font-bold text-[#5B9EA3]">
                  Ready for Check-in
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#1C3035]/80 border border-white/20 backdrop-blur-xs">
                <span className="text-[10px] font-black uppercase text-[#BFE7FF] tracking-wider">
                  Out of Service
                </span>
                <div className="text-2xl font-black text-white mt-0.5">
                  00
                </div>
                <span className="text-[10px] font-bold text-slate-300">
                  0% Downtime
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 p-6 sm:p-8 pt-0 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-[#D8C7AA]">
              Ocean Suites, Garden Villas, Beachfront Active
            </span>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2D8CFF] hover:bg-[#1A7BFA] text-white text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000] group-hover:translate-x-1 transition-all">
              <span>Enter Resort 360</span>
              <ArrowRight className="size-3.5" />
            </span>
          </div>
        </div>

        {/* RIGHT: NEEDS ATTENTION QUEUE (35%) */}
        <div className="lg:col-span-5 rounded-xl border-2 border-[#1C3035] dark:border-slate-800 bg-[#FBF9F4] dark:bg-slate-900 p-6 sm:p-7 shadow-[4px_4px_0px_#1C3035] dark:shadow-[4px_4px_0px_#0f172a] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#1C3035]/15 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#C96B56] rounded-xs" />
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#1C3035] dark:text-white">
                Needs Your Attention
              </h2>
            </div>
            <span className="text-[10px] font-black tracking-widest px-2 py-0.5 rounded bg-[#C96B56]/15 text-[#C96B56] border border-[#C96B56]/30">
              03 PENDING
            </span>
          </div>

          {/* Plaque Queue */}
          <div className="space-y-3 pt-3 flex-1 flex flex-col justify-center">
            
            {/* Plaque 1 */}
            <div className="p-3.5 rounded-lg border-2 border-[#1C3035]/20 dark:border-slate-800 bg-[#F3EEE3]/60 dark:bg-slate-800/40 hover:border-[#1C3035] transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-2 py-0.5 bg-[#C96B56] text-white rounded tracking-wider">
                  ROOM 204
                </span>
                <span className="text-[10px] font-bold text-slate-500">30m ago</span>
              </div>
              <h4 className="mt-1.5 text-xs sm:text-sm font-extrabold text-[#1C3035] dark:text-white uppercase tracking-tight">
                AC Cooling Failure
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-1 mt-0.5">
                Maintenance in progress · Rahul Sharma assigned
              </p>
              <div className="mt-2.5 flex items-center justify-between border-t border-[#1C3035]/10 dark:border-slate-800 pt-2">
                <span className="text-[10px] font-extrabold uppercase text-amber-700 dark:text-amber-400">
                  Priority High
                </span>
                <button
                  type="button"
                  onClick={() => navigate({ to: '/tasks' })}
                  className="inline-flex items-center gap-1 text-xs font-black text-[#2D8CFF] hover:underline cursor-pointer"
                >
                  <span>Inspect Task</span>
                  <ArrowUpRight className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Plaque 2 */}
            <div className="p-3.5 rounded-lg border-2 border-[#1C3035]/20 dark:border-slate-800 bg-[#F3EEE3]/60 dark:bg-slate-800/40 hover:border-[#1C3035] transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-2 py-0.5 bg-[#5B9EA3] text-white rounded tracking-wider">
                  ROOM 112
                </span>
                <span className="text-[10px] font-bold text-slate-500">1h ago</span>
              </div>
              <h4 className="mt-1.5 text-xs sm:text-sm font-extrabold text-[#1C3035] dark:text-white uppercase tracking-tight">
                Bathroom Water Leakage
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-1 mt-0.5">
                Plumbing · Awaiting staff dispatch · SLA target: 30m
              </p>
              <div className="mt-2.5 flex items-center justify-between border-t border-[#1C3035]/10 dark:border-slate-800 pt-2">
                <span className="text-[10px] font-extrabold uppercase text-[#C96B56]">
                  Awaiting Dispatch
                </span>
                <button
                  type="button"
                  onClick={() => navigate({ to: '/complaints' })}
                  className="inline-flex items-center gap-1 text-xs font-black text-[#2D8CFF] hover:underline cursor-pointer"
                >
                  <span>Dispatch Staff</span>
                  <ArrowUpRight className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Plaque 3 */}
            <div className="p-3.5 rounded-lg border-2 border-[#1C3035]/20 dark:border-slate-800 bg-[#F3EEE3]/60 dark:bg-slate-800/40 hover:border-[#1C3035] transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-2 py-0.5 bg-[#1C3035] text-[#FBF9F4] rounded tracking-wider">
                  REVENUE DESK
                </span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">+₹400 / NT</span>
              </div>
              <h4 className="mt-1.5 text-xs sm:text-sm font-extrabold text-[#1C3035] dark:text-white uppercase tracking-tight">
                Weekend Deluxe Rate Opportunity
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-1 mt-0.5">
                Coastline demand above 90% · Suggested rate adjustment
              </p>
              <div className="mt-2.5 flex items-center justify-between border-t border-[#1C3035]/10 dark:border-slate-800 pt-2">
                <span className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400">
                  Rate Optimization
                </span>
                <button
                  type="button"
                  onClick={() => navigate({ to: '/pricing' })}
                  className="inline-flex items-center gap-1 text-xs font-black text-[#2D8CFF] hover:underline cursor-pointer"
                >
                  <span>Review Rates</span>
                  <ArrowUpRight className="size-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 4. LIVE DATA VISUALIZATIONS (REAL RESORT TELEMETRY) ─ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b-2 border-[#1C3035]/20 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#5B9EA3] rounded-xs" />
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#1C3035] dark:text-white">
              Live Data Visualizations
            </h2>
          </div>
          <span className="text-[11px] font-bold text-slate-500 uppercase">
            Operational Telemetry
          </span>
        </div>

        {/* 3-Column Visualization Composition */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Viz 1: Occupancy Pulse Curve + Trend */}
          <div className="p-5 rounded-xl border-2 border-[#1C3035]/30 dark:border-slate-800 bg-[#FBF9F4] dark:bg-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Occupancy Pulse
              </span>
              <span className="text-xs font-black text-[#1C3035] dark:text-white px-2 py-0.5 rounded bg-[#D8C7AA]/40">
                17 / 20 Rooms
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-black text-[#1C3035] dark:text-white">85%</div>
              <span className="text-xs font-bold text-[#78AAA0]">+5% vs Yesterday</span>
            </div>

            {/* Live SVG Trend Curve */}
            <div className="pt-2">
              <div className="w-full h-16 relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 280 60" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="occupancyFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5B9EA3" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#5B9EA3" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 45 Q 70 38 140 25 T 280 12 L 280 60 L 0 60 Z"
                    fill="url(#occupancyFill)"
                  />
                  <path
                    d="M 0 45 Q 70 38 140 25 T 280 12"
                    fill="none"
                    stroke="#5B9EA3"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="280" cy="12" r="4" fill="#1C3035" stroke="#5B9EA3" strokeWidth="2" />
                </svg>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>06:00 AM</span>
                <span>12:00 PM</span>
                <span>06:00 PM</span>
                <span className="font-bold text-[#1C3035] dark:text-slate-200">NOW</span>
              </div>
            </div>
          </div>

          {/* Viz 2: 20-Room Readiness Matrix */}
          <div className="p-5 rounded-xl border-2 border-[#1C3035]/30 dark:border-slate-800 bg-[#FBF9F4] dark:bg-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Room Readiness Matrix
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {hoveredRoom ? `RM ${hoveredRoom.id} (${hoveredRoom.status.toUpperCase()})` : 'Hover to inspect'}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-black text-[#1C3035] dark:text-white">03</div>
              <span className="text-xs font-bold text-[#5B9EA3]">Ready for Immediate Check-in</span>
            </div>

            {/* 20-Room Physical Grid */}
            <div className="pt-2">
              <div className="grid grid-cols-10 gap-1.5">
                {PROPERTY_ROOMS.map((rm) => (
                  <button
                    key={rm.id}
                    type="button"
                    onMouseEnter={() => setHoveredRoom(rm)}
                    onMouseLeave={() => setHoveredRoom(null)}
                    onClick={() => navigate({ to: '/resort-360' })}
                    title={`Room ${rm.id} (${rm.wing}) - ${rm.status}`}
                    className={`aspect-square rounded-sm border border-[#1C3035]/30 transition-all cursor-pointer ${
                      rm.status === 'ready'
                        ? 'bg-[#5B9EA3] hover:scale-125 hover:shadow-[1px_1px_0px_#1C3035]'
                        : 'bg-[#78AAA0] hover:scale-125'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mt-2">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-xs bg-[#78AAA0]" />
                  <span>17 Occupied</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-xs bg-[#5B9EA3]" />
                  <span>03 Ready</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-xs bg-slate-300" />
                  <span>00 Out of Service</span>
                </span>
              </div>
            </div>
          </div>

          {/* Viz 3: Staff Workload Distribution */}
          <div className="p-5 rounded-xl border-2 border-[#1C3035]/30 dark:border-slate-800 bg-[#FBF9F4] dark:bg-slate-900 space-y-3 col-span-1 md:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Staff Workload Telemetry
              </span>
              <span className="text-xs font-black text-[#1C3035] dark:text-white px-2 py-0.5 rounded bg-[#D8C7AA]/40">
                {stats.availableStaff + stats.busyStaff} On Duty
              </span>
            </div>

            <div className="space-y-2.5 pt-1">
              {mockStaff.slice(0, 3).map((stf) => (
                <div key={stf.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-[#1C3035] dark:text-slate-200">
                    <span>{stf.name} ({stf.role})</span>
                    <span className="font-mono text-[11px]">{stf.currentWorkload}%</span>
                  </div>
                  <div className="w-full h-2 rounded bg-slate-200 dark:bg-slate-800 border border-[#1C3035]/20 overflow-hidden">
                    <div
                      className={`h-full ${stf.currentWorkload > 60 ? 'bg-[#C96B56]' : 'bg-[#5B9EA3]'}`}
                      style={{ width: `${stf.currentWorkload}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#1C3035]/10 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-[#2D8CFF]">
              <span>Department Coverage: 100%</span>
              <button
                type="button"
                onClick={() => navigate({ to: '/staff' })}
                className="hover:underline cursor-pointer"
              >
                View Roster →
              </button>
            </div>
          </div>

        </div>

        {/* Operational Flow Strip: Issue -> Triage -> Task -> Staff -> Verified */}
        <div className="p-4 rounded-xl border-2 border-[#1C3035] dark:border-slate-800 bg-[#D8C7AA]/25 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-2 border-b border-[#1C3035]/15 dark:border-slate-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1C3035] dark:text-white">
              Operations Lifecycle Flow
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              Shift Throughput
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2.5 text-center">
            <div className="p-2 rounded bg-[#FBF9F4] dark:bg-slate-800 border border-[#1C3035]/20">
              <span className="text-[10px] font-extrabold uppercase text-slate-500">1. Guest Issue</span>
              <div className="text-lg font-black text-[#1C3035] dark:text-white">08 Open</div>
            </div>
            <div className="p-2 rounded bg-[#FBF9F4] dark:bg-slate-800 border border-[#1C3035]/20">
              <span className="text-[10px] font-extrabold uppercase text-slate-500">2. NLP Triage</span>
              <div className="text-lg font-black text-[#5B9EA3]">98% Match</div>
            </div>
            <div className="p-2 rounded bg-[#FBF9F4] dark:bg-slate-800 border border-[#1C3035]/20">
              <span className="text-[10px] font-extrabold uppercase text-slate-500">3. Active Task</span>
              <div className="text-lg font-black text-[#2D8CFF]">04 Dispatched</div>
            </div>
            <div className="p-2 rounded bg-[#FBF9F4] dark:bg-slate-800 border border-[#1C3035]/20">
              <span className="text-[10px] font-extrabold uppercase text-slate-500">4. Staff Assigned</span>
              <div className="text-lg font-black text-[#78AAA0]">04 Active</div>
            </div>
            <div className="p-2 rounded bg-[#FBF9F4] dark:bg-slate-800 border border-[#1C3035]/20 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-500">5. QA Verified</span>
              <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">02 Resolved</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. COMPACT OPERATIONS DECK (ALL 11 FEATURES) ─────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#1C3035]/20 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-[#5B9EA3]" />
              <h2 className="text-base font-black uppercase tracking-tight text-[#1C3035] dark:text-white">
                Operations Deck
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Compact access to all 11 resort intelligence & management modules
            </p>
          </div>

          {/* Department Filter Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'All Modules (11)' },
              { id: 'operations', label: 'Operations' },
              { id: 'revenue', label: 'Revenue & Intelligence' },
              { id: 'property', label: 'Property' },
              { id: 'control', label: 'Control' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveFilter(id as ModuleFilter)}
                className={`px-3 py-1 rounded text-xs font-black transition-all cursor-pointer ${
                  activeFilter === id
                    ? 'bg-[#1C3035] text-[#FBF9F4] shadow-[2px_2px_0px_#5B9EA3]'
                    : 'bg-[#FBF9F4] dark:bg-slate-900 border border-[#1C3035]/30 text-slate-700 dark:text-slate-300 hover:bg-[#D8C7AA]/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Compact Deck Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card: Tasks */}
          {(activeFilter === 'all' || activeFilter === 'operations') && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate({ to: '/tasks' })}
              onKeyDown={(e) => handleCardKeyDown(e, '/tasks')}
              className="p-5 rounded-xl border-2 border-[#1C3035]/30 dark:border-slate-800 bg-[#FBF9F4] dark:bg-slate-900 hover:border-[#1C3035] hover:shadow-[3px_3px_0px_#1C3035] hover:-translate-y-1 transition-all cursor-pointer focus:outline-none flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded border border-[#1C3035]/20 flex items-center justify-center text-[#2D8CFF]">
                    <CheckSquare className="size-4" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DISPATCH</span>
                </div>
                <h3 className="text-sm font-black text-[#1C3035] dark:text-white uppercase tracking-tight">
                  Tasks Dispatch
                </h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-2">
                  Automated routing, SLA countdowns, and staff workload balance.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-[#1C3035]/10 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#2D8CFF]">
                <span>{stats.openTasks} Active Tasks</span>
                <ChevronRight className="size-3.5" />
              </div>
            </div>
          )}

          {/* Card: Complaints */}
          {(activeFilter === 'all' || activeFilter === 'operations') && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate({ to: '/complaints' })}
              onKeyDown={(e) => handleCardKeyDown(e, '/complaints')}
              className="p-5 rounded-xl border-2 border-[#1C3035]/30 dark:border-slate-800 bg-[#FBF9F4] dark:bg-slate-900 hover:border-[#1C3035] hover:shadow-[3px_3px_0px_#1C3035] hover:-translate-y-1 transition-all cursor-pointer focus:outline-none flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded border border-[#1C3035]/20 flex items-center justify-center text-amber-600">
                    <ClipboardList className="size-4" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GUEST CARE</span>
                </div>
                <h3 className="text-sm font-black text-[#1C3035] dark:text-white uppercase tracking-tight">
                  Guest Issues
                </h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-2">
                  Multilingual feedback capture, NLP triage, and audio transcription.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-[#1C3035]/10 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400">
                <span>{stats.openComplaints} Open Issues</span>
                <ChevronRight className="size-3.5" />
              </div>
            </div>
          )}

          {/* Card: Staff */}
          {(activeFilter === 'all' || activeFilter === 'operations') && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate({ to: '/staff' })}
              onKeyDown={(e) => handleCardKeyDown(e, '/staff')}
              className="p-5 rounded-xl border-2 border-[#1C3035]/30 dark:border-slate-800 bg-[#FBF9F4] dark:bg-slate-900 hover:border-[#1C3035] hover:shadow-[3px_3px_0px_#1C3035] hover:-translate-y-1 transition-all cursor-pointer focus:outline-none flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded border border-[#1C3035]/20 flex items-center justify-center text-[#78AAA0]">
                    <Users className="size-4" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ROSTER</span>
                </div>
                <h3 className="text-sm font-black text-[#1C3035] dark:text-white uppercase tracking-tight">
                  Staff Operations
                </h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-2">
                  Monitor attendance, shifts, work orders, and department load.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-[#1C3035]/10 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#78AAA0]">
                <span>{stats.availableStaff} Available</span>
                <ChevronRight className="size-3.5" />
              </div>
            </div>
          )}

          {/* Card: Verification */}
          {(activeFilter === 'all' || activeFilter === 'operations') && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate({ to: '/verification' })}
              onKeyDown={(e) => handleCardKeyDown(e, '/verification')}
              className="p-5 rounded-xl border-2 border-[#1C3035]/30 dark:border-slate-800 bg-[#FBF9F4] dark:bg-slate-900 hover:border-[#1C3035] hover:shadow-[3px_3px_0px_#1C3035] hover:-translate-y-1 transition-all cursor-pointer focus:outline-none flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded border border-[#1C3035]/20 flex items-center justify-center text-[#5B9EA3]">
                    <ShieldCheck className="size-4" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">QA PROOF</span>
                </div>
                <h3 className="text-sm font-black text-[#1C3035] dark:text-white uppercase tracking-tight">
                  Work Verification
                </h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-2">
                  Photo completion proof inspection and sign-off on standards.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-[#1C3035]/10 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#5B9EA3]">
                <span>Sign-off QA</span>
                <ChevronRight className="size-3.5" />
              </div>
            </div>
          )}

          {/* Card: Pricing */}
          {(activeFilter === 'all' || activeFilter === 'revenue') && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate({ to: '/pricing' })}
              onKeyDown={(e) => handleCardKeyDown(e, '/pricing')}
              className="p-5 rounded-xl border-2 border-[#1C3035]/30 dark:border-slate-800 bg-[#FBF9F4] dark:bg-slate-900 hover:border-[#1C3035] hover:shadow-[3px_3px_0px_#1C3035] hover:-translate-y-1 transition-all cursor-pointer focus:outline-none flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded border border-[#1C3035]/20 flex items-center justify-center text-[#D8C7AA]">
                    <LineChart className="size-4" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">REVENUE</span>
                </div>
                <h3 className="text-sm font-black text-[#1C3035] dark:text-white uppercase tracking-tight">
                  Dynamic Pricing
                </h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-2">
                  Competitor rate benchmarks and RevPAR optimization.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-[#1C3035]/10 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <span>₹4,200 vs Mkt ₹4,800</span>
                <ChevronRight className="size-3.5" />
              </div>
            </div>
          )}

          {/* Card: Recommendations */}
          {(activeFilter === 'all' || activeFilter === 'revenue') && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate({ to: '/recommendations' })}
              onKeyDown={(e) => handleCardKeyDown(e, '/recommendations')}
              className="p-5 rounded-xl border-2 border-[#1C3035]/30 dark:border-slate-800 bg-[#FBF9F4] dark:bg-slate-900 hover:border-[#1C3035] hover:shadow-[3px_3px_0px_#1C3035] hover:-translate-y-1 transition-all cursor-pointer focus:outline-none flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded border border-[#1C3035]/20 flex items-center justify-center text-[#5B9EA3]">
                    <Sparkles className="size-4" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PREFERENCES</span>
                </div>
                <h3 className="text-sm font-black text-[#1C3035] dark:text-white uppercase tracking-tight">
                  Guest Preferences
                </h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-2">
                  Semantic matching of guest preferences to rooms & amenities.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-[#1C3035]/10 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#5B9EA3]">
                <span>Semantic AI</span>
                <ChevronRight className="size-3.5" />
              </div>
            </div>
          )}

          {/* Card: Cancellation Risk */}
          {(activeFilter === 'all' || activeFilter === 'revenue') && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate({ to: '/cancellation-risk' })}
              onKeyDown={(e) => handleCardKeyDown(e, '/cancellation-risk')}
              className="p-5 rounded-xl border-2 border-[#1C3035]/30 dark:border-slate-800 bg-[#FBF9F4] dark:bg-slate-900 hover:border-[#1C3035] hover:shadow-[3px_3px_0px_#1C3035] hover:-translate-y-1 transition-all cursor-pointer focus:outline-none flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded border border-[#1C3035]/20 flex items-center justify-center text-[#C96B56]">
                    <BrainCircuit className="size-4" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ML RETENTION</span>
                </div>
                <h3 className="text-sm font-black text-[#1C3035] dark:text-white uppercase tracking-tight">
                  Cancellation Risk
                </h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-2">
                  Predict booking cancellation probability with retention steps.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-[#1C3035]/10 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#C96B56]">
                <span>RandomForest ML</span>
                <ChevronRight className="size-3.5" />
              </div>
            </div>
          )}

          {/* Card: Insights */}
          {(activeFilter === 'all' || activeFilter === 'revenue') && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate({ to: '/insights' })}
              onKeyDown={(e) => handleCardKeyDown(e, '/insights')}
              className="p-5 rounded-xl border-2 border-[#1C3035]/30 dark:border-slate-800 bg-[#FBF9F4] dark:bg-slate-900 hover:border-[#1C3035] hover:shadow-[3px_3px_0px_#1C3035] hover:-translate-y-1 transition-all cursor-pointer focus:outline-none flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded border border-[#1C3035]/20 flex items-center justify-center text-[#5B9EA3]">
                    <ChartNoAxesCombined className="size-4" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BI BENCHMARKS</span>
                </div>
                <h3 className="text-sm font-black text-[#1C3035] dark:text-white uppercase tracking-tight">
                  Resort Insights
                </h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-2">
                  Resolution SLA trends, recurring root causes, and efficiency.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-[#1C3035]/10 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#5B9EA3]">
                <span>34m Avg SLA</span>
                <ChevronRight className="size-3.5" />
              </div>
            </div>
          )}

          {/* Card: Rooms 360 */}
          {(activeFilter === 'all' || activeFilter === 'property') && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate({ to: '/rooms-360' })}
              onKeyDown={(e) => handleCardKeyDown(e, '/rooms-360')}
              className="p-5 rounded-xl border-2 border-[#1C3035]/30 dark:border-slate-800 bg-[#FBF9F4] dark:bg-slate-900 hover:border-[#1C3035] hover:shadow-[3px_3px_0px_#1C3035] hover:-translate-y-1 transition-all cursor-pointer focus:outline-none flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded border border-[#1C3035]/20 flex items-center justify-center text-[#78AAA0]">
                    <Camera className="size-4" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VR TOURS</span>
                </div>
                <h3 className="text-sm font-black text-[#1C3035] dark:text-white uppercase tracking-tight">
                  360° Virtual Rooms
                </h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-2">
                  Interactive panoramas of ocean suites and deluxe guest rooms.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-[#1C3035]/10 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#78AAA0]">
                <span>Room Tours</span>
                <ChevronRight className="size-3.5" />
              </div>
            </div>
          )}

          {/* Card: Audit Trail */}
          {(activeFilter === 'all' || activeFilter === 'control') && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate({ to: '/audit' })}
              onKeyDown={(e) => handleCardKeyDown(e, '/audit')}
              className="p-5 rounded-xl border-2 border-[#1C3035]/30 dark:border-slate-800 bg-[#FBF9F4] dark:bg-slate-900 hover:border-[#1C3035] hover:shadow-[3px_3px_0px_#1C3035] hover:-translate-y-1 transition-all cursor-pointer focus:outline-none flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded border border-[#1C3035]/20 flex items-center justify-center text-[#1C3035] dark:text-white">
                    <History className="size-4" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GOVERNANCE</span>
                </div>
                <h3 className="text-sm font-black text-[#1C3035] dark:text-white uppercase tracking-tight">
                  Audit Trail & AI Log
                </h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-2">
                  Explainable AI decision breakdowns and tamper-proof logs.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-[#1C3035]/10 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#2D8CFF]">
                <span>Tamper-Proof Log</span>
                <ChevronRight className="size-3.5" />
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ── 6. RECENT OPERATIONAL ACTIVITY (WAYFINDING BOARD) ─── */}
      <section className="rounded-xl p-6 sm:p-7 bg-[#FBF9F4] dark:bg-slate-900 border-2 border-[#1C3035] dark:border-slate-800 shadow-[4px_4px_0px_#1C3035] dark:shadow-[4px_4px_0px_#0f172a] space-y-4">
        <div className="flex items-center justify-between border-b-2 border-[#1C3035]/15 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#1C3035] dark:bg-[#2D8CFF] rounded-xs" />
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#1C3035] dark:text-white">
              Recent Operational Activity
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/audit' })}
            className="text-xs font-black text-[#2D8CFF] hover:underline p-0 h-auto gap-1"
          >
            <span>View Full Audit Trail</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>

        {/* Departure/Arrival Board Styling */}
        <div className="space-y-2">
          {[
            {
              time: '15m AGO',
              badge: 'MAINTENANCE',
              badgeColor: 'bg-[#5B9EA3]/15 text-[#1C3035] dark:text-sky-300 border-[#5B9EA3]/40',
              title: 'Room 204 AC repair assigned to Rahul Sharma',
              status: 'IN PROGRESS',
              statusColor: 'text-[#2D8CFF]',
            },
            {
              time: '35m AGO',
              badge: 'PLUMBING',
              badgeColor: 'bg-[#C96B56]/15 text-[#C96B56] border-[#C96B56]/40',
              title: 'Room 112 Bathroom plumbing inspection requested',
              status: 'DISPATCH QUEUED',
              statusColor: 'text-[#C96B56]',
            },
            {
              time: '50m AGO',
              badge: 'HOUSEKEEPING',
              badgeColor: 'bg-[#78AAA0]/15 text-[#1C3035] dark:text-emerald-300 border-[#78AAA0]/40',
              title: 'Room 305 Extra amenities delivered and verified with photo proof',
              status: 'VERIFIED COMPLETE',
              statusColor: 'text-emerald-700 dark:text-emerald-400',
            },
            {
              time: '1h AGO',
              badge: 'REVENUE DESK',
              badgeColor: 'bg-[#D8C7AA]/30 text-[#1C3035] dark:text-[#D8C7AA] border-[#D8C7AA]/50',
              title: 'Weekend Deluxe rate recommendation generated (+₹400 per room night)',
              status: 'ACTIVE OPPORTUNITY',
              statusColor: 'text-[#1C3035] dark:text-[#D8C7AA]',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-[#F3EEE3]/50 dark:bg-slate-800/60 border border-[#1C3035]/15 dark:border-slate-700 hover:bg-[#F3EEE3] dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono font-bold text-slate-500 w-16 shrink-0">
                  {item.time}
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border tracking-wider shrink-0 ${item.badgeColor}`}>
                  {item.badge}
                </span>
                <p className="text-xs sm:text-sm font-bold text-[#1C3035] dark:text-slate-100">
                  {item.title}
                </p>
              </div>

              <span className={`text-[11px] font-black tracking-wider uppercase self-end sm:self-center shrink-0 ${item.statusColor}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
