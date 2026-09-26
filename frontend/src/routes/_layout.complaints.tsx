import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { mockComplaints, type Complaint, type ComplaintStatus, type Priority } from '@/data/mock-complaints'
import { BrainCircuit, Filter, X, SendHorizonal, Eye } from 'lucide-react'
import { useI18n } from '@/i18n'
import { toast } from 'sonner'

export const Route = createFileRoute('/_layout/complaints')({
  component: ComplaintsPage,
})

function priorityStyle(priority: Priority): React.CSSProperties {
  switch (priority) {
    case 'critical': return { background: 'var(--status-critical)', color: 'var(--status-critical-fg)', borderColor: 'var(--status-critical-border)' }
    case 'high':     return { background: 'var(--status-open)',     color: 'var(--status-open-fg)',     borderColor: 'var(--status-open-border)' }
    case 'medium':   return { background: 'var(--status-progress)', color: 'var(--status-progress-fg)', borderColor: 'var(--status-progress-border)' }
    case 'low':      return { background: 'var(--status-neutral)',  color: 'var(--status-neutral-fg)',  borderColor: 'var(--status-neutral-border)' }
    default:         return { background: 'var(--status-neutral)',  color: 'var(--status-neutral-fg)',  borderColor: 'var(--status-neutral-border)' }
  }
}

function statusStyle(status: ComplaintStatus): React.CSSProperties {
  switch (status) {
    case 'open':        return { background: 'var(--status-open)',     color: 'var(--status-open-fg)',     borderColor: 'var(--status-open-border)' }
    case 'in_progress': return { background: 'var(--status-progress)', color: 'var(--status-progress-fg)', borderColor: 'var(--status-progress-border)' }
    case 'resolved':    return { background: 'var(--status-success)',  color: 'var(--status-success-fg)',  borderColor: 'var(--status-success-border)' }
    case 'closed':      return { background: 'var(--status-neutral)',  color: 'var(--status-neutral-fg)',  borderColor: 'var(--status-neutral-border)' }
    default:            return { background: 'var(--status-neutral)',  color: 'var(--status-neutral-fg)',  borderColor: 'var(--status-neutral-border)' }
  }
}

