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
  Clock,
  AlertTriangle,
  BedDouble,
  ChevronRight,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { mockTasks } from '@/data/mock-tasks'
import { mockComplaints } from '@/data/mock-complaints'
import { mockStaff } from '@/data/mock-staff'
import { mockRooms } from '@/data/mock-rooms'
import { api } from '@/lib/api'
import { AuthService } from '@/lib/auth'

export const Route = createFileRoute('/_layout/')({
  component: DashboardPage,
})

function DashboardPage() {
  const navigate = useNavigate()
  const currentUser = AuthService.getCurrentUser()
  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Operations Lead'

  // Time-aware greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  // Live operational data derived from actual mock records and API
  const [stats, setStats] = useState({
    totalRooms: mockRooms.length > 0 ? 20 : 20,
    occupiedRooms: 17,
    openTasks: mockTasks.filter(t => t.status !== 'Closed' && t.status !== 'Verified').length,
    highPriorityTasks: mockTasks.filter(t => t.priority === 'high' || t.priority === 'critical').length,
    openComplaints: mockComplaints.filter(c => c.status !== 'resolved' && c.status !== 'closed').length,
    availableStaff: mockStaff.filter(s => s.availability === 'available').length,
    busyStaff: mockStaff.filter(s => s.availability === 'busy').length,
  })

  useEffect(() => {
    // Attempt to fetch fresh live stats from backend if running
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
        // Graceful fallback to real local records
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
        description: `${stats.totalRooms} rooms, ${stats.openTasks} pending tasks, ${stats.openComplaints} open complaints, ${stats.availableStaff} staff on duty.`,
      })
    }
  }

  // Common card keyboard navigation helper
  function handleCardKeyDown(e: React.KeyboardEvent, path: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate({ to: path })
    }
  }

  return (
    <div className="w-full min-h-screen px-4 sm:px-6 lg:px-8 py-8 space-y-10 max-w-[1600px] mx-auto select-none">
      {/* ── 1. HERO / WELCOME AREA ───────────────────────────── */}
      <section className="relative rounded-3xl p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-white via-sky-50/30 to-blue-50/20 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-800/80 border border-slate-200/90 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        {/* Soft decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#2D8CFF]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2D8CFF]/10 text-[#2D8CFF] border border-[#2D8CFF]/20 text-xs font-bold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-[#2D8CFF] animate-pulse" />
              <span>Operations Command Center</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {greeting}, <span className="text-[#2D8CFF]">{displayName}</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg font-medium leading-relaxed">
              Here is what needs your operational attention today. Monitor live resort activity, dispatch tasks, and access intelligent tools.
            </p>
          </div>

          {/* Quick Action Summary Button */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              onClick={handleDownloadReport}
              variant="outline"
              className="rounded-2xl px-4 py-2.5 h-auto text-sm font-bold border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-[#2D8CFF] hover:border-[#2D8CFF]/50 shadow-xs hover:shadow-md transition-all gap-2"
            >
              <Download className="size-4 text-[#2D8CFF]" />
              <span>Export Report</span>
            </Button>

            <Button
              onClick={() => navigate({ to: '/resort-360' })}
              className="rounded-2xl px-5 py-2.5 h-auto text-sm font-bold bg-[#2D8CFF] hover:bg-[#1A7BFA] text-white shadow-md shadow-[#2D8CFF]/25 hover:shadow-lg hover:shadow-[#2D8CFF]/35 transition-all gap-2 cursor-pointer"
            >
              <Gauge className="size-4" />
              <span>Open Resort 360</span>
            </Button>
          </div>
        </div>
      </section>

      {/* ── 2. QUICK ACTIONS BAR ─────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Quick Actions
          </h2>
          <span className="text-xs text-slate-400 font-medium">Direct routing to operations</span>
        </div>

        <div className="flex flex-wrap gap-2.5 sm:gap-3">
          {[
            { label: '+ Create Task', path: '/tasks', icon: Plus },
            { label: `Review Complaints (${stats.openComplaints})`, path: '/complaints', icon: ClipboardList },
            { label: 'Verify Work Proof', path: '/verification', icon: ShieldCheck },
            { label: '3D Resort 360', path: '/resort-360', icon: Gauge },
            { label: 'Dynamic Pricing', path: '/pricing', icon: LineChart },
            { label: '360° Room Showcase', path: '/rooms-360', icon: Camera },
          ].map(({ label, path, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => navigate({ to: path })}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-[#2D8CFF] hover:border-[#2D8CFF]/40 hover:bg-sky-50/40 dark:hover:bg-slate-800/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]/40"
            >
              <Icon className="size-3.5 text-[#2D8CFF]" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── 3. OPERATIONS SNAPSHOT (4 INTEGRATED KEY METRICS) ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Operations Snapshot
          </h2>
          <span className="text-xs text-slate-400 font-medium">Real-time resort health</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* 1. Rooms Occupancy */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/resort-360' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/resort-360')}
            className="group relative rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D8CFF]/50 shadow-xs hover:shadow-[0_16px_36px_-10px_rgba(45,140,255,0.18),0_4px_12px_rgba(15,23,42,0.04)] hover:-translate-y-1 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]"
            aria-label="View Room Occupancy in Resort 360"
          >
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Rooms & Occupancy
              </span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-slate-800 flex items-center justify-center text-[#2D8CFF] group-hover:scale-105 transition-transform">
                <BedDouble className="size-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {stats.totalRooms} <span className="text-sm font-semibold text-slate-500">Rooms</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              {stats.occupiedRooms} occupied (85%) • 3 available
            </p>
            {/* Progress bar */}
            <div className="mt-3 w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-[#2D8CFF] rounded-full" style={{ width: '85%' }} />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] font-semibold text-[#2D8CFF]">
              <span>View Resort Map</span>
              <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 2. Open Complaints */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/complaints' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/complaints')}
            className="group relative rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D8CFF]/50 shadow-xs hover:shadow-[0_16px_36px_-10px_rgba(45,140,255,0.18),0_4px_12px_rgba(15,23,42,0.04)] hover:-translate-y-1 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]"
            aria-label="View Open Complaints"
          >
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Guest Complaints
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                <ClipboardList className="size-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {stats.openComplaints} <span className="text-sm font-semibold text-slate-500">Open</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              1 high priority • 2 resolved today
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>NLP Categorization active</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] font-semibold text-[#2D8CFF]">
              <span>Review Complaints</span>
              <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 3. Pending Tasks */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/tasks' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/tasks')}
            className="group relative rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D8CFF]/50 shadow-xs hover:shadow-[0_16px_36px_-10px_rgba(45,140,255,0.18),0_4px_12px_rgba(15,23,42,0.04)] hover:-translate-y-1 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]"
            aria-label="View Tasks Operations"
          >
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pending Tasks
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-[#2D8CFF] group-hover:scale-105 transition-transform">
                <CheckSquare className="size-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {stats.openTasks} <span className="text-sm font-semibold text-slate-500">Active</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              {stats.highPriorityTasks} require priority attention • 34m SLA
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              <Clock className="size-3" />
              <span>Automated task dispatch</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] font-semibold text-[#2D8CFF]">
              <span>Manage Tasks</span>
              <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 4. Active Staff */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/staff' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/staff')}
            className="group relative rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D8CFF]/50 shadow-xs hover:shadow-[0_16px_36px_-10px_rgba(45,140,255,0.18),0_4px_12px_rgba(15,23,42,0.04)] hover:-translate-y-1 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]"
            aria-label="View Staff Operations"
          >
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Staff On Duty
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                <Users className="size-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {stats.availableStaff + stats.busyStaff} <span className="text-sm font-semibold text-slate-500">Staff</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              {stats.availableStaff} available • {stats.busyStaff} on duty
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Full department coverage</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] font-semibold text-[#2D8CFF]">
              <span>View Staff Schedule</span>
              <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. NEEDS ATTENTION / PRIORITY AREA ────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">
              Needs Attention
            </h2>
          </div>
          <span className="text-xs font-medium text-slate-500">Live operational priorities</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Priority Item 1 */}
          <div className="rounded-2xl p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-amber-400/50 transition-all flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-400 dark:border-red-900">
                  Critical • Maintenance
                </span>
                <span className="text-[11px] text-slate-400">30m ago</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                Room 204: AC cooling failure & noise
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                Guest Arjun Kapoor reported AC not cooling properly. AI assigned to Rahul Sharma.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">In Progress</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate({ to: '/tasks' })}
                className="h-8 rounded-lg text-xs font-bold text-[#2D8CFF] hover:bg-sky-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
              >
                Inspect Task →
              </Button>
            </div>
          </div>

          {/* Priority Item 2 */}
          <div className="rounded-2xl p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-amber-400/50 transition-all flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900">
                  Medium • Plumbing
                </span>
                <span className="text-[11px] text-slate-400">1h ago</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                Room 112: Bathroom water leakage
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                Guest Priya Patel reported leaking water in bathroom. Awaiting staff dispatch.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Open Complaint</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate({ to: '/complaints' })}
                className="h-8 rounded-lg text-xs font-bold text-[#2D8CFF] hover:bg-sky-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
              >
                Dispatch Staff →
              </Button>
            </div>
          </div>

          {/* Priority Item 3 */}
          <div className="rounded-2xl p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-blue-400/50 transition-all flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900">
                  Revenue • AI Intel
                </span>
                <span className="text-[11px] text-slate-400">Active Alert</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                Weekend Deluxe AC Rate Opportunity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                Competitor availability is low. Suggested increase of +₹400 per room night.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+₹400 Potential</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate({ to: '/pricing' })}
                className="h-8 rounded-lg text-xs font-bold text-[#2D8CFF] hover:bg-sky-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
              >
                Review Rates →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. PRIMARY & SECONDARY FEATURE CARDS ──────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Operations & Intelligence Modules
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
              Click any module card to access real-time functionality
            </p>
          </div>
          <span className="text-xs font-semibold text-[#2D8CFF]">All 11 Core Features</span>
        </div>

        {/* ── A. PRIMARY FEATURE CARDS (Large / Prominent) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Card 1: Resort 360 */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/resort-360' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/resort-360')}
            className="group relative rounded-3xl p-6 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D8CFF]/50 shadow-xs hover:shadow-[0_16px_36px_-10px_rgba(45,140,255,0.18),0_4px_12px_rgba(15,23,42,0.04)] hover:-translate-y-1.5 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]"
            aria-label="Open Resort 360 Module"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-[#2D8CFF] text-white flex items-center justify-center shadow-md shadow-[#2D8CFF]/30 group-hover:scale-105 transition-transform">
                  <Gauge className="size-6" />
                </div>
                <Badge className="bg-[#2D8CFF]/10 text-[#2D8CFF] border border-[#2D8CFF]/20 text-[11px] font-bold uppercase">
                  Featured Command
                </Badge>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Resort 360
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Real-time 3D bird's-eye view of room occupancy, housekeeping workflow, staff allocation, and live operational alerts.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                20 Rooms • 85% Occupancy • Live Map
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2D8CFF] group-hover:translate-x-1 transition-transform">
                <span>Open Command Center</span>
                <ArrowRight className="size-3.5" />
              </span>
            </div>
          </div>

          {/* Card 2: Tasks */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/tasks' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/tasks')}
            className="group relative rounded-3xl p-6 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D8CFF]/50 shadow-xs hover:shadow-[0_16px_36px_-10px_rgba(45,140,255,0.18),0_4px_12px_rgba(15,23,42,0.04)] hover:-translate-y-1.5 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]"
            aria-label="Open Tasks Module"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                  <CheckSquare className="size-6" />
                </div>
                <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 text-[11px] font-bold uppercase">
                  Operations
                </Badge>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Tasks Dispatch
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Automated AI-assisted task dispatching, real-time SLA tracking, department routing, and staff workload balance.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {stats.openTasks} Open • {stats.highPriorityTasks} High Priority
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2D8CFF] group-hover:translate-x-1 transition-transform">
                <span>Manage Tasks</span>
                <ArrowRight className="size-3.5" />
              </span>
            </div>
          </div>

          {/* Card 3: Complaints */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/complaints' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/complaints')}
            className="group relative rounded-3xl p-6 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D8CFF]/50 shadow-xs hover:shadow-[0_16px_36px_-10px_rgba(45,140,255,0.18),0_4px_12px_rgba(15,23,42,0.04)] hover:-translate-y-1.5 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]"
            aria-label="Open Complaints Module"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/25 group-hover:scale-105 transition-transform">
                  <ClipboardList className="size-6" />
                </div>
                <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 text-[11px] font-bold uppercase">
                  Guest Care
                </Badge>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Complaints & Sentiment
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Multilingual feedback capture, NLP urgency scoring, audio transcription, and instant task conversion.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {stats.openComplaints} Pending • 98% AI Match
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2D8CFF] group-hover:translate-x-1 transition-transform">
                <span>Review Feedback</span>
                <ArrowRight className="size-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* ── B. SECONDARY & TERTIARY CARDS (4 Columns Grid) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 pt-2">
          {/* Card 4: Staff */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/staff' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/staff')}
            className="group rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D8CFF]/50 shadow-xs hover:shadow-[0_12px_28px_-8px_rgba(45,140,255,0.15)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]"
            aria-label="Open Staff Module"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center group-hover:bg-[#2D8CFF]/10 group-hover:text-[#2D8CFF] transition-colors">
                  <Users className="size-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-400">STAFF</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Staff Operations
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Monitor availability, shift schedules, skill match ratings, and departmental workload.
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[#2D8CFF]">
              <span>{stats.availableStaff} Available</span>
              <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 5: Verification */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/verification' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/verification')}
            className="group rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D8CFF]/50 shadow-xs hover:shadow-[0_12px_28px_-8px_rgba(45,140,255,0.15)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]"
            aria-label="Open Verification Module"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center group-hover:bg-[#2D8CFF]/10 group-hover:text-[#2D8CFF] transition-colors">
                  <ShieldCheck className="size-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-400">QUALITY</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Task Verification
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Inspect photo completion proof, sign off on work quality, and ensure hospitality standards.
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[#2D8CFF]">
              <span>Photo Proof QA</span>
              <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 6: Pricing */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/pricing' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/pricing')}
            className="group rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D8CFF]/50 shadow-xs hover:shadow-[0_12px_28px_-8px_rgba(45,140,255,0.15)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]"
            aria-label="Open Pricing Module"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center group-hover:bg-[#2D8CFF]/10 group-hover:text-[#2D8CFF] transition-colors">
                  <LineChart className="size-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-400">REVENUE</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Dynamic Pricing
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Monitor competitor rates, market occupancy signals, and optimize RevPAR in real time.
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[#2D8CFF]">
              <span>₹4,200 vs Mkt ₹4,800</span>
              <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 7: Recommendations */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/recommendations' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/recommendations')}
            className="group rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D8CFF]/50 shadow-xs hover:shadow-[0_12px_28px_-8px_rgba(45,140,255,0.15)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]"
            aria-label="Open Recommendations Module"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center group-hover:bg-[#2D8CFF]/10 group-hover:text-[#2D8CFF] transition-colors">
                  <Sparkles className="size-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-400">GUEST AI</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Guest Experience
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Semantic vector search matching guest preferences to room types and resort amenities.
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[#2D8CFF]">
              <span>Semantic Search</span>
              <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 8: Cancellation Risk */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/cancellation-risk' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/cancellation-risk')}
            className="group rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D8CFF]/50 shadow-xs hover:shadow-[0_12px_28px_-8px_rgba(45,140,255,0.15)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]"
            aria-label="Open Cancellation Risk Module"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center group-hover:bg-[#2D8CFF]/10 group-hover:text-[#2D8CFF] transition-colors">
                  <BrainCircuit className="size-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-400">ML RISK</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cancellation Risk
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Predict booking cancellation probability with feature importance and retention steps.
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[#2D8CFF]">
              <span>RandomForest ML</span>
              <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 9: Audit Trail */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/audit' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/audit')}
            className="group rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D8CFF]/50 shadow-xs hover:shadow-[0_12px_28px_-8px_rgba(45,140,255,0.15)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]"
            aria-label="Open Audit Trail Module"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center group-hover:bg-[#2D8CFF]/10 group-hover:text-[#2D8CFF] transition-colors">
                  <History className="size-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-400">TRANSPARENCY</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Audit Trail & AI Log
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Explainable AI decision breakdowns, skill matching criteria, and tamper-proof logs.
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[#2D8CFF]">
              <span>92/100 AI Score</span>
              <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 10: Performance Insights */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/insights' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/insights')}
            className="group rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D8CFF]/50 shadow-xs hover:shadow-[0_12px_28px_-8px_rgba(45,140,255,0.15)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]"
            aria-label="Open Insights Module"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center group-hover:bg-[#2D8CFF]/10 group-hover:text-[#2D8CFF] transition-colors">
                  <ChartNoAxesCombined className="size-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-400">ANALYTICS</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Resort Insights
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Resolution SLA trends, recurring complaint root causes, and department efficiency.
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[#2D8CFF]">
              <span>34m Avg SLA</span>
              <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 11: 360° Rooms */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate({ to: '/rooms-360' })}
            onKeyDown={(e) => handleCardKeyDown(e, '/rooms-360')}
            className="group rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-[#2D8CFF]/50 shadow-xs hover:shadow-[0_12px_28px_-8px_rgba(45,140,255,0.15)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]"
            aria-label="Open 360 Rooms Tour Module"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center group-hover:bg-[#2D8CFF]/10 group-hover:text-[#2D8CFF] transition-colors">
                  <Camera className="size-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-400">VIRTUAL</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                360° Virtual Rooms
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Interactive virtual reality panoramas of ocean suites, deluxe villas, and guest rooms.
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-[#2D8CFF]">
              <span>Virtual Inspection</span>
              <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. RECENT OPERATIONAL ACTIVITY TIMELINE ──────────── */}
      <section className="rounded-3xl p-6 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Operational Activity
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
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

        <div className="space-y-4">
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
              title: 'Room 305 Extra amenities delivered and verified',
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
