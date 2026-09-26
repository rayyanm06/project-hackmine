import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { mockTasks, type TaskStatus } from '@/data/mock-tasks'
import { Filter, UserCircle2, X } from 'lucide-react'
import { useI18n } from '@/i18n'

export const Route = createFileRoute('/_layout/tasks')({
  component: TasksPage,
})

function statusStyle(status: TaskStatus): React.CSSProperties {
  switch (status) {
    case 'Created':     return { background: 'var(--status-neutral)',  color: 'var(--status-neutral-fg)',   borderColor: 'var(--status-neutral-border)' }
    case 'Assigned':    return { background: 'var(--status-progress)', color: 'var(--status-progress-fg)',  borderColor: 'var(--status-progress-border)' }
    case 'In Progress': return { background: 'var(--status-open)',     color: 'var(--status-open-fg)',      borderColor: 'var(--status-open-border)' }
    case 'Completed':   return { background: 'var(--status-success)',  color: 'var(--status-success-fg)',   borderColor: 'var(--status-success-border)' }
    case 'Verified':    return { background: 'var(--status-success)',  color: 'var(--status-success-fg)',   borderColor: 'var(--status-success-border)' }
    case 'Closed':      return { background: 'var(--status-neutral)',  color: 'var(--status-neutral-fg)',   borderColor: 'var(--status-neutral-border)' }
    default:            return { background: 'var(--status-neutral)',  color: 'var(--status-neutral-fg)',   borderColor: 'var(--status-neutral-border)' }
  }
}

function priorityStyle(priority: string): React.CSSProperties {
  switch (priority) {
    case 'critical': return { background: 'var(--status-critical)', color: 'var(--status-critical-fg)', borderColor: 'var(--status-critical-border)' }
    case 'high':     return { background: 'var(--status-open)',     color: 'var(--status-open-fg)',     borderColor: 'var(--status-open-border)' }
    case 'medium':   return { background: 'var(--status-progress)', color: 'var(--status-progress-fg)', borderColor: 'var(--status-progress-border)' }
    case 'low':      return { background: 'var(--status-neutral)',  color: 'var(--status-neutral-fg)',  borderColor: 'var(--status-neutral-border)' }
    default:         return { background: 'var(--status-neutral)',  color: 'var(--status-neutral-fg)',  borderColor: 'var(--status-neutral-border)' }
  }
}

function SLAIndicator({ sla, t }: { sla: string; t: (k: any) => string }) {
  const configs: Record<string, { color: string; key: string }> = {
    on_track: { color: 'var(--status-success-fg)',  key: 'status.onTrack' },
    at_risk:  { color: 'var(--status-open-fg)',     key: 'status.atRisk' },
    breached: { color: 'var(--status-critical-fg)', key: 'status.breached' },
  }
  const cfg = configs[sla]
  if (!cfg) return null
  return (
    <span className='flex items-center gap-1.5' style={{ fontSize: '0.875rem', color: cfg.color }}>
      <span className='size-2 rounded-full shrink-0' style={{ background: cfg.color }} aria-hidden='true' />
      {t(cfg.key)}
    </span>
  )
}

const ALL_STATUSES: TaskStatus[] = ['Created', 'Assigned', 'In Progress', 'Completed', 'Verified', 'Closed']
const ALL_PRIORITIES = ['low', 'medium', 'high', 'critical']
const ALL_SLA = ['on_track', 'at_risk', 'breached']