/* ── Complaint detail dialog ─────────────────────────────────────────────── */
function ComplaintDetailDialog({
  complaint,
  onStatusChange,
  t,
}: {
  complaint: Complaint
  onStatusChange: (id: string, status: ComplaintStatus) => void
  t: (k: any) => string
}) {
  const [localStatus, setLocalStatus] = useState<ComplaintStatus>(complaint.status)

  // Reset local state whenever a different complaint is opened
  function handleOpenChange(open: boolean) {
    if (open) setLocalStatus(complaint.status)
  }

  const ALL_STATUSES: ComplaintStatus[] = ['open', 'in_progress', 'resolved', 'closed']

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant='ghost' size='sm' aria-label={`${t('action.view')} ${complaint.id}`}>
          <Eye className='size-3.5' aria-hidden='true' />
          {t('action.view')}
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.25rem' }}>
            {complaint.id}
          </DialogTitle>
          <DialogDescription style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}>
            {complaint.guestName ?? 'Unknown guest'} · Room {complaint.roomNumber ?? 'N/A'} ·{' '}
            {new Date(complaint.createdAt).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-1'>
          {/* Complaint text */}
          <div className='rounded-sm border p-4' style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
            <p className='text-[0.75rem] font-semibold tracking-widest uppercase text-muted-foreground mb-1'>
              Complaint
            </p>
            <p style={{ fontSize: '0.9375rem', lineHeight: '1.65' }}>"{complaint.text}"</p>
            <p className='text-muted-foreground mt-1' style={{ fontSize: '0.8125rem' }}>
              Language: {complaint.language}
            </p>
          </div>

          {/* Metadata grid */}
          <div className='grid grid-cols-2 gap-x-6 gap-y-3' style={{ fontSize: '0.9375rem' }}>
            <div>
              <p className='text-[0.75rem] font-semibold tracking-widest uppercase text-muted-foreground mb-0.5'>Category</p>
              <p>{complaint.category}{complaint.subcategory ? ` › ${complaint.subcategory}` : ''}</p>
            </div>
            <div>
              <p className='text-[0.75rem] font-semibold tracking-widest uppercase text-muted-foreground mb-0.5'>Priority</p>
              <Badge variant='outline' style={priorityStyle(complaint.priority)}>
                {complaint.priority}
              </Badge>
            </div>
            <div>
              <p className='text-[0.75rem] font-semibold tracking-widest uppercase text-muted-foreground mb-0.5'>Assigned To</p>
              <p>{complaint.assignedTo ?? 'Unassigned'}</p>
            </div>
            <div>
              <p className='text-[0.75rem] font-semibold tracking-widest uppercase text-muted-foreground mb-0.5'>Sentiment</p>
              <p className='capitalize'>{complaint.sentiment}</p>
            </div>
            <div>
              <p className='text-[0.75rem] font-semibold tracking-widest uppercase text-muted-foreground mb-0.5'>AI Confidence</p>
              <p>{Math.round(complaint.confidence * 100)}%</p>
            </div>
          </div>

          <Separator />

          {/* ── Status change ──────────────────────────── */}
          <div
            className='rounded-sm border p-4 space-y-3'
            style={{ background: 'var(--violet-surface)', borderColor: 'var(--violet-border)' }}
          >
            <p
              className='text-[0.75rem] font-semibold tracking-widest uppercase'
              style={{ color: 'var(--violet-deep)' }}
            >
              Update Status
            </p>
            <div className='flex items-center gap-3 flex-wrap'>
              {ALL_STATUSES.map(s => {
                const isSelected = localStatus === s
                return (
                  <button
                    key={s}
                    type='button'
                    onClick={() => { setLocalStatus(s) }}
                    aria-pressed={isSelected}
                    className='rounded-sm border px-3 py-1.5 transition-all duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    style={{
                      fontFamily: 'var(--font-cormorant)',
                      fontSize: '0.875rem',
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      ...(isSelected
                        ? { ...statusStyle(s), borderWidth: '2px' }
                        : { background: 'var(--background)', color: 'var(--muted-foreground)', borderColor: 'var(--border)' }),
                    }}
                  >
                    {t(`status.${s === 'in_progress' ? 'inProgress' : s}` as Parameters<typeof t>[0])}
                  </button>
                )
              })}
            </div>
            {localStatus !== complaint.status && (
              <p className='text-[0.8125rem]' style={{ color: 'var(--violet-fg)' }}>
                Changing from <strong>{complaint.status.replace('_', ' ')}</strong> → <strong>{localStatus.replace('_', ' ')}</strong>
              </p>
            )}
          </div>

          {/* AI explanation */}
          <div
            className='rounded-sm border p-3'
            style={{ background: 'var(--ai-surface)', borderColor: 'var(--ai-surface-border)', color: 'var(--ai-surface-fg)' }}
          >
            <p className='text-[0.75rem] font-semibold tracking-widest uppercase opacity-60 mb-1'>
              AI Explanation
            </p>
            <p style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>{complaint.explanation}</p>
          </div>
        </div>

        <DialogFooter className='gap-2'>
          <DialogClose asChild>
            <Button variant='outline' aria-label='Close without saving'>
              Cancel
            </Button>
          </DialogClose>
          {/* Save button — only enabled when status has changed */}
          <DialogClose asChild>
            <Button
              disabled={localStatus === complaint.status}
              onClick={(e) => {
                // Prevent DialogClose from firing if status unchanged
                if (localStatus === complaint.status) { e.preventDefault(); return }
                // We need to call handleSave but also let DialogClose fire —
                // so we call onStatusChange directly here and show the toast
                onStatusChange(complaint.id, localStatus)
                toast.success('Status updated', {
                  description: `${complaint.id} → ${localStatus.replace('_', ' ')}`,
                })
              }}
              style={localStatus !== complaint.status
                ? { background: 'var(--violet-deep)', color: 'oklch(1 0 0)' }
                : {}}
              aria-label='Save status change'
            >
              Save Status
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ── Main page ───────────────────────────────────────────────────────────── */
function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints)
  const [filterStatus,   setFilterStatus]   = useState<ComplaintStatus | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all')
  const { t } = useI18n()

  // Form state
  const [text,     setText]     = useState('')
  const [lang,     setLang]     = useState('english')
  const [room,     setRoom]     = useState('')
  const [guest,    setGuest]    = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [submitting, setSubmitting] = useState(false)

  const filtered = complaints.filter(c => {
    if (filterStatus   !== 'all' && c.status   !== filterStatus)   return false
    if (filterPriority !== 'all' && c.priority !== filterPriority) return false
    return true
  })

  const hasActiveFilter = filterStatus !== 'all' || filterPriority !== 'all'

  const clearFilters = () => {
    setFilterStatus('all')
    setFilterPriority('all')
  }

  // Update a complaint's status in the live list
  function handleStatusChange(id: string, newStatus: ComplaintStatus) {
    setComplaints(prev =>
      prev.map(c => c.id === id ? { ...c, status: newStatus } : c)
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) {
      toast.error('Complaint text is required.')
      return
    }
    setSubmitting(true)

    // Simulate brief processing delay then add to list
    setTimeout(() => {
      const newComplaint: Complaint = {
        id: `CMP-${Date.now().toString().slice(-6)}`,
        guestName:   guest.trim() || undefined,
        roomNumber:  room.trim()  || undefined,
        text:        text.trim(),
        language:    lang.charAt(0).toUpperCase() + lang.slice(1),
        category:    'Pending',
        subcategory: undefined,
        priority,
        status:      'open',
        assignedTo:  undefined,
        sentiment:   'negative',
        confidence:  0.0,
        explanation: 'Awaiting AI classification.',
        createdAt:   new Date().toISOString(),
      }
      setComplaints(prev => [newComplaint, ...prev])
      setText('')
      setRoom('')
      setGuest('')
      setPriority('medium')
      setLang('english')
      setSubmitting(false)
      toast.success('Complaint submitted', {
        description: `${newComplaint.id} — assigned priority: ${priority}`,
      })
    }, 600)
  }

  return (
    <div className='px-8 py-8 space-y-8 min-h-screen'>

      {/* ── Page header ───────────────────────────────── */}
      <div>
        <h1 className='text-[2rem] font-semibold tracking-tight leading-tight'>{t('complaints.title')}</h1>
        <p className='mt-1 text-muted-foreground' style={{ fontSize: '0.9375rem' }}>{t('complaints.subtitle')}</p>
      </div>

      <div className='grid gap-6 md:grid-cols-12'>

        {/* ── Left: Submit form + AI card ───────────────── */}
        <div className='md:col-span-4 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='text-[1.0625rem]'>{t('complaints.submitTitle')}</CardTitle>
              <CardDescription>{t('complaints.submitDesc')}</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className='space-y-4'>
                <div className='space-y-1.5'>
                  <label htmlFor='complaint-text' className='text-[0.9375rem] font-medium'>
                    {t('complaints.textLabel')}
                  </label>
                  <Textarea
                    id='complaint-text'
                    placeholder={t('complaints.textPlaceholder')}
                    className='min-h-[100px] rounded-sm text-[0.9375rem] resize-none'
                    value={text}
                    onChange={e => setText(e.target.value)}
                    required
                    aria-required='true'
                  />
                </div>
                <div className='space-y-1.5'>
                  <label htmlFor='complaint-lang' className='text-[0.9375rem] font-medium'>
                    {t('complaints.languageLabel')}
                  </label>
                  <Select value={lang} onValueChange={setLang}>
                    <SelectTrigger id='complaint-lang' className='rounded-sm'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['English', 'Hindi', 'Marathi', 'Tamil', 'Hinglish'].map(l => (
                        <SelectItem key={l} value={l.toLowerCase()}
                          style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='grid grid-cols-2 gap-3'>
                  <div className='space-y-1.5'>
                    <label htmlFor='complaint-room' className='text-[0.9375rem] font-medium'>
                      {t('complaints.roomLabel')}
                    </label>
                    <Input
                      id='complaint-room'
                      placeholder={t('complaints.roomPlaceholder')}
                      value={room}
                      onChange={e => setRoom(e.target.value)}
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <label htmlFor='complaint-guest' className='text-[0.9375rem] font-medium'>
                      {t('complaints.guestLabel')}
                    </label>
                    <Input
                      id='complaint-guest'
                      placeholder={t('complaints.guestPlaceholder')}
                      value={guest}
                      onChange={e => setGuest(e.target.value)}
                    />
                  </div>
                </div>
                <div className='space-y-1.5'>
                  <label htmlFor='complaint-priority' className='text-[0.9375rem] font-medium'>
                    {t('complaints.priorityLabel')}
                  </label>
                  <Select value={priority} onValueChange={v => setPriority(v as Priority)}>
                    <SelectTrigger id='complaint-priority' className='rounded-sm'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['low', 'medium', 'high', 'critical'] as Priority[]).map(p => (
                        <SelectItem key={p} value={p}
                          style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}>
                          {t(`priority.${p}` as Parameters<typeof t>[0])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className='border-t pt-4'>
                <Button
                  type='submit'
                  className='w-full gap-2'
                  disabled={submitting}
                  aria-label={t('complaints.submitButton')}
                >
                  <SendHorizonal className='size-4' aria-hidden='true' />
                  {submitting ? 'Submitting…' : t('complaints.submitButton')}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* AI Classification card */}
          <Card style={{ background: 'var(--ai-surface)', borderColor: 'var(--ai-surface-border)' }}>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2 text-[1rem]' style={{ color: 'var(--ai-surface-fg)' }}>
                <BrainCircuit className='size-4 opacity-70' aria-hidden='true' />
                {t('complaints.aiTitle')}
              </CardTitle>
              <CardDescription style={{ color: 'var(--ai-surface-fg)', opacity: 0.7 }}>
                {t('complaints.aiDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3' style={{ color: 'var(--ai-surface-fg)' }}>
              <div className='grid grid-cols-2 gap-x-4 gap-y-3'>
                {[
                  [t('label.category'), 'Maintenance'],
                  [t('complaints.subcategory'), 'Plumbing'],
                  [t('complaints.requiredSkill'), 'Plumbing'],
                  [t('complaints.confidence'), '95%'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className='text-[0.75rem] font-semibold tracking-wide uppercase opacity-60 mb-0.5'>{label}</div>
                    <div className='font-medium' style={{ fontSize: '0.9375rem' }}>{value}</div>
                  </div>
                ))}
                <div>
                  <div className='text-[0.75rem] font-semibold tracking-wide uppercase opacity-60 mb-0.5'>{t('label.priority')}</div>
                  <Badge variant='outline' style={priorityStyle('medium')}>{t('priority.medium')}</Badge>
                </div>
                <div>
                  <div className='text-[0.75rem] font-semibold tracking-wide uppercase opacity-60 mb-0.5'>{t('complaints.sentiment')}</div>
                  <Badge variant='outline' style={{ background: 'var(--status-critical)', color: 'var(--status-critical-fg)', borderColor: 'var(--status-critical-border)' }}>
                    Negative
                  </Badge>
                </div>
              </div>
              <div className='pt-3 border-t' style={{ borderColor: 'var(--ai-surface-border)' }}>
                <div className='text-[0.75rem] font-semibold tracking-wide uppercase opacity-60 mb-1'>
                  {t('complaints.explanation')}
                </div>
                <p style={{ fontSize: '0.875rem', lineHeight: '1.6', opacity: 0.85 }}>
                  User mentioned "pani tapak raha hai" which translates to water leaking.
                  This falls under Maintenance › Plumbing.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Complaint list with filters ───────── */}
        <div className='md:col-span-8'>
          <Card>
            <CardHeader className='flex flex-row items-start justify-between pb-3 gap-4 flex-wrap'>
              <div>
                <CardTitle className='text-[1.0625rem]'>{t('complaints.listTitle')}</CardTitle>
                <CardDescription>
                  {t('complaints.listDesc')} · {filtered.length} shown
                </CardDescription>
              </div>
              {/* Filter controls */}
              <div className='flex items-center gap-2 flex-wrap'>
                <Select value={filterStatus} onValueChange={v => setFilterStatus(v as ComplaintStatus | 'all')}>
                  <SelectTrigger className='h-8 rounded-sm text-sm w-auto gap-1.5' aria-label={t('complaints.filterByStatus')}>
                    <Filter className='size-3.5 opacity-60' aria-hidden='true' />
                    <SelectValue placeholder={t('label.status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all' style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}>{t('label.all')}</SelectItem>
                    {(['open', 'in_progress', 'resolved', 'closed'] as ComplaintStatus[]).map(s => (
                      <SelectItem key={s} value={s} style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}>
                        {t(`status.${s === 'in_progress' ? 'inProgress' : s}` as Parameters<typeof t>[0])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterPriority} onValueChange={v => setFilterPriority(v as Priority | 'all')}>
                  <SelectTrigger className='h-8 rounded-sm text-sm w-auto gap-1.5' aria-label={t('complaints.filterByPriority')}>
                    <SelectValue placeholder={t('label.priority')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all' style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}>{t('label.all')}</SelectItem>
                    {(['low', 'medium', 'high', 'critical'] as Priority[]).map(p => (
                      <SelectItem key={p} value={p} style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}>
                        {t(`priority.${p}` as Parameters<typeof t>[0])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasActiveFilter && (
                  <Button
                    variant='ghost' size='sm'
                    className='h-8 px-2 text-muted-foreground hover:text-foreground'
                    onClick={clearFilters}
                    aria-label={t('action.clearFilters')}
                  >
                    <X className='size-3.5' aria-hidden='true' />
                    <span className='sr-only'>{t('action.clearFilters')}</span>
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {/* Active filter chips */}
              {hasActiveFilter && (
                <div className='flex gap-2 mb-3 flex-wrap'>
                  {filterStatus !== 'all' && (
                    <Badge variant='outline' className='gap-1 text-[0.8125rem]'
                      style={{ background: 'var(--violet-surface)', color: 'var(--violet-deep)', borderColor: 'var(--violet-border)' }}>
                      {t('label.status')}: {t(`status.${filterStatus === 'in_progress' ? 'inProgress' : filterStatus}` as Parameters<typeof t>[0])}
                      <button onClick={() => setFilterStatus('all')} className='ml-0.5 hover:opacity-70' aria-label='Remove status filter'>
                        <X className='size-3' />
                      </button>
                    </Badge>
                  )}
                  {filterPriority !== 'all' && (
                    <Badge variant='outline' className='gap-1 text-[0.8125rem]'
                      style={{ background: 'var(--violet-surface)', color: 'var(--violet-deep)', borderColor: 'var(--violet-border)' }}>
                      {t('label.priority')}: {t(`priority.${filterPriority}` as Parameters<typeof t>[0])}
                      <button onClick={() => setFilterPriority('all')} className='ml-0.5 hover:opacity-70' aria-label='Remove priority filter'>
                        <X className='size-3' />
                      </button>
                    </Badge>
                  )}
                </div>
              )}

              <div className='rounded-sm border overflow-x-auto'>
                <table className='w-full' style={{ fontSize: '0.9375rem' }}>
                  <thead>
                    <tr className='border-b bg-muted/40'>
                      {[t('label.id'), 'Guest / Room', t('label.complaint'), t('label.category'),
                        t('label.priority'), t('label.status'), t('label.assignedTo'), t('label.actions')
                      ].map(h => (
                        <th key={h} className='px-4 py-2.5 text-left text-[0.75rem] font-semibold tracking-widest uppercase text-muted-foreground whitespace-nowrap'>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className='px-4 py-10 text-center text-muted-foreground' style={{ fontSize: '0.9375rem' }}>
                          <p>{t('empty.noResults')}</p>
                          <button
                            onClick={clearFilters}
                            className='mt-1 underline underline-offset-2 text-foreground hover:opacity-70 transition-opacity'
                            style={{ fontSize: '0.875rem' }}
                          >
                            {t('empty.clearFilters')}
                          </button>
                        </td>
                      </tr>
                    ) : filtered.map(c => (
                      <tr key={c.id} className='border-b last:border-0 hover:bg-muted/30 transition-colors'>
                        <td className='px-4 py-3 font-semibold' style={{ fontSize: '0.875rem' }}>{c.id}</td>
                        <td className='px-4 py-3'>
                          <div className='font-medium'>{c.guestName ?? 'Unknown'}</div>
                          <div className='text-muted-foreground' style={{ fontSize: '0.8125rem' }}>
                            Rm {c.roomNumber ?? 'N/A'}
                          </div>
                        </td>
                        <td className='px-4 py-3 max-w-[180px]'>
                          <div className='truncate' title={c.text}>{c.text}</div>
                          <div className='text-muted-foreground' style={{ fontSize: '0.8125rem' }}>{c.language}</div>
                        </td>
                        <td className='px-4 py-3'>
                          <div>{c.category}</div>
                          {c.subcategory && (
                            <div className='text-muted-foreground' style={{ fontSize: '0.8125rem' }}>{c.subcategory}</div>
                          )}
                        </td>
                        <td className='px-4 py-3'>
                          <Badge variant='outline' style={priorityStyle(c.priority)}>
                            {t(`priority.${c.priority}` as Parameters<typeof t>[0])}
                          </Badge>
                        </td>
                        <td className='px-4 py-3'>
                          <Badge variant='outline' style={statusStyle(c.status)}>
                            {t(`status.${c.status === 'in_progress' ? 'inProgress' : c.status}` as Parameters<typeof t>[0])}
                          </Badge>
                        </td>
                        <td className='px-4 py-3 text-muted-foreground'>
                          {c.assignedTo ?? t('complaints.unassigned')}
                        </td>
                        <td className='px-4 py-3'>
                          <ComplaintDetailDialog complaint={c} onStatusChange={handleStatusChange} t={t} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
