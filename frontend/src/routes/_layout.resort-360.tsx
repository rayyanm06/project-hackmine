import { useState, useEffect, useCallback } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  AlertTriangle, BrainCircuit, Activity, Users, BedDouble,
  RefreshCw, Info, CheckCircle2, Clock, UserCircle2,
  LineChart, ArrowRight, Sparkles
} from 'lucide-react'
import {
  api,
  type ResortStatsResponse,
  type StaffMemberResponse,
  type RoomResponse,
  type TaskResponse,
  type RecommendationResponse,
  type SystemicIssueResponse,
} from '@/lib/api'

export const Route = createFileRoute('/_layout/resort-360')({
  component: Resort360Page,
})

// ── Helpers ──────────────────────────────────────────────────────────────────

const TASK_STATUS_COLORS: Record<string, string> = {
  created:     'bg-slate-100 text-slate-700',
  assigned:    'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed:   'bg-purple-100 text-purple-800',
  verified:    'bg-green-100 text-green-800',
  closed:      'bg-slate-100 text-slate-500',
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  high:     'bg-orange-100 text-orange-800',
  High:     'bg-orange-100 text-orange-800',
  Critical: 'bg-red-100 text-red-800',
  medium:   'bg-blue-100 text-blue-800',
  low:      'bg-slate-100 text-slate-700',
}

function StatusDot({ color }: { color: string }) {
  return <span className={`inline-block h-2 w-2 rounded-full mr-1.5 ${color}`} />
}

// ── KPI Tile ─────────────────────────────────────────────────────────────────

