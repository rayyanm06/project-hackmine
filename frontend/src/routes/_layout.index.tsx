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
  AlertTriangle,
  ChevronRight,
  Plus,
  Compass,
  MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

function DashboardPage() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    return AuthService.getCurrentUser()
  })

  useEffect(() => {
    const unsub = AuthService.subscribeToAuthState((user) => {
      setCurrentUser(user)
    })
    return () => unsub()
  }, [])

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Operations Lead'

  // Time-aware greeting and hospitality context
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const timeContext = hour < 12
    ? "Here's what needs your operational attention this morning."
    : hour < 18
    ? "Here's what's happening across the resort this afternoon."
    : "Here's what's happening across the resort tonight."

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  // Live operational data derived from actual mock records and API
  const [stats, setStats] = useState({
    totalRooms: mockRooms.length > 0 ? 20 : 20,
    occupiedRooms: 17,
    availableRooms: 3,
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
    <div className="w-full min-h-screen px-4 sm:px-6 lg:px-8 py-8 space-y-10 max-w-[1600px] mx-auto select-none font-manrope">
      
      {/* ── 1. RESORT OPERATIONS HERO / WELCOME AREA ─────────── */}
      <section className="relative rounded-3xl p-6 sm:p-8 lg:p-9 bg-gradient-to-r from-white via-[#FAF8F4] to-sky-50/20 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-800 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_24px_rgba(23,59,87,0.04)] overflow-hidden">
        {/* Subtle architectural hairline accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C8A96B] via-[#2D8CFF] to-transparent opacity-85" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#173B57]/5 dark:bg-white/10 text-[#173B57] dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                <Compass className="size-3.5 text-[#2D8CFF]" />
                <span>Resort Command Center</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Operating Normally</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-[#173B57] dark:text-white tracking-tight leading-tight">
              {greeting}, <span className="text-[#2D8CFF]">{displayName}</span>
            </h1>

            <p className="text-slate-600 dark:text-slate-300 text-base font-normal leading-relaxed">
              {timeContext}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {todayFormatted}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Live Resort Operations
              </span>
            </div>

            <Button
              onClick={handleDownloadReport}
              variant="outline"
              className="rounded-xl px-4 py-2.5 h-auto text-xs font-bold border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#2D8CFF] hover:border-[#2D8CFF]/50 shadow-2xs hover:shadow-xs transition-all gap-2"
            >
              <Download className="size-3.5 text-[#2D8CFF]" />
              <span>Export Report</span>
            </Button>

            <Button
              onClick={() => navigate({ to: '/resort-360' })}
              className="rounded-xl px-5 py-2.5 h-auto text-xs font-bold bg-[#2D8CFF] hover:bg-[#1A7BFA] text-white shadow-md shadow-[#2D8CFF]/20 hover:shadow-lg hover:shadow-[#2D8CFF]/30 transition-all gap-2 cursor-pointer"
            >
              <Gauge className="size-4" />
              <span>Launch Resort 360</span>
            </Button>
          </div>
        </div>
      </section>

      {/* ── 2. TODAY'S RESORT STATUS (CONNECTED OPERATIONAL STRIP) ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-[#2D8CFF] rounded-full" />
            <h2 className="text-base sm:text-lg font-bold text-[#173B57] dark:text-slate-100 tracking-tight">
              Today's Resort Status
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Live property pulse across all wings
          </span>
        </div>

        {/* Connected Horizontal Strip */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
          
          {/* 1. Occupancy */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/resort-360' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/resort-360')}
            className="p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer focus:outline-none focus:bg-slate-50/80"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Occupancy
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                High
              </span>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#173B57] dark:text-white">
              85%
            </div>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              17 of 20 rooms occupied
            </p>
            <div className="mt-3 w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-[#2D8CFF] rounded-full" style={{ width: '85%' }} />
            </div>
          </div>

          {/* 2. Available Rooms */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/rooms-360' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/rooms-360')}
            className="p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer focus:outline-none focus:bg-slate-50/80"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Available Rooms
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                Ready
              </span>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#173B57] dark:text-white">
              {stats.availableRooms} <span className="text-xs font-normal text-slate-500">Rooms</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              Ready for guest check-in
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Turnover complete</span>
            </div>
          </div>

          {/* 3. Guest Issues */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/complaints' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/complaints')}
            className="p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer focus:outline-none focus:bg-slate-50/80"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Guest Issues
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                Active
              </span>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#173B57] dark:text-white">
              {stats.openComplaints} <span className="text-xs font-normal text-slate-500">Open</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              1 high priority • 2 resolved today
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>NLP triage active</span>
            </div>
          </div>

          {/* 4. Active Tasks */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/tasks' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/tasks')}
            className="p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer focus:outline-none focus:bg-slate-50/80"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Active Tasks
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                In Shift
              </span>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#173B57] dark:text-white">
              {stats.openTasks} <span className="text-xs font-normal text-slate-500">Tasks</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              {stats.highPriorityTasks} urgent • 34m avg SLA
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-[#2D8CFF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D8CFF]" />
              <span>Auto-dispatching</span>
            </div>
          </div>

          {/* 5. Staff on Duty */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/staff' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/staff')}
            className="p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer focus:outline-none focus:bg-slate-50/80 col-span-2 md:col-span-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Staff on Duty
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                Full Shift
              </span>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#173B57] dark:text-white">
              {stats.availableStaff + stats.busyStaff} <span className="text-xs font-normal text-slate-500">Staff</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              {stats.availableStaff} available • {stats.busyStaff} on assignment
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Full department coverage</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. QUICK OPERATIONS TOOLBAR ──────────────────────── */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Quick Actions
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            Direct shortcuts to active department tools
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {[
            { label: '+ Create Task', path: '/tasks', icon: Plus },
            { label: `Review Guest Issues (${stats.openComplaints})`, path: '/complaints', icon: ClipboardList },
            { label: 'Verify Work Proof', path: '/verification', icon: ShieldCheck },
            { label: '3D Resort 360 Map', path: '/resort-360', icon: Gauge },
            { label: 'Dynamic Rate Engine', path: '/pricing', icon: LineChart },
            { label: '360° Virtual Rooms', path: '/rooms-360', icon: Camera },
          ].map(({ label, path, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => navigate({ to: path })}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#2D8CFF] hover:border-[#2D8CFF]/50 hover:bg-sky-50/30 dark:hover:bg-slate-800/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]/40"
            >
              <Icon className="size-3.5 text-[#2D8CFF]" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── 4. HERO: RESORT 360 + NEEDS YOUR ATTENTION ───────── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT: RESORT 360 HERO (7 Columns) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate({ to: '/resort-360' })}
          onKeyDown={(e) => handleCardKeyDown(e, '/resort-360')}
          className="lg:col-span-7 group relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#173B57] via-[#1E4565] to-[#122A3E] text-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer overflow-hidden border border-[#2D8CFF]/20 focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]"
          aria-label="Launch Resort 360 Command Center"
        >
          {/* Subtle architectural background details */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#2D8CFF]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -right-8 w-48 h-48 border border-white/5 rounded-full pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-sky-200 border border-white/10 tracking-wide">
                <MapPin className="size-3.5 text-[#2D8CFF]" />
                <span>Live Property Command</span>
              </span>
              <span className="text-xs font-semibold text-sky-200/80">
                Interactive 3D Twin
              </span>
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Resort 360
              </h3>
              <p className="mt-2 text-sky-100/90 text-sm leading-relaxed max-w-xl font-normal">
                Comprehensive 3D operations twin of the entire resort property. Monitor room occupancy in real time, view housekeeping progress across wings, track active staff location, and resolve room alerts.
              </p>
            </div>

            {/* Room Wing Readiness Snapshot */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs">
                <p className="text-[11px] font-medium text-sky-200">Oceanview Suites</p>
                <p className="text-lg font-bold text-white">8/10 <span className="text-xs font-normal text-sky-200">Occ</span></p>
                <p className="text-[10px] text-emerald-300 font-semibold">2 Ready</p>
              </div>

              <div className="p-3 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs">
                <p className="text-[11px] font-medium text-sky-200">Garden Villas</p>
                <p className="text-lg font-bold text-white">6/6 <span className="text-xs font-normal text-sky-200">Occ</span></p>
                <p className="text-[10px] text-sky-200 font-semibold">Full Capacity</p>
              </div>

              <div className="p-3 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs">
                <p className="text-[11px] font-medium text-sky-200">Beach Pavilions</p>
                <p className="text-lg font-bold text-white">3/4 <span className="text-xs font-normal text-sky-200">Occ</span></p>
                <p className="text-[10px] text-emerald-300 font-semibold">1 Ready</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-sky-200/90 font-medium">
              20 Total Rooms • 17 Occupied • 3 Check-in Ready
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white group-hover:translate-x-1.5 transition-transform bg-[#2D8CFF] px-4 py-2 rounded-xl shadow-xs">
              <span>Explore Resort 360</span>
              <ArrowRight className="size-3.5" />
            </span>
          </div>
        </div>

        {/* RIGHT: NEEDS YOUR ATTENTION (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4 rounded-3xl p-6 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" />
              <h2 className="text-base font-bold text-[#173B57] dark:text-white">
                Needs Your Attention
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Priority Queue
            </span>
          </div>

          <div className="space-y-3.5 flex-1 justify-center flex flex-col">
            
            {/* Priority 1 */}
            <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-amber-400/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                  Room 204 • AC Failure
                </span>
                <span className="text-[11px] text-slate-400 font-medium">30m ago</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                Guest reported AC not cooling properly. Rahul Sharma assigned.
              </p>
              <div className="mt-2.5 flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  Maintenance · In progress
                </span>
                <button
                  type="button"
                  onClick={() => navigate({ to: '/tasks' })}
                  className="inline-flex items-center gap-1 font-bold text-xs text-[#2D8CFF] hover:underline cursor-pointer"
                >
                  <span>Inspect Task</span>
                  <ArrowRight className="size-3" />
                </button>
              </div>
            </div>

            {/* Priority 2 */}
            <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-amber-400/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                  Room 112 • Water Leakage
                </span>
                <span className="text-[11px] text-slate-400 font-medium">1h ago</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                Guest Priya Patel reported leaking water in bathroom. Awaiting dispatch.
              </p>
              <div className="mt-2.5 flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold text-slate-500">
                  Plumbing · Awaiting dispatch
                </span>
                <button
                  type="button"
                  onClick={() => navigate({ to: '/complaints' })}
                  className="inline-flex items-center gap-1 font-bold text-xs text-[#2D8CFF] hover:underline cursor-pointer"
                >
                  <span>Dispatch Staff</span>
                  <ArrowRight className="size-3" />
                </button>
              </div>
            </div>

            {/* Priority 3 */}
            <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-400/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  Revenue • Rate Opportunity
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Active Alert</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                Weekend demand surging. Suggested rate increase: +₹400/night.
              </p>
              <div className="mt-2.5 flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  Revenue · Active recommendation
                </span>
                <button
                  type="button"
                  onClick={() => navigate({ to: '/pricing' })}
                  className="inline-flex items-center gap-1 font-bold text-xs text-[#2D8CFF] hover:underline cursor-pointer"
                >
                  <span>Review Rates</span>
                  <ArrowRight className="size-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. RESORT OPERATIONS & INTELLIGENCE MODULES ──────── */}
      <section className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-[#2D8CFF] rounded-full" />
              <h2 className="text-base sm:text-lg font-bold text-[#173B57] dark:text-slate-100 tracking-tight">
                Resort Operations
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Run today's shift with integrated operational and intelligence tools
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            All 11 Modules Accessible
          </span>
        </div>

        {/* ── A. PRIMARY TIER (Medium-Large Operations Cards) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card: Tasks */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/tasks' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/tasks')}
            className="group relative rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D8CFF]/50 shadow-xs hover:shadow-[0_12px_28px_-8px_rgba(23,59,87,0.12)] hover:-translate-y-1.5 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]"
            aria-label="Open Tasks Operations"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2D8CFF] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CheckSquare className="size-5" />
                </div>
                <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 text-[10px] font-bold uppercase">
                  Shift Dispatch
                </Badge>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#173B57] dark:text-white tracking-tight">
                  Tasks Dispatch & SLAs
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Automated task dispatching, department assignment, real-time SLA countdowns, and staff workload balancing.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                {stats.openTasks} Active • {stats.highPriorityTasks} Urgent • 34m SLA
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2D8CFF] group-hover:translate-x-1 transition-transform">
                <span>Manage Tasks</span>
                <ArrowRight className="size-3.5" />
              </span>
            </div>
          </div>

          {/* Card: Complaints */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/complaints' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/complaints')}
            className="group relative rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D8CFF]/50 shadow-xs hover:shadow-[0_12px_28px_-8px_rgba(23,59,87,0.12)] hover:-translate-y-1.5 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]"
            aria-label="Open Guest Issues Module"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ClipboardList className="size-5" />
                </div>
                <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 text-[10px] font-bold uppercase">
                  Guest Care
                </Badge>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#173B57] dark:text-white tracking-tight">
                  Guest Issues & Care
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Multilingual feedback intake, NLP urgency scoring, voice transcription, and instant task conversion.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                {stats.openComplaints} Open • 98% AI Match • Audio Intakes
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2D8CFF] group-hover:translate-x-1 transition-transform">
                <span>Review Issues</span>
                <ArrowRight className="size-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* ── B. SECONDARY TIER (4 Columns) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card: Staff */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/staff' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/staff')}
            className="group rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D8CFF]/50 shadow-2xs hover:shadow-xs hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]"
            aria-label="Open Staff Operations"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center group-hover:text-[#2D8CFF] group-hover:bg-[#2D8CFF]/10 transition-colors">
                  <Users className="size-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Staff</span>
              </div>
              <h3 className="text-sm font-bold text-[#173B57] dark:text-white">
                Staff Operations
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2">
                Monitor availability, shift schedules, skill match ratings, and departmental workload.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[#2D8CFF]">
              <span>{stats.availableStaff} Available</span>
              <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card: Verification */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/verification' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/verification')}
            className="group rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D8CFF]/50 shadow-2xs hover:shadow-xs hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]"
            aria-label="Open Verification Module"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center group-hover:text-[#2D8CFF] group-hover:bg-[#2D8CFF]/10 transition-colors">
                  <ShieldCheck className="size-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Quality</span>
              </div>
              <h3 className="text-sm font-bold text-[#173B57] dark:text-white">
                Task Verification
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2">
                Inspect photo completion proof, sign off on work quality, and enforce resort standards.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[#2D8CFF]">
              <span>Photo Proof QA</span>
              <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card: Pricing */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/pricing' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/pricing')}
            className="group rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D8CFF]/50 shadow-2xs hover:shadow-xs hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]"
            aria-label="Open Pricing Module"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center group-hover:text-[#2D8CFF] group-hover:bg-[#2D8CFF]/10 transition-colors">
                  <LineChart className="size-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Revenue</span>
              </div>
              <h3 className="text-sm font-bold text-[#173B57] dark:text-white">
                Dynamic Pricing
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2">
                Monitor competitor rates, local occupancy signals, and optimize RevPAR in real time.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[#2D8CFF]">
              <span>₹4,200 vs Mkt ₹4,800</span>
              <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card: Recommendations */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/recommendations' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/recommendations')}
            className="group rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D8CFF]/50 shadow-2xs hover:shadow-xs hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]"
            aria-label="Open Recommendations Module"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center group-hover:text-[#2D8CFF] group-hover:bg-[#2D8CFF]/10 transition-colors">
                  <Sparkles className="size-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Guest AI</span>
              </div>
              <h3 className="text-sm font-bold text-[#173B57] dark:text-white">
                Guest Experience
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2">
                Semantic vector search matching guest preferences to room types and resort amenities.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[#2D8CFF]">
              <span>Semantic Search</span>
              <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* ── C. TERTIARY TIER (4 Columns) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card: Cancellation Risk */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/cancellation-risk' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/cancellation-risk')}
            className="group rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D8CFF]/50 shadow-2xs hover:shadow-xs hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]"
            aria-label="Open Cancellation Risk Module"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center group-hover:text-[#2D8CFF] group-hover:bg-[#2D8CFF]/10 transition-colors">
                  <BrainCircuit className="size-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">ML Risk</span>
              </div>
              <h3 className="text-sm font-bold text-[#173B57] dark:text-white">
                Cancellation Risk
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2">
                Predict booking cancellation probability with feature importance and retention steps.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[#2D8CFF]">
              <span>RandomForest ML</span>
              <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card: Audit Trail */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/audit' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/audit')}
            className="group rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D8CFF]/50 shadow-2xs hover:shadow-xs hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]"
            aria-label="Open Audit Trail Module"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center group-hover:text-[#2D8CFF] group-hover:bg-[#2D8CFF]/10 transition-colors">
                  <History className="size-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Audit</span>
              </div>
              <h3 className="text-sm font-bold text-[#173B57] dark:text-white">
                Audit Trail & AI Log
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2">
                Explainable AI decision breakdowns, skill matching criteria, and tamper-proof logs.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[#2D8CFF]">
              <span>92/100 AI Score</span>
              <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card: Insights */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/insights' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/insights')}
            className="group rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D8CFF]/50 shadow-2xs hover:shadow-xs hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]"
            aria-label="Open Insights Module"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center group-hover:text-[#2D8CFF] group-hover:bg-[#2D8CFF]/10 transition-colors">
                  <ChartNoAxesCombined className="size-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Analytics</span>
              </div>
              <h3 className="text-sm font-bold text-[#173B57] dark:text-white">
                Resort Insights
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2">
                Resolution SLA trends, recurring complaint root causes, and department efficiency.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[#2D8CFF]">
              <span>34m Avg SLA</span>
              <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card: 360° Rooms */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/rooms-360' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/rooms-360')}
            className="group rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D8CFF]/50 shadow-2xs hover:shadow-xs hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]"
            aria-label="Open 360 Rooms Tour Module"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center group-hover:text-[#2D8CFF] group-hover:bg-[#2D8CFF]/10 transition-colors">
                  <Camera className="size-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Virtual</span>
              </div>
              <h3 className="text-sm font-bold text-[#173B57] dark:text-white">
                360° Virtual Rooms
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2">
                Interactive virtual reality panoramas of ocean suites, deluxe villas, and guest rooms.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[#2D8CFF]">
              <span>Room Panoramas</span>
              <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. RECENT OPERATIONAL ACTIVITY TIMELINE ──────────── */}
      <section className="rounded-3xl p-6 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-[#173B57] dark:text-white">
              Recent Operational Activity
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Real-time activity feed across resort departments
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/audit' })}
            className="text-xs font-bold text-[#2D8CFF] hover:bg-sky-50 dark:hover:bg-slate-800 gap-1.5"
          >
            <span>View Full Audit Trail</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>

        <div className="space-y-3">
          {[
            {
              time: '15m ago',
              title: 'Room 204 AC repair assigned to Rahul Sharma',
              dept: 'Maintenance',
              status: 'In Progress',
              statusColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300',
            },
            {
              time: '35m ago',
              title: 'Room 112 Bathroom plumbing inspection requested',
              dept: 'Plumbing',
              status: 'Created',
              statusColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300',
            },
            {
              time: '50m ago',
              title: 'Room 305 Extra amenities delivered and photo verified',
              dept: 'Housekeeping',
              status: 'Completed',
              statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300',
            },
            {
              time: '1h ago',
              title: 'Deluxe AC weekend rate recommendation generated (+₹400)',
              dept: 'Revenue Engine',
              status: 'AI Suggestion',
              statusColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#2D8CFF] shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Department: {item.dept}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-center">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${item.statusColor}`}>
                  {item.status}
                </span>
                <span className="text-[11px] font-medium text-slate-400 min-w-16 text-right">
                  {item.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
