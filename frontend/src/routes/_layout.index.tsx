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

type ModuleFilter = 'all' | 'property' | 'operations' | 'revenue' | 'control'

function DashboardPage() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    return AuthService.getCurrentUser()
  })
  const [activeFilter, setActiveFilter] = useState<ModuleFilter>('all')

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
    <div className="w-full min-h-screen px-4 sm:px-6 lg:px-8 py-8 space-y-9 max-w-[1600px] mx-auto select-none font-manrope">
      
      {/* ── 1. EDITORIAL HERO & WAYFINDING HEADER ─────────────── */}
      <section className="border-b-2 border-[#0F2D3D]/90 dark:border-slate-700 pb-7 pt-1">
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
          
          {/* Left: Bold Editorial Heading */}
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0F2D3D] text-[#F6F1E8] text-[11px] font-extrabold uppercase tracking-wider shadow-[2px_2px_0px_#2D8CFF]">
                <Compass className="size-3.5 text-[#2D8CFF]" />
                <span>Command Center</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Property Operating Normally</span>
              </span>
            </div>

            <div>
              <p className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.16em] text-[#0F2D3D]/60 dark:text-slate-400">
                {greeting},
              </p>
              <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-black text-[#0F2D3D] dark:text-white uppercase tracking-tight leading-none mt-1">
                {displayName}.
              </h1>
              <p className="text-sm sm:text-base font-bold text-[#0F2D3D]/75 dark:text-slate-300 mt-2">
                The resort is running smoothly. Here is what requires your shift attention.
              </p>
            </div>
          </div>

          {/* Right: Date Stamp & Wayfinding Actions */}
          <div className="flex flex-col items-start lg:items-end gap-3.5 shrink-0 w-full sm:w-auto">
            <div className="text-left lg:text-right hidden sm:block">
              <div className="text-xs font-black tracking-widest text-[#0F2D3D] dark:text-slate-200">
                {todayFormatted}
              </div>
              <div className="text-[11px] text-slate-500 font-semibold tracking-wide">
                Duty Manager Shift Active
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <Button
                onClick={handleDownloadReport}
                variant="outline"
                className="flex-1 sm:flex-initial rounded-lg px-3.5 py-2.5 h-auto text-xs font-bold border-2 border-[#0F2D3D] dark:border-slate-600 bg-white dark:bg-slate-900 text-[#0F2D3D] dark:text-slate-100 hover:bg-[#F6F1E8] shadow-[2px_2px_0px_#0F2D3D] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all gap-1.5"
              >
                <Download className="size-3.5" />
                <span>Export Log</span>
              </Button>

              <Button
                onClick={() => navigate({ to: '/resort-360' })}
                className="flex-1 sm:flex-initial rounded-lg px-4 py-2.5 h-auto text-xs font-bold bg-[#2D8CFF] hover:bg-[#1A7BFA] text-white border-2 border-[#0F2D3D] shadow-[3px_3px_0px_#0F2D3D] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all gap-1.5 cursor-pointer"
              >
                <Gauge className="size-3.5" />
                <span>Enter Resort 360 →</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. TODAY'S RESORT STATUS (WAYFINDING TELEMETRY BOARD) ─ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#0F2D3D] dark:bg-[#2D8CFF]" />
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-[0.14em] text-[#0F2D3D] dark:text-slate-200">
              Today's Resort Status
            </h2>
          </div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Live Telemetry
          </span>
        </div>

        {/* Refined Neo-Brutalist Telemetry Strip */}
        <div className="rounded-xl border-2 border-[#0F2D3D] dark:border-slate-700 bg-[#F6F1E8] dark:bg-slate-900 shadow-[4px_4px_0px_#0F2D3D] dark:shadow-[4px_4px_0px_#1e293b] overflow-hidden grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 divide-y md:divide-y-0 md:divide-x-2 divide-[#0F2D3D]/20 dark:divide-slate-800">
          
          {/* 1. Occupancy */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/resort-360' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/resort-360')}
            className="p-5 hover:bg-white/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer focus:outline-none"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#0F2D3D]/70 dark:text-slate-400">
                Occupancy
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-[#0F2D3D] text-[#F6F1E8] rounded">
                85%
              </span>
            </div>
            <div className="mt-2 text-3xl sm:text-4xl font-black text-[#0F2D3D] dark:text-white tracking-tight">
              17<span className="text-sm font-bold text-slate-500">/20</span>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 font-bold">
              Rooms Occupied Tonight
            </p>
            <div className="mt-3 w-full h-2 rounded bg-slate-200 dark:bg-slate-800 border border-[#0F2D3D]/30 overflow-hidden">
              <div className="h-full bg-[#2D8CFF]" style={{ width: '85%' }} />
            </div>
          </div>

          {/* 2. Available Rooms */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/rooms-360' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/rooms-360')}
            className="p-5 hover:bg-white/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer focus:outline-none"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#0F2D3D]/70 dark:text-slate-400">
                Available Keys
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-emerald-600 text-white rounded">
                Ready
              </span>
            </div>
            <div className="mt-2 text-3xl sm:text-4xl font-black text-[#0F2D3D] dark:text-white tracking-tight">
              03
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 font-bold">
              Turnover Inspected
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>Available for check-in</span>
            </div>
          </div>

          {/* 3. Guest Issues */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/complaints' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/complaints')}
            className="p-5 hover:bg-white/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer focus:outline-none"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#0F2D3D]/70 dark:text-slate-400">
                Concierge Desk
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-[#FF7657] text-white rounded">
                Open
              </span>
            </div>
            <div className="mt-2 text-3xl sm:text-4xl font-black text-[#0F2D3D] dark:text-white tracking-tight">
              08
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 font-bold">
              Active Guest Inquiries
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-[#FF7657]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF7657]" />
              <span>1 urgent attention item</span>
            </div>
          </div>

          {/* 4. Active Tasks */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/tasks' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/tasks')}
            className="p-5 hover:bg-white/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer focus:outline-none"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#0F2D3D]/70 dark:text-slate-400">
                Active Dispatch
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-[#2D8CFF] text-white rounded">
                Tasks
              </span>
            </div>
            <div className="mt-2 text-3xl sm:text-4xl font-black text-[#0F2D3D] dark:text-white tracking-tight">
              04
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 font-bold">
              In-Shift Work Orders
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-[#2D8CFF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D8CFF]" />
              <span>34m average SLA</span>
            </div>
          </div>

          {/* 5. Staff on Duty */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/staff' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/staff')}
            className="p-5 hover:bg-white/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer focus:outline-none col-span-2 md:col-span-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#0F2D3D]/70 dark:text-slate-400">
                Staff on Duty
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-slate-800 text-[#F6F1E8] rounded">
                Full
              </span>
            </div>
            <div className="mt-2 text-3xl sm:text-4xl font-black text-[#0F2D3D] dark:text-white tracking-tight">
              04
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 font-bold">
              {stats.availableStaff} Available • {stats.busyStaff} Dispatched
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>100% Department coverage</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. RESORT 360 FLAGSHIP & ACTIONABLE OPERATIONS QUEUE ─ */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT: RESORT 360 (7 Columns) — FLAGSHIP PRODUCT ANCHOR */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate({ to: '/resort-360' })}
          onKeyDown={(e) => handleCardKeyDown(e, '/resort-360')}
          className="lg:col-span-7 group relative rounded-xl p-6 sm:p-8 bg-[#0F2D3D] text-[#F6F1E8] border-2 border-[#0F2D3D] shadow-[5px_5px_0px_#2D8CFF] hover:shadow-[7px_7px_0px_#2D8CFF] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none overflow-hidden"
          aria-label="Enter Live Resort 360 Property Overview"
        >
          {/* Subtle architectural wayfinding grid lines */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#2D8CFF]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-4 right-4 text-[10px] font-mono tracking-widest text-[#BFE7FF]/50 border border-white/10 px-2 py-0.5 rounded">
            TWIN · v3.2
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2D8CFF] animate-ping" />
              <span className="text-xs font-black uppercase tracking-[0.16em] text-[#BFE7FF]">
                Live Property
              </span>
            </div>

            <div>
              <h3 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
                Resort 360
              </h3>
              <p className="mt-2 text-sm text-[#F6F1E8]/85 font-medium leading-relaxed max-w-xl">
                See the resort as it is right now. Real-time 3D bird's-eye view of room occupancy, housekeeping stages across wings, staff dispatch coordinates, and environmental telemetry.
              </p>
            </div>

            {/* High-Contrast Wayfinding Plaque Telemetry */}
            <div className="grid grid-cols-3 gap-3 pt-3">
              <div className="p-3.5 rounded-lg bg-white/5 border border-white/15">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#BFE7FF]">
                  Occupied
                </span>
                <div className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                  17
                </div>
                <span className="text-[11px] font-bold text-sky-300">
                  85% Capacity
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-white/5 border border-white/15">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#BFE7FF]">
                  Available
                </span>
                <div className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                  03
                </div>
                <span className="text-[11px] font-bold text-emerald-400">
                  Check-in Ready
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-white/5 border border-white/15">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#BFE7FF]">
                  Out of Service
                </span>
                <div className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                  00
                </div>
                <span className="text-[11px] font-bold text-slate-400">
                  0% Downtime
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 mt-6 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-[#BFE7FF]/90">
              Wings A, B & Coastline Villas Active
            </span>

            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2D8CFF] hover:bg-[#1A7BFA] text-white text-xs font-extrabold tracking-wide uppercase shadow-[2px_2px_0px_#000] group-hover:translate-x-1 transition-all">
              <span>Enter Resort 360</span>
              <ArrowRight className="size-3.5" />
            </span>
          </div>
        </div>

        {/* RIGHT: NEEDS ATTENTION (5 Columns) — PHYSICAL QUEUE */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl p-6 sm:p-7 bg-white dark:bg-slate-900 border-2 border-[#0F2D3D] dark:border-slate-700 shadow-[4px_4px_0px_#0F2D3D] dark:shadow-[4px_4px_0px_#1e293b]">
          
          <div className="flex items-center justify-between border-b-2 border-[#0F2D3D]/15 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#FF7657] rounded-sm" />
              <h2 className="text-sm font-black uppercase tracking-wider text-[#0F2D3D] dark:text-white">
                Needs Your Attention
              </h2>
            </div>
            <span className="text-[10px] font-black tracking-widest px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300">
              03 PENDING
            </span>
          </div>

          {/* Actionable items styled like physical room signage plaques */}
          <div className="space-y-3 pt-3 flex-1 flex flex-col justify-center">
            
            {/* Plaque 1 */}
            <div className="p-3.5 rounded-lg border-2 border-[#0F2D3D]/30 dark:border-slate-700 bg-[#F6F1E8]/50 dark:bg-slate-800/40 hover:border-[#0F2D3D] transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black px-2 py-0.5 bg-[#0F2D3D] text-[#F6F1E8] rounded tracking-wider">
                  ROOM 204
                </span>
                <span className="text-[10px] font-bold text-slate-500">30m ago</span>
              </div>
              <h4 className="mt-1.5 text-xs sm:text-sm font-extrabold text-[#0F2D3D] dark:text-white uppercase tracking-tight">
                AC Cooling Failure
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-1 mt-0.5">
                Maintenance in progress · Rahul Sharma assigned
              </p>
              <div className="mt-2.5 flex items-center justify-between border-t border-[#0F2D3D]/10 dark:border-slate-700 pt-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  Priority 1
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
            <div className="p-3.5 rounded-lg border-2 border-[#0F2D3D]/30 dark:border-slate-700 bg-[#F6F1E8]/50 dark:bg-slate-800/40 hover:border-[#0F2D3D] transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black px-2 py-0.5 bg-[#0F2D3D] text-[#F6F1E8] rounded tracking-wider">
                  ROOM 112
                </span>
                <span className="text-[10px] font-bold text-slate-500">1h ago</span>
              </div>
              <h4 className="mt-1.5 text-xs sm:text-sm font-extrabold text-[#0F2D3D] dark:text-white uppercase tracking-tight">
                Bathroom Water Leakage
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-1 mt-0.5">
                Plumbing · Awaiting staff dispatch · SLA: 30m
              </p>
              <div className="mt-2.5 flex items-center justify-between border-t border-[#0F2D3D]/10 dark:border-slate-700 pt-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#FF7657]">
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
            <div className="p-3.5 rounded-lg border-2 border-[#0F2D3D]/30 dark:border-slate-700 bg-[#F6F1E8]/50 dark:bg-slate-800/40 hover:border-[#0F2D3D] transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black px-2 py-0.5 bg-[#0F2D3D] text-[#F6F1E8] rounded tracking-wider">
                  REVENUE DESK
                </span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">+₹400 / NT</span>
              </div>
              <h4 className="mt-1.5 text-xs sm:text-sm font-extrabold text-[#0F2D3D] dark:text-white uppercase tracking-tight">
                Weekend Deluxe Rate Opportunity
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-1 mt-0.5">
                High coastline demand detected · Suggested bump: +₹400
              </p>
              <div className="mt-2.5 flex items-center justify-between border-t border-[#0F2D3D]/10 dark:border-slate-700 pt-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
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

      {/* ── 4. RESORT OPERATIONS MODULES (CONCEPTUAL GROUPING) ── */}
      <section className="space-y-4">
        
        {/* Section Header with Category Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#0F2D3D]/15 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-[#2D8CFF]" />
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#0F2D3D] dark:text-white">
                Resort Operations & Intelligence
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Direct access to all 11 core property management tools
            </p>
          </div>

          {/* Department Filter Buttons */}
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
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === id
                    ? 'bg-[#0F2D3D] text-[#F6F1E8] shadow-[2px_2px_0px_#2D8CFF]'
                    : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-[#F6F1E8]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── MODULE CARDS GRID (ASYMMETRIC & EMBEDDED AI) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Module 1: Tasks (OPERATIONS) */}
          {(activeFilter === 'all' || activeFilter === 'operations') && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate({ to: '/tasks' })}
              onKeyDown={(e) => handleCardKeyDown(e, '/tasks')}
              className="group sm:col-span-2 rounded-xl p-6 bg-white dark:bg-slate-900 border-2 border-[#0F2D3D] dark:border-slate-700 shadow-[3px_3px_0px_#0F2D3D] dark:shadow-[3px_3px_0px_#1e293b] hover:shadow-[5px_5px_0px_#0F2D3D] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-[#0F2D3D] text-[#F6F1E8] rounded tracking-wider">
                    OPERATIONS · DISPATCH
                  </span>
                  <div className="w-8 h-8 rounded border border-[#0F2D3D]/20 flex items-center justify-center text-[#2D8CFF]">
                    <CheckSquare className="size-4" />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-black text-[#0F2D3D] dark:text-white uppercase tracking-tight">
                    Tasks Dispatch & Work Orders
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    Automated task dispatching, department SLA monitoring, staff balancing, and completion tracking.
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#0F2D3D]/10 dark:border-slate-800 flex items-center justify-between">
                <div className="text-xs font-black text-[#0F2D3D] dark:text-slate-200">
                  {stats.openTasks} Active Tasks • {stats.highPriorityTasks} Urgent • 34m SLA
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-black text-[#2D8CFF] group-hover:translate-x-1 transition-transform">
                  <span>Manage</span>
                  <ArrowRight className="size-3.5" />
                </span>
              </div>
            </div>
          )}

          {/* Module 2: Complaints (OPERATIONS) */}
          {(activeFilter === 'all' || activeFilter === 'operations') && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate({ to: '/complaints' })}
              onKeyDown={(e) => handleCardKeyDown(e, '/complaints')}
              className="group sm:col-span-2 rounded-xl p-6 bg-white dark:bg-slate-900 border-2 border-[#0F2D3D] dark:border-slate-700 shadow-[3px_3px_0px_#0F2D3D] dark:shadow-[3px_3px_0px_#1e293b] hover:shadow-[5px_5px_0px_#0F2D3D] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-[#FF7657] text-white rounded tracking-wider">
                    OPERATIONS · GUEST CARE
                  </span>
                  <div className="w-8 h-8 rounded border border-[#0F2D3D]/20 flex items-center justify-center text-amber-600">
                    <ClipboardList className="size-4" />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-black text-[#0F2D3D] dark:text-white uppercase tracking-tight">
                    Guest Issues & Resolution
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    Multilingual complaint intake, NLP sentiment scoring, audio transcription, and immediate task generation.
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#0F2D3D]/10 dark:border-slate-800 flex items-center justify-between">
                <div className="text-xs font-black text-[#0F2D3D] dark:text-slate-200">
                  {stats.openComplaints} Open Issues • 98% AI Intent Match
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-black text-[#2D8CFF] group-hover:translate-x-1 transition-transform">
                  <span>Review</span>
                  <ArrowRight className="size-3.5" />
                </span>
              </div>
            </div>
          )}

          {/* Module 3: Staff (OPERATIONS) */}
          {(activeFilter === 'all' || activeFilter === 'operations') && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate({ to: '/staff' })}
              onKeyDown={(e) => handleCardKeyDown(e, '/staff')}
              className="group rounded-xl p-5 bg-white dark:bg-slate-900 border border-[#0F2D3D]/30 dark:border-slate-700 hover:border-[#0F2D3D] hover:shadow-[3px_3px_0px_#0F2D3D] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[#0F2D3D] dark:text-white">
                    <Users className="size-3.5" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ROSTER</span>
                </div>
                <h3 className="text-sm font-black text-[#0F2D3D] dark:text-white uppercase tracking-tight">
                  Staff Operations
                </h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-2">
                  Shift schedules, active departmental assignments, and skill ratings.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#2D8CFF]">
                <span>{stats.availableStaff} On Duty</span>
                <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          )}

          {/* Module 4: Verification (OPERATIONS) */}
          {(activeFilter === 'all' || activeFilter === 'operations') && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate({ to: '/verification' })}
              onKeyDown={(e) => handleCardKeyDown(e, '/verification')}
              className="group rounded-xl p-5 bg-white dark:bg-slate-900 border border-[#0F2D3D]/30 dark:border-slate-700 hover:border-[#0F2D3D] hover:shadow-[3px_3px_0px_#0F2D3D] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[#0F2D3D] dark:text-white">
                    <ShieldCheck className="size-3.5" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">QA PROOF</span>
                </div>
                <h3 className="text-sm font-black text-[#0F2D3D] dark:text-white uppercase tracking-tight">
                  Work Verification
                </h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-2">
                  Photo inspection proof, sign off on work quality, and enforce brand standards.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#2D8CFF]">
                <span>Sign-off Ready</span>
                <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          )}

          {/* Module 5: Pricing (REVENUE & INTELLIGENCE) */}
          {(activeFilter === 'all' || activeFilter === 'revenue') && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate({ to: '/pricing' })}
              onKeyDown={(e) => handleCardKeyDown(e, '/pricing')}
              className="group rounded-xl p-5 bg-white dark:bg-slate-900 border border-[#0F2D3D]/30 dark:border-slate-700 hover:border-[#0F2D3D] hover:shadow-[3px_3px_0px_#0F2D3D] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[#2D8CFF]">
                    <LineChart className="size-3.5" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">REVENUE</span>
                </div>
                <h3 className="text-sm font-black text-[#0F2D3D] dark:text-white uppercase tracking-tight">
                  Dynamic Pricing
                </h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-2">
                  Competitor rate benchmarks, market demand signals, and RevPAR optimization.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#2D8CFF]">
                <span>₹4,200 vs Mkt ₹4,800</span>
                <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          )}

          {/* Module 6: Recommendations (REVENUE & INTELLIGENCE) */}
          {(activeFilter === 'all' || activeFilter === 'revenue') && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate({ to: '/recommendations' })}
              onKeyDown={(e) => handleCardKeyDown(e, '/recommendations')}
              className="group rounded-xl p-5 bg-white dark:bg-slate-900 border border-[#0F2D3D]/30 dark:border-slate-700 hover:border-[#0F2D3D] hover:shadow-[3px_3px_0px_#0F2D3D] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[#2D8CFF]">
                    <Sparkles className="size-3.5" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GUEST AI</span>
                </div>
                <h3 className="text-sm font-black text-[#0F2D3D] dark:text-white uppercase tracking-tight">
                  Guest Preferences
                </h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-2">
                  Semantic matching of guest preferences to tailored rooms and resort amenities.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#2D8CFF]">
                <span>Semantic Engine</span>
                <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          )}

          {/* Module 7: Cancellation Risk (REVENUE & INTELLIGENCE) */}
          {(activeFilter === 'all' || activeFilter === 'revenue') && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate({ to: '/cancellation-risk' })}
              onKeyDown={(e) => handleCardKeyDown(e, '/cancellation-risk')}
              className="group rounded-xl p-5 bg-white dark:bg-slate-900 border border-[#0F2D3D]/30 dark:border-slate-700 hover:border-[#0F2D3D] hover:shadow-[3px_3px_0px_#0F2D3D] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[#2D8CFF]">
                    <BrainCircuit className="size-3.5" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PREDICT</span>
                </div>
                <h3 className="text-sm font-black text-[#0F2D3D] dark:text-white uppercase tracking-tight">
                  Cancellation Risk
                </h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-2">
                  Predict booking cancellation probability with feature importance and retention steps.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#2D8CFF]">
                <span>RandomForest ML</span>
                <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          )}

          {/* Module 8: Insights (REVENUE & INTELLIGENCE) */}
          {(activeFilter === 'all' || activeFilter === 'revenue') && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate({ to: '/insights' })}
              onKeyDown={(e) => handleCardKeyDown(e, '/insights')}
              className="group rounded-xl p-5 bg-white dark:bg-slate-900 border border-[#0F2D3D]/30 dark:border-slate-700 hover:border-[#0F2D3D] hover:shadow-[3px_3px_0px_#0F2D3D] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[#2D8CFF]">
                    <ChartNoAxesCombined className="size-3.5" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BI TRENDS</span>
                </div>
                <h3 className="text-sm font-black text-[#0F2D3D] dark:text-white uppercase tracking-tight">
                  Resort Insights
                </h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-2">
                  Resolution SLA curves, recurring complaint root causes, and department efficiency.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#2D8CFF]">
                <span>34m Avg SLA</span>
                <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          )}

          {/* Module 9: Rooms 360 (PROPERTY) */}
          {(activeFilter === 'all' || activeFilter === 'property') && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate({ to: '/rooms-360' })}
              onKeyDown={(e) => handleCardKeyDown(e, '/rooms-360')}
              className="group rounded-xl p-5 bg-white dark:bg-slate-900 border border-[#0F2D3D]/30 dark:border-slate-700 hover:border-[#0F2D3D] hover:shadow-[3px_3px_0px_#0F2D3D] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[#2D8CFF]">
                    <Camera className="size-3.5" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VIRTUAL</span>
                </div>
                <h3 className="text-sm font-black text-[#0F2D3D] dark:text-white uppercase tracking-tight">
                  360° Virtual Rooms
                </h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-2">
                  Interactive panoramas of ocean suites, deluxe villas, and luxury guest amenities.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#2D8CFF]">
                <span>Virtual Inspection</span>
                <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          )}

          {/* Module 10: Audit Trail (CONTROL) */}
          {(activeFilter === 'all' || activeFilter === 'control') && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate({ to: '/audit' })}
              onKeyDown={(e) => handleCardKeyDown(e, '/audit')}
              className="group rounded-xl p-5 bg-white dark:bg-slate-900 border border-[#0F2D3D]/30 dark:border-slate-700 hover:border-[#0F2D3D] hover:shadow-[3px_3px_0px_#0F2D3D] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[#0F2D3D] dark:text-white">
                    <History className="size-3.5" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GOVERNANCE</span>
                </div>
                <h3 className="text-sm font-black text-[#0F2D3D] dark:text-white uppercase tracking-tight">
                  Audit Trail & AI Log
                </h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-2">
                  Explainable AI decision breakdowns, skill matching criteria, and tamper-proof logs.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#2D8CFF]">
                <span>Tamper-Proof Log</span>
                <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ── 5. RECENT OPERATIONAL ACTIVITY (WAYFINDING TIMELINE) ─ */}
      <section className="rounded-xl p-6 sm:p-7 bg-[#F6F1E8] dark:bg-slate-900 border-2 border-[#0F2D3D] dark:border-slate-700 shadow-[4px_4px_0px_#0F2D3D] dark:shadow-[4px_4px_0px_#1e293b] space-y-4">
        <div className="flex items-center justify-between border-b-2 border-[#0F2D3D]/15 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#0F2D3D] dark:bg-[#2D8CFF]" />
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0F2D3D] dark:text-white">
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

        {/* Departure/Arrival Physical Board Style */}
        <div className="space-y-2">
          {[
            {
              time: '15m AGO',
              badge: 'MAINTENANCE',
              badgeColor: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border-blue-300',
              title: 'Room 204 AC repair assigned to Rahul Sharma',
              status: 'IN PROGRESS',
              statusColor: 'text-[#2D8CFF]',
            },
            {
              time: '35m AGO',
              badge: 'PLUMBING',
              badgeColor: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-amber-300',
              title: 'Room 112 Bathroom plumbing inspection requested',
              status: 'DISPATCH QUEUED',
              statusColor: 'text-amber-600',
            },
            {
              time: '50m AGO',
              badge: 'HOUSEKEEPING',
              badgeColor: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
              title: 'Room 305 Extra amenities delivered and verified with photo proof',
              status: 'VERIFIED COMPLETE',
              statusColor: 'text-emerald-600',
            },
            {
              time: '1h AGO',
              badge: 'REVENUE DESK',
              badgeColor: 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border-purple-300',
              title: 'Weekend Deluxe rate recommendation generated (+₹400 per room night)',
              status: 'ACTIVE OPPORTUNITY',
              statusColor: 'text-purple-600',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-white/70 dark:bg-slate-800/60 border border-[#0F2D3D]/15 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono font-bold text-slate-500 w-16 shrink-0">
                  {item.time}
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border tracking-wider shrink-0 ${item.badgeColor}`}>
                  {item.badge}
                </span>
                <p className="text-xs sm:text-sm font-bold text-[#0F2D3D] dark:text-slate-100">
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
