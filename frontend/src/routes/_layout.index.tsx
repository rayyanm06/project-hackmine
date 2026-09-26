import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckSquare, Clock, AlertTriangle, BrainCircuit,
  LineChart, Download, ArrowRight,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { toast } from 'sonner'
import { mockTasks } from '@/data/mock-tasks'
import { mockStaff } from '@/data/mock-staff'

export const Route = createFileRoute('/_layout/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { t } = useI18n()
  const navigate = useNavigate()

  // Derive live counts from mock data
  const openTasks     = mockTasks.filter(t => t.status !== 'Closed' && t.status !== 'Verified').length
  const highPriority  = mockTasks.filter(t => t.priority === 'high' || t.priority === 'critical').length
  const availableStaff = mockStaff.filter(s => s.availability === 'available').length
  const busyStaff      = mockStaff.filter(s => s.availability === 'busy').length
  const onLeaveStaff   = mockStaff.filter(s => s.availability === 'on_leave').length

  function handleDownload() {
    toast.success('Report ready', {
      description: `Dashboard summary: ${openTasks} open tasks, ${highPriority} high priority, ${availableStaff} staff available.`,
    })
  }

  function statusStyle(key: string): React.CSSProperties {
    const map: Record<string, React.CSSProperties> = {
      'status.inProgress': { background: 'var(--status-open)',     color: 'var(--status-open-fg)',     borderColor: 'var(--status-open-border)' },
      'status.assigned':   { background: 'var(--status-progress)', color: 'var(--status-progress-fg)', borderColor: 'var(--status-progress-border)' },
      'status.completed':  { background: 'var(--status-success)',  color: 'var(--status-success-fg)',  borderColor: 'var(--status-success-border)' },
    }
    return map[key] ?? {}
  }

  return (
    <div className='px-8 py-8 space-y-8 min-h-screen'>

      {/* ── Page header ───────────────────────────────── */}
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h1 className='text-[2rem] font-semibold tracking-tight leading-tight'>
            {t('dashboard.title')}
          </h1>
          <p className='text-muted-foreground mt-1' style={{ fontSize: '0.9375rem' }}>
            {t('dashboard.subtitle')}
          </p>
        </div>
        <Button
          variant='outline' size='sm'
          className='shrink-0 mt-1 gap-2'
          onClick={handleDownload}
          aria-label={t('action.download')}
        >
          <Download className='size-4' aria-hidden='true' />
          {t('action.download')}
        </Button>
      </div>

      {/* ── KPI row ───────────────────────────────────── */}
      <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-4'>
        {[
          {
            label: t('dashboard.openTasks'),
            value: String(openTasks),
            sub: `${openTasks} active right now`,
            icon: CheckSquare, iconClass: 'text-muted-foreground/60',
            onClick: () => navigate({ to: '/tasks' }),
          },
          {
            label: t('dashboard.highPriority'),
            value: String(highPriority),
            sub: t('dashboard.attentionRequired'),
            icon: AlertTriangle, iconClass: 'text-destructive/70',
            onClick: () => navigate({ to: '/tasks' }),
          },
          {
            label: t('dashboard.avgAssign'),
            value: '1.2m',
            sub: t('dashboard.lastWeekUp'),
            icon: Clock, iconClass: 'text-muted-foreground/60',
            onClick: undefined,
          },
          {
            label: t('dashboard.avgComplete'),
            value: '34m',
            sub: t('dashboard.lastWeekDown'),
            icon: Clock, iconClass: 'text-muted-foreground/60',
            onClick: undefined,
          },
        ].map(({ label, value, sub, icon: Icon, iconClass, onClick }) => (
          <Card
            key={label}
            className={onClick ? 'cursor-pointer hover:border-[var(--violet-border)] transition-colors' : ''}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
            aria-label={onClick ? `${label} — click to view tasks` : undefined}
          >
            <CardHeader className='flex flex-row items-center justify-between pb-3'>
              <CardTitle className='text-[0.8125rem] font-semibold tracking-widest uppercase text-muted-foreground'>
                {label}
              </CardTitle>
              <Icon className={`size-4 shrink-0 ${iconClass}`} aria-hidden='true' />
            </CardHeader>
            <CardContent>
              <div className='text-[2.25rem] font-semibold leading-none tracking-tight'>{value}</div>
              <p className='mt-1.5 text-[0.875rem] text-muted-foreground'>{sub}</p>
              {onClick && (
                <p className='mt-2 flex items-center gap-1 text-[0.8125rem]' style={{ color: 'var(--violet-deep)' }}>
                  View Tasks <ArrowRight className='size-3' aria-hidden='true' />
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main content grid ─────────────────────────── */}
      <div className='grid gap-5 lg:grid-cols-7'>

        {/* Live task table */}
        <Card className='lg:col-span-4'>
          <CardHeader className='flex flex-row items-center justify-between pb-3'>
            <div>
              <CardTitle className='text-[1.0625rem]'>{t('dashboard.liveTaskTable')}</CardTitle>
              <CardDescription>{t('dashboard.liveTaskDesc')}</CardDescription>
            </div>
            <Button
              variant='ghost' size='sm'
              onClick={() => navigate({ to: '/tasks' })}
              className='text-muted-foreground hover:text-foreground gap-1'
              aria-label='View all tasks'
            >
              All tasks <ArrowRight className='size-3.5' aria-hidden='true' />
            </Button>
          </CardHeader>
          <CardContent>
            <div className='rounded-sm border overflow-x-auto'>
              <table className='w-full' style={{ fontSize: '0.9375rem' }}>
                <thead>
                  <tr className='border-b bg-muted/40'>
                    {[t('label.taskId'), t('label.issue'), t('label.room'), t('label.assignedTo'), t('label.status')].map(h => (
                      <th key={h} className='px-4 py-2.5 text-left text-[0.75rem] font-semibold tracking-widest uppercase text-muted-foreground whitespace-nowrap'>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockTasks.map(task => (
                    <tr
                      key={task.id}
                      className='border-b last:border-0 hover:bg-[var(--violet-surface)] transition-colors cursor-pointer group'
                      onClick={() => navigate({ to: '/tasks' })}
                      role='button'
                      tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate({ to: '/tasks' }) }}
                      aria-label={`View task ${task.id}`}
                    >
                      <td className='px-4 py-3 font-medium'>{task.id}</td>
                      <td className='px-4 py-3'>{task.title}</td>
                      <td className='px-4 py-3 text-muted-foreground'>
                        {task.complaintId?.replace('CMP-2023-00', '') ?? '—'}
                      </td>
                      <td className='px-4 py-3'>{task.assignedTo}</td>
                      <td className='px-4 py-3'>
                        <Badge variant='outline'
                          style={statusStyle(
                            task.status === 'In Progress' ? 'status.inProgress'
                              : task.status === 'Assigned' ? 'status.assigned'
                              : task.status === 'Completed' ? 'status.completed'
                              : 'status.assigned'
                          )}>
                          {t(
                            task.status === 'In Progress' ? 'status.inProgress'
                              : task.status === 'Assigned' ? 'status.assigned'
                              : task.status === 'Completed' ? 'status.completed'
                              : 'status.assigned'
                          )}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Right column */}
        <div className='lg:col-span-3 space-y-5'>

          {/* AI Assignment Insight */}
          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-3'>
              <div>
                <CardTitle className='text-[1.0625rem]'>{t('dashboard.aiInsight')}</CardTitle>
                <CardDescription>{t('dashboard.aiInsightDesc')}</CardDescription>
              </div>
              <BrainCircuit className='size-4 text-muted-foreground/60 shrink-0' aria-hidden='true' />
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='flex justify-between items-center' style={{ fontSize: '0.9375rem' }}>
                  <span className='text-muted-foreground'>{t('label.assignedTo')}</span>
                  <span className='font-semibold'>Rahul Sharma</span>
                </div>
                <div className='flex justify-between items-center' style={{ fontSize: '0.9375rem' }}>
                  <span className='text-muted-foreground'>{t('dashboard.matchScore')}</span>
                  <Badge variant='outline' style={{ background: 'var(--status-success)', color: 'var(--status-success-fg)', borderColor: 'var(--status-success-border)' }}>
                    92 / 100
                  </Badge>
                </div>
                <div className='pt-3 border-t space-y-2'>
                  {[
                    [t('dashboard.skillMatch'), '35/35'],
                    [t('dashboard.availability'), '20/20'],
                    [t('dashboard.workload'), '18/25'],
                    ['Priority', '15/15'],
                    [t('dashboard.recency'), '4/5'],
                  ].map(([label, value]) => (
                    <div key={label} className='flex justify-between' style={{ fontSize: '0.875rem' }}>
                      <span className='text-muted-foreground'>{label}</span>
                      <span className='font-medium'>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                variant='ghost' size='sm'
                className='mt-4 w-full text-muted-foreground hover:text-foreground gap-1'
                onClick={() => navigate({ to: '/audit' })}
                aria-label='View full audit trail'
              >
                View audit trail <ArrowRight className='size-3.5' aria-hidden='true' />
              </Button>
            </CardContent>
          </Card>

          {/* Pricing Intelligence */}
          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-3'>
              <div>
                <CardTitle className='text-[1.0625rem]'>{t('dashboard.pricingIntel')}</CardTitle>
                <CardDescription>{t('dashboard.pricingDesc')}</CardDescription>
              </div>
              <LineChart className='size-4 text-muted-foreground/60 shrink-0' aria-hidden='true' />
            </CardHeader>
            <CardContent>
              <div className='space-y-2' style={{ fontSize: '0.9375rem' }}>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Munnar Valley Resort</span>
                  <span className='font-medium'>₹4,200/night</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Market Average</span>
                  <span className='font-medium'>₹4,800/night</span>
                </div>
                <div className='mt-3 p-3 rounded-sm border'
                  style={{ background: 'var(--ai-surface)', borderColor: 'var(--ai-surface-border)', color: 'var(--ai-surface-fg)' }}>
                  <span className='font-semibold block mb-1' style={{ fontSize: '0.875rem' }}>
                    {t('dashboard.aiSuggestion')}
                  </span>
                  <span style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                    Consider raising Deluxe AC rates by ₹400 for the upcoming weekend.
                    Competitor availability is low.
                  </span>
                </div>
              </div>
              <Button
                variant='ghost' size='sm'
                className='mt-4 w-full text-muted-foreground hover:text-foreground gap-1'
                onClick={() => navigate({ to: '/pricing' })}
                aria-label='View pricing intelligence'
              >
                View pricing <ArrowRight className='size-3.5' aria-hidden='true' />
              </Button>
            </CardContent>
          </Card>

          {/* Staffing Snapshot */}
          <Card>
            <CardHeader className='pb-3 flex flex-row items-center justify-between'>
              <CardTitle className='text-[1.0625rem]'>{t('dashboard.staffSnapshot')}</CardTitle>
              <Button
                variant='ghost' size='sm'
                className='text-muted-foreground hover:text-foreground gap-1 -mr-2'
                onClick={() => navigate({ to: '/staff' })}
                aria-label='View all staff'
              >
                View <ArrowRight className='size-3.5' aria-hidden='true' />
              </Button>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-3 divide-x divide-border'>
                {[
                  { label: t('dashboard.available'), value: String(availableStaff), color: 'var(--status-success-fg)' },
                  { label: t('dashboard.busy'),      value: String(busyStaff),      color: 'var(--status-open-fg)' },
                  { label: t('dashboard.onLeave'),   value: String(onLeaveStaff),   color: 'var(--muted-foreground)' },
                ].map(({ label, value, color }) => (
                  <div key={label} className='flex flex-col items-center py-1'>
                    <div className='text-[1.875rem] font-semibold leading-none tracking-tight' style={{ color }}>
                      {value}
                    </div>
                    <div className='mt-1.5 text-[0.8125rem] text-muted-foreground'>{label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