function KpiTile({
  label, value, icon, sub, color = ''
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  sub?: string
  color?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

function Resort360Page() {
  const [stats,   setStats]   = useState<ResortStatsResponse | null>(null)
  const [staff,   setStaff]   = useState<StaffMemberResponse[]>([])
  const [rooms,   setRooms]   = useState<RoomResponse[]>([])
  const [tasks,   setTasks]   = useState<TaskResponse[]>([])
  const [nextAction, setNextAction] = useState<RecommendationResponse | null>(null)
  const [systemicIssues, setSystemicIssues] = useState<SystemicIssueResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const loadAll = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [statsData, staffData, roomsData, tasksData, nextActionData, systemicIssuesData] = await Promise.all([
        api.getStats(),
        api.getStaff(),
        api.getRooms(),
        api.getTasks(),
        api.getNextAction(),
        api.getSystemicIssues().catch(e => {
          console.error("Systemic issues load error:", e);
          return { issues: [] };
        })
      ])
      setStats(statsData)
      setStaff(staffData)
      setRooms(roomsData)
      setTasks(tasksData)
      setNextAction(nextActionData)
      setSystemicIssues(systemicIssuesData)
      setLastRefresh(new Date())
    } catch (err: any) {
      setError(err.message || 'Failed to load resort data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // ── Derived data ─────────────────────────────────────────────────────────

  const roomCounts = rooms.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const occupancyPct = rooms.length > 0
    ? Math.round((roomCounts.occupied || 0) / rooms.length * 100)
    : 0

  // Active (non-closed) tasks sorted by priority
  const activeTasks = tasks
    .filter(t => t.status !== 'closed' && t.status !== 'verified')
    .sort((a, b) => {
      const pri: Record<string, number> = { critical: 0, Critical: 0, high: 1, High: 1, medium: 2, low: 3 }
      return (pri[a.priority ?? 'low'] ?? 3) - (pri[b.priority ?? 'low'] ?? 3)
    })
    .slice(0, 8)

  const unassignedTasks = tasks.filter(t => t.status === 'created')
  const highPriorityTasks = tasks.filter(
    t => ['high', 'High', 'critical', 'Critical'].includes(t.priority ?? '') && t.status !== 'closed'
  )

  // ── Intelligence alerts (rule-based, not LLM) ───────────────────────────
  const alerts: { level: 'warning' | 'info' | 'error'; message: string }[] = []

  if (unassignedTasks.length > 0) {
    alerts.push({
      level: 'error',
      message: `Action required: ${unassignedTasks.length} task(s) have no assigned staff.`,
    })
  }
  if (highPriorityTasks.length > 0) {
    alerts.push({
      level: 'warning',
      message: `Attention: ${highPriorityTasks.length} high-priority task(s) are currently active.`,
    })
  }
  const overloadedStaff = staff.filter(s => s.active_task_count >= 3)
  overloadedStaff.forEach(s => {
    alerts.push({
      level: 'warning',
      message: `Workload alert: ${s.name} currently has ${s.active_task_count} active tasks.`,
    })
  })
  const maintenanceRooms = rooms.filter(r => r.status === 'maintenance')
  if (maintenanceRooms.length > 0) {
    alerts.push({
      level: 'info',
      message: `Maintenance: ${maintenanceRooms.length} room(s) are currently unavailable (${maintenanceRooms.map(r => r.room_number).join(', ')}).`,
    })
  }
  const pendingVerification = tasks.filter(t => t.status === 'completed')
  if (pendingVerification.length > 0) {
    alerts.push({
      level: 'info',
      message: `${pendingVerification.length} task(s) are completed and awaiting manager verification.`,
    })
  }

  const alertColors = {
    error:   'border-l-red-500 bg-red-50/50',
    warning: 'border-l-orange-500 bg-orange-50/50',
    info:    'border-l-blue-500 bg-blue-50/50',
  }
  const alertIconColors = {
    error:   'text-red-500',
    warning: 'text-orange-500',
    info:    'text-blue-500',
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading && !stats) {
    return (
      <div className="p-6 min-h-screen">
        <p className="text-muted-foreground animate-pulse">Loading resort data…</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resort 360</h1>
          <p className="text-muted-foreground mt-1">
            Live operational overview for resort managers.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadAll}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      {error && (
        <div className="text-red-600 text-sm border border-red-200 rounded-md p-3 bg-red-50">
          {error}{' '}
          <button onClick={loadAll} className="underline ml-1">Retry</button>
        </div>
      )}

      {/* ── KPI Tiles ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KpiTile
          label="Active Tasks"
          value={stats?.tasks.active ?? '—'}
          icon={<Activity className="h-4 w-4" />}
          sub={`${stats?.tasks.total ?? 0} total tasks`}
        />
        <KpiTile
          label="Open Complaints"
          value={stats?.complaints.open ?? '—'}
          icon={<AlertTriangle className="h-4 w-4" />}
          sub={`${stats?.complaints.total ?? 0} total`}
        />
        <KpiTile
          label="High Priority"
          value={stats?.complaints.high_priority ?? '—'}
          icon={<AlertTriangle className="h-4 w-4" />}
          color={stats && stats.complaints.high_priority > 0 ? 'text-red-600' : ''}
          sub="active high-priority tasks"
        />
        <KpiTile
          label="Unassigned Tasks"
          value={stats?.assignments.unassigned ?? '—'}
          icon={<Clock className="h-4 w-4" />}
          color={stats && stats.assignments.unassigned > 0 ? 'text-orange-600' : ''}
          sub="awaiting staff assignment"
        />
        <KpiTile
          label="Occupancy"
          value={`${occupancyPct}%`}
          icon={<BedDouble className="h-4 w-4" />}
          color="text-blue-700"
          sub={`${roomCounts.occupied || 0} of ${rooms.length} rooms (demo)`}
        />
      </div>

      {/* ── Main Grid ──────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">

          {/* Next Best Action */}
          {nextAction && (
            <Card className="border-indigo-200 shadow-sm">
              <CardHeader className="pb-3 bg-indigo-50/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-indigo-700">
                    <Sparkles className="h-5 w-5" />
                    Next Best Action
                  </CardTitle>
                  <Badge variant="outline" className="bg-white text-xs">
                    {nextAction.source === 'ai' ? 'AI Recommendation' : 'Rule-based Fallback'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={PRIORITY_COLORS[nextAction.priority] || 'bg-slate-100'}>
                        {nextAction.priority} priority
                      </Badge>
                      <h3 className="text-lg font-bold">{nextAction.action}</h3>
                    </div>
                    <p className="text-sm font-medium text-slate-700 mt-2">Why:</p>
                    <p className="text-sm text-slate-600 mb-3">{nextAction.reason}</p>
                    
                    <p className="text-sm font-medium text-slate-700">Evidence:</p>
                    <ul className="text-sm text-slate-600 list-disc list-inside mt-1 space-y-1">
                      {nextAction.evidence.map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Room Overview */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BedDouble className="h-5 w-5 text-muted-foreground" />
                    Room Overview
                  </CardTitle>
                  <CardDescription>Current room statuses</CardDescription>
                </div>
                <div className="flex items-center text-xs text-muted-foreground gap-1 border rounded px-2 py-1 bg-blue-50 text-blue-700 border-blue-200">
                  <Info className="h-3 w-3" />
                  Demo / Seeded Data
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status summary row */}
              <div className="grid grid-cols-4 gap-3">
                {(['occupied', 'available', 'cleaning', 'maintenance'] as const).map(status => (
                  <div key={status} className="border rounded-md p-3 text-center">
                    <div className={`text-xl font-bold ${
                      status === 'occupied'    ? 'text-blue-700'   :
                      status === 'available'   ? 'text-green-700'  :
                      status === 'cleaning'    ? 'text-yellow-700' :
                                                 'text-red-700'
                    }`}>
                      {roomCounts[status] || 0}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize mt-0.5">{status}</div>
                  </div>
                ))}
              </div>

              {/* Room grid */}
              <div className="grid grid-cols-5 gap-1.5">
                {rooms.map(room => (
                  <div
                    key={room.id}
                    className={`rounded text-center py-1.5 px-1 text-xs font-medium border ${
                      room.status === 'occupied'    ? 'bg-blue-50 border-blue-200 text-blue-700' :
                      room.status === 'available'   ? 'bg-green-50 border-green-200 text-green-700' :
                      room.status === 'cleaning'    ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                                                      'bg-red-50 border-red-200 text-red-700'
                    }`}
                    title={`Room ${room.room_number} — ${room.room_type} — ${room.status}`}
                  >
                    <div className="font-bold">{room.room_number}</div>
                    <div className="text-[10px] opacity-80 capitalize">{room.status.slice(0,4)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Live Operations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
                Live Operations
              </CardTitle>
              <CardDescription>Active tasks sorted by priority</CardDescription>
            </CardHeader>
            <CardContent>
              {activeTasks.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  All tasks are closed or verified. Nothing active.
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2.5 text-left font-medium">ID</th>
                        <th className="p-2.5 text-left font-medium">Issue / Location</th>
                        <th className="p-2.5 text-left font-medium">Priority</th>
                        <th className="p-2.5 text-left font-medium">Status</th>
                        <th className="p-2.5 text-left font-medium">Assigned To</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTasks.map(task => {
                        const latestAssignment = task.assignments?.length
                          ? task.assignments[task.assignments.length - 1]
                          : null
                        return (
                          <tr key={task.id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="p-2.5 font-medium text-xs text-muted-foreground">TSK-{task.id}</td>
                            <td className="p-2.5">
                              <div className="font-medium">
                                {task.issue_type ?? 'Issue'} — {task.location ?? 'N/A'}
                              </div>
                              <div className="text-xs text-muted-foreground">{task.department ?? ''}</div>
                            </td>
                            <td className="p-2.5">
                              <Badge className={PRIORITY_COLORS[task.priority ?? 'low'] ?? 'bg-slate-100'}>
                                {task.priority ?? 'N/A'}
                              </Badge>
                            </td>
                            <td className="p-2.5">
                              <Badge className={TASK_STATUS_COLORS[task.status] ?? ''}>
                                {task.status.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="p-2.5">
                              <div className="flex items-center gap-1">
                                <UserCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{latestAssignment?.staff_name ?? 'Unassigned'}</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-3 flex justify-end">
                <Link to="/tasks">
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    View All Tasks <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">

          {/* Emerging Operational Patterns */}
          <Card className="border-orange-200 shadow-sm">
            <CardHeader className="pb-3 bg-orange-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="h-5 w-5" />
                  Emerging Operational Patterns
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {!systemicIssues || systemicIssues.issues.length === 0 ? (
                <div className="text-sm text-slate-500 italic text-center py-2">
                  No emerging operational patterns detected
                </div>
              ) : (
                systemicIssues.issues.map((issue, idx) => (
                  <div key={idx} className="border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={PRIORITY_COLORS[issue.severity] || 'bg-slate-100'}>
                          {issue.severity} priority
                        </Badge>
                        <h3 className="text-base font-bold">{issue.title}</h3>
                      </div>
                      <Badge variant="outline" className="bg-white text-[10px] uppercase">
                        {issue.source.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700 mb-2 font-medium">{issue.summary}</p>
                    <p className="text-xs font-semibold text-slate-500 mb-1">Evidence:</p>
                    <ul className="text-xs text-slate-600 list-disc list-inside">
                      {issue.evidence.map((point, pIdx) => (
                        <li key={pIdx}>{point}</li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Staff Snapshot */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                Staff Snapshot
              </CardTitle>
              <CardDescription>
                Live availability from database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {staff.length === 0 ? (
                <p className="text-sm text-muted-foreground">No staff data.</p>
              ) : (
                staff.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${s.available ? 'bg-green-500' : 'bg-orange-400'}`} />
                      <div>
                        <div className="text-sm font-medium leading-tight">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.department}</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <Badge
                        variant="outline"
                        className={s.available
                          ? 'bg-green-50 text-green-700 border-green-200 text-xs'
                          : 'bg-orange-50 text-orange-700 border-orange-200 text-xs'}
                      >
                        {s.available ? 'Available' : 'Busy'}
                      </Badge>
                      {s.active_task_count > 0 && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {s.active_task_count} task{s.active_task_count > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div className="mt-2 pt-2 border-t flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <StatusDot color="bg-green-500" />
                  {staff.filter(s => s.available).length} available
                </span>
                <span className="flex items-center gap-1">
                  <StatusDot color="bg-orange-400" />
                  {staff.filter(s => !s.available).length} busy
                </span>
              </div>
              <div className="flex justify-end">
                <Link to="/staff">
                  <Button variant="outline" size="sm" className="flex items-center gap-1 mt-1">
                    View Staff <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Operational Intelligence */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-indigo-500" />
                    Operational Intelligence
                  </CardTitle>
                  <CardDescription>
                    Rule-based alerts from live data
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Info className="h-3 w-3" />
                Data-driven rules — not LLM-generated
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {alerts.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-md p-3 border border-green-100">
                  <CheckCircle2 className="h-4 w-4" />
                  No active alerts. Operations look good.
                </div>
              ) : (
                alerts.map((alert, i) => (
                  <div
                    key={i}
                    className={`border-l-4 rounded-r-md p-3 text-sm ${alertColors[alert.level]}`}
                  >
                    <AlertTriangle className={`h-3.5 w-3.5 inline mr-1.5 ${alertIconColors[alert.level]}`} />
                    {alert.message}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Links to existing intelligence pages */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Further Intelligence</CardTitle>
              <CardDescription>Existing analytical views</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/insights" className="block">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4 text-indigo-500" />
                    View AI Insights
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/pricing" className="block">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <LineChart className="h-4 w-4 text-emerald-500" />
                    View Pricing Intelligence
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/audit" className="block">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-slate-500" />
                    View Audit Trail
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <Separator />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Info className="h-3 w-3 text-blue-400" />
          Room/occupancy data is seeded for demonstration purposes — not a live PMS system.
        </span>
        <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
      </div>

    </div>
  )
}