function TasksPage() {
  const { t } = useI18n()
  const [filterStatus,   setFilterStatus]   = useState<TaskStatus | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterSLA,      setFilterSLA]      = useState<string>('all')

  const filtered = mockTasks.filter(task => {
    if (filterStatus   !== 'all' && task.status    !== filterStatus)   return false
    if (filterPriority !== 'all' && task.priority  !== filterPriority) return false
    if (filterSLA      !== 'all' && task.slaStatus !== filterSLA)      return false
    return true
  })

  const hasActive = filterStatus !== 'all' || filterPriority !== 'all' || filterSLA !== 'all'

  const clearAll = () => {
    setFilterStatus('all')
    setFilterPriority('all')
    setFilterSLA('all')
  }

  const statusLabel = (s: TaskStatus) => {
    const map: Record<TaskStatus, string> = {
      'Created': t('status.created'), 'Assigned': t('status.assigned'),
      'In Progress': t('status.inProgress'), 'Completed': t('status.completed'),
      'Verified': t('status.verified'), 'Closed': t('status.closed'),
    }
    return map[s] ?? s
  }

  return (
    <div className='px-8 py-8 space-y-8 min-h-screen'>

      {/* ── Page header ───────────────────────────────── */}
      <div>
        <h1 className='text-[2rem] font-semibold tracking-tight leading-tight'>{t('tasks.title')}</h1>
        <p className='mt-1 text-muted-foreground' style={{ fontSize: '0.9375rem' }}>{t('tasks.subtitle')}</p>
      </div>

      <Card>
        <CardHeader className='flex flex-row items-start justify-between gap-4 flex-wrap pb-3'>
          <div>
            <CardTitle className='text-[1.0625rem]'>{t('tasks.queueTitle')}</CardTitle>
            <CardDescription>{t('tasks.queueDesc')}</CardDescription>
          </div>

          {/* Live filter controls */}
          <div className='flex items-center gap-2 flex-wrap'>
            <Filter className='size-4 text-muted-foreground/60' aria-hidden='true' />

            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as TaskStatus | 'all')}>
              <SelectTrigger className='h-8 rounded-sm text-sm w-auto' aria-label={t('tasks.filterByStatus')}>
                <SelectValue placeholder={t('label.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all' style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}>{t('label.all')}</SelectItem>
                {ALL_STATUSES.map(s => (
                  <SelectItem key={s} value={s} style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}>{statusLabel(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className='h-8 rounded-sm text-sm w-auto' aria-label={t('tasks.filterByPriority')}>
                <SelectValue placeholder={t('label.priority')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all' style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}>{t('label.all')}</SelectItem>
                {ALL_PRIORITIES.map(p => (
                  <SelectItem key={p} value={p} style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}>
                    {t(`priority.${p}` as Parameters<typeof t>[0])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterSLA} onValueChange={setFilterSLA}>
              <SelectTrigger className='h-8 rounded-sm text-sm w-auto' aria-label={t('tasks.filterBySLA')}>
                <SelectValue placeholder={t('label.sla')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all' style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}>{t('label.all')}</SelectItem>
                {ALL_SLA.map(s => (
                  <SelectItem key={s} value={s} style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}>
                    {t(`status.${s === 'on_track' ? 'onTrack' : s === 'at_risk' ? 'atRisk' : 'breached'}` as Parameters<typeof t>[0])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActive && (
              <Button variant='ghost' size='sm' className='h-8 px-2' onClick={clearAll} aria-label={t('action.clearFilters')}>
                <X className='size-3.5' />
                <span className='sr-only'>{t('action.clearFilters')}</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Active filter chips */}
          {hasActive && (
            <div className='flex gap-2 mb-3 flex-wrap'>
              {filterStatus !== 'all' && (
                <Badge variant='outline' className='gap-1 text-[0.8125rem]'
                  style={{ background: 'var(--violet-surface)', color: 'var(--violet-deep)', borderColor: 'var(--violet-border)' }}>
                  {t('label.status')}: {statusLabel(filterStatus as TaskStatus)}
                  <button onClick={() => setFilterStatus('all')} className='ml-0.5 hover:opacity-70' aria-label='Remove status filter'><X className='size-3' /></button>
                </Badge>
              )}
              {filterPriority !== 'all' && (
                <Badge variant='outline' className='gap-1 text-[0.8125rem]'
                  style={{ background: 'var(--violet-surface)', color: 'var(--violet-deep)', borderColor: 'var(--violet-border)' }}>
                  {t('label.priority')}: {t(`priority.${filterPriority}` as Parameters<typeof t>[0])}
                  <button onClick={() => setFilterPriority('all')} className='ml-0.5 hover:opacity-70' aria-label='Remove priority filter'><X className='size-3' /></button>
                </Badge>
              )}
              {filterSLA !== 'all' && (
                <Badge variant='outline' className='gap-1 text-[0.8125rem]'
                  style={{ background: 'var(--violet-surface)', color: 'var(--violet-deep)', borderColor: 'var(--violet-border)' }}>
                  SLA: {t(`status.${filterSLA === 'on_track' ? 'onTrack' : filterSLA === 'at_risk' ? 'atRisk' : 'breached'}` as Parameters<typeof t>[0])}
                  <button onClick={() => setFilterSLA('all')} className='ml-0.5 hover:opacity-70' aria-label='Remove SLA filter'><X className='size-3' /></button>
                </Badge>
              )}
            </div>
          )}

          <div className='rounded-sm border overflow-x-auto'>
            <table className='w-full' style={{ fontSize: '0.9375rem' }}>
              <thead>
                <tr className='border-b bg-muted/40'>
                  {[t('label.taskId'), 'Title / Complaint', t('label.assignedTo'), t('label.priority'), t('label.status'), t('label.sla'), t('label.actions')].map(h => (
                    <th key={h} className='px-4 py-2.5 text-left text-[0.75rem] font-semibold tracking-widest uppercase text-muted-foreground whitespace-nowrap'>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className='px-4 py-10 text-center text-muted-foreground' style={{ fontSize: '0.9375rem' }}>
                      <p>{t('empty.noResults')}</p>
                      <button onClick={clearAll} className='mt-1 underline underline-offset-2 text-foreground hover:opacity-70 transition-opacity' style={{ fontSize: '0.875rem' }}>
                        {t('empty.clearFilters')}
                      </button>
                    </td>
                  </tr>
                ) : filtered.map((task) => (
                  <tr key={task.id} className='border-b last:border-0 hover:bg-muted/30 transition-colors'>
                    <td className='px-4 py-3.5 font-semibold' style={{ fontSize: '0.875rem' }}>{task.id}</td>
                    <td className='px-4 py-3.5'>
                      <div className='font-medium'>{task.title}</div>
                      <div className='text-muted-foreground' style={{ fontSize: '0.8125rem' }}>{t('tasks.ref')}: {task.complaintId || 'N/A'}</div>
                    </td>
                    <td className='px-4 py-3.5'>
                      <div className='flex items-center gap-2'>
                        <UserCircle2 className='size-4 text-muted-foreground/60 shrink-0' aria-hidden='true' />
                        <div>
                          <div>{task.assignedTo}</div>
                          <div className='text-muted-foreground' style={{ fontSize: '0.8125rem' }}>{t('label.skill')}: {task.skill}</div>
                        </div>
                      </div>
                    </td>
                    <td className='px-4 py-3.5'>
                      <Badge variant='outline' style={priorityStyle(task.priority)}>
                        {t(`priority.${task.priority}` as Parameters<typeof t>[0])}
                      </Badge>
                    </td>
                    <td className='px-4 py-3.5'>
                      <Badge variant='outline' style={statusStyle(task.status)}>{statusLabel(task.status)}</Badge>
                    </td>
                    <td className='px-4 py-3.5'>
                      <SLAIndicator sla={task.slaStatus} t={t} />
                    </td>
                    <td className='px-4 py-3.5'>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant='outline' size='sm' aria-label={`${t('action.details')} ${task.id}`}>{t('action.details')}</Button>
                        </DialogTrigger>
                        <DialogContent className='max-w-2xl'>
                          <DialogHeader>
                            <DialogTitle style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.25rem' }}>
                              {task.id} — {task.title}
                            </DialogTitle>
                            <DialogDescription style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}>
                              Created on {new Date(task.createdAt).toLocaleString()}
                            </DialogDescription>
                          </DialogHeader>
                          <div className='grid grid-cols-2 gap-4 mt-4'>
                            <div className='space-y-4'>
                              <div className='border rounded-sm p-4 space-y-2'>
                                <h4 className='font-semibold text-[0.875rem] pb-2 border-b'>{t('tasks.complaintInfo')}</h4>
                                <div style={{ fontSize: '0.9375rem' }}><span className='text-muted-foreground'>{t('tasks.ref')}: </span>{task.complaintId}</div>
                                <div style={{ fontSize: '0.9375rem' }}><span className='text-muted-foreground'>{t('tasks.skillRequired')}: </span>{task.skill}</div>
                              </div>
                              <div className='border rounded-sm p-4 space-y-2'>
                                <h4 className='font-semibold text-[0.875rem] pb-2 border-b'>{t('tasks.assignmentDetails')}</h4>
                                <div style={{ fontSize: '0.9375rem' }}><span className='text-muted-foreground'>{t('label.assignedTo')}: </span>{task.assignedTo}</div>
                                <div className='flex items-center gap-2' style={{ fontSize: '0.9375rem' }}>
                                  <span className='text-muted-foreground'>{t('tasks.aiMatchScore')}: </span>
                                  <Badge variant='outline' style={{ background: 'var(--status-success)', color: 'var(--status-success-fg)', borderColor: 'var(--status-success-border)' }}>
                                    {task.assignmentScore}/100
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className='space-y-4'>
                              <div className='border rounded-sm p-4 space-y-2'>
                                <h4 className='font-semibold text-[0.875rem] pb-2 border-b'>{t('tasks.statusSLA')}</h4>
                                <div className='flex items-center gap-2' style={{ fontSize: '0.9375rem' }}>
                                  <span className='text-muted-foreground'>{t('label.status')}: </span>
                                  <Badge variant='outline' style={statusStyle(task.status)}>{statusLabel(task.status)}</Badge>
                                </div>
                                <div style={{ fontSize: '0.9375rem' }}><span className='text-muted-foreground'>{t('tasks.dueAt')}: </span>{new Date(task.dueAt).toLocaleTimeString()}</div>
                                <SLAIndicator sla={task.slaStatus} t={t} />
                              </div>
                              <div className='border rounded-sm p-4 space-y-2'>
                                <h4 className='font-semibold text-[0.875rem] pb-2 border-b'>{t('tasks.completionVerification')}</h4>
                                {task.completionNotes ? (
                                  <div style={{ fontSize: '0.9375rem' }}>
                                    <p className='italic text-muted-foreground'>"{task.completionNotes}"</p>
                                    <div className='mt-2 h-20 bg-muted rounded-sm flex items-center justify-center text-muted-foreground text-[0.8125rem] border border-dashed'>
                                      {t('tasks.photoProof')}
                                    </div>
                                  </div>
                                ) : (
                                  <div className='italic text-muted-foreground' style={{ fontSize: '0.9375rem' }}>{t('tasks.notCompleted')}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
