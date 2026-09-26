import { useState, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { mockTasks, type Task } from '@/data/mock-tasks'
import { CheckCircle2, XCircle, Clock, Camera, PartyPopper } from 'lucide-react'
import { useI18n } from '@/i18n'
import { toast } from 'sonner'

export const Route = createFileRoute('/_layout/verification')({
  component: VerificationPage,
})

/* ── Individual verification card ───────────────────────────────────────── */
function VerificationCard({
  task,
  onVerify,
  onReject,
  t,
}: {
  task: Task
  onVerify: (id: string) => void
  onReject: (id: string, reason: string) => void
  t: (k: any) => string
}) {
  const [rejectReason, setRejectReason] = useState('')
  const [rejectError,  setRejectError]  = useState('')
  const closeRef = useRef<HTMLButtonElement>(null)

  function handleReject() {
    if (!rejectReason.trim()) {
      setRejectError('Please provide a reason before confirming rejection.')
      return
    }
    onReject(task.id, rejectReason)
    closeRef.current?.click()
    setRejectReason('')
    setRejectError('')
  }

  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex justify-between items-start flex-wrap gap-2'>
          <Badge
            variant='outline'
            style={{
              background: 'var(--status-progress)',
              color: 'var(--status-progress-fg)',
              borderColor: 'var(--status-progress-border)',
            }}
          >
            {t('verification.pending')}
          </Badge>
          <span className='text-muted-foreground' style={{ fontSize: '0.8125rem' }}>{task.id}</span>
        </div>
        <CardTitle className='text-[1.0625rem] mt-2'>{task.title}</CardTitle>
        <CardDescription>{t('label.assignedTo')}: {task.assignedTo}</CardDescription>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Completion notes */}
        <div className='rounded-sm border p-3 space-y-1.5'
          style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
          <div className='font-semibold text-[0.8125rem] tracking-wide uppercase text-muted-foreground pb-1 border-b border-border/60'>
            {t('verification.completionNotes')}
          </div>
          <p className='italic text-muted-foreground' style={{ fontSize: '0.9375rem', lineHeight: '1.6' }}>
            "{task.completionNotes || t('verification.noNotes')}"
          </p>
        </div>

        {/* Photo placeholder */}
        <div
          className='border-2 border-dashed rounded-sm h-28 flex flex-col items-center justify-center text-muted-foreground/50 bg-muted/30'
          aria-label={t('verification.photoEvidence')}
        >
          <Camera className='size-5 mb-1.5' aria-hidden='true' />
          <span style={{ fontSize: '0.8125rem' }}>{t('verification.photoEvidence')}</span>
        </div>

        {/* Timestamp */}
        <div className='flex items-center gap-1.5 text-muted-foreground' style={{ fontSize: '0.8125rem' }}>
          <Clock className='size-3.5' aria-hidden='true' />
          {t('verification.completedAgo')}
        </div>
      </CardContent>

      <CardFooter className='flex gap-2 border-t pt-4'>
        {/* Verify — removes the card with a toast */}
        <Button
          className='flex-1 gap-1.5'
          style={{ background: 'var(--status-success-fg)', color: 'white' }}
          onClick={() => onVerify(task.id)}
          aria-label={`${t('action.verify')} — ${task.id}`}
        >
          <CheckCircle2 className='size-4' aria-hidden='true' />
          {t('action.verify')}
        </Button>

        {/* Reject — opens dialog, requires reason, then removes card */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant='outline'
              className='flex-1 gap-1.5'
              style={{ color: 'var(--status-critical-fg)', borderColor: 'var(--status-critical-border)' }}
              aria-label={`${t('action.reject')} — ${task.id}`}
            >
              <XCircle className='size-4' aria-hidden='true' />
              {t('action.reject')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.25rem' }}>
                {t('verification.rejectTitle')}: {task.id}
              </DialogTitle>
              <DialogDescription style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}>
                Send this task back to <strong>{task.assignedTo}</strong> for rework.
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-2 py-2'>
              <label
                htmlFor={`reject-reason-${task.id}`}
                className='font-medium'
                style={{ fontSize: '0.9375rem' }}
              >
                {t('verification.rejectReason')}
              </label>
              <Textarea
                id={`reject-reason-${task.id}`}
                placeholder={t('verification.rejectPlaceholder')}
                className='rounded-sm text-[0.9375rem] resize-none'
                value={rejectReason}
                onChange={e => { setRejectReason(e.target.value); setRejectError('') }}
                aria-describedby={rejectError ? `reject-err-${task.id}` : undefined}
                aria-invalid={!!rejectError}
              />
              {rejectError && (
                <p id={`reject-err-${task.id}`} className='text-destructive' style={{ fontSize: '0.8125rem' }}>
                  {rejectError}
                </p>
              )}
            </div>

            <DialogFooter className='gap-2'>
              {/* DialogClose so Cancel actually closes without submission */}
              <DialogClose asChild>
                <Button
                  ref={closeRef}
                  variant='outline'
                  onClick={() => { setRejectReason(''); setRejectError('') }}
                >
                  {t('action.cancel')}
                </Button>
              </DialogClose>
              <Button
                variant='destructive'
                onClick={handleReject}
                aria-label={`Confirm rejection of ${task.id}`}
              >
                {t('action.confirmRejection')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}

/* ── Page ────────────────────────────────────────────────────────────────── */
function VerificationPage() {
  const { t } = useI18n()

  // Start with tasks that have status Completed — live state so Verify/Reject remove them
  const [queue, setQueue] = useState<Task[]>(
    mockTasks.filter(t => t.status === 'Completed'),
  )

  function handleVerify(id: string) {
    const task = queue.find(t => t.id === id)
    setQueue(prev => prev.filter(t => t.id !== id))
    toast.success(`${id} verified`, {
      description: `${task?.title} marked as verified successfully.`,
    })
  }

  function handleReject(id: string, reason: string) {
    const task = queue.find(t => t.id === id)
    setQueue(prev => prev.filter(t => t.id !== id))
    toast.warning(`${id} sent back for rework`, {
      description: `${task?.assignedTo}: "${reason}"`,
    })
  }

  return (
    <div className='px-8 py-8 space-y-8 min-h-screen'>
      <div>
        <h1 className='text-[2rem] font-semibold tracking-tight leading-tight'>
          {t('verification.title')}
        </h1>
        <p className='mt-1 text-muted-foreground' style={{ fontSize: '0.9375rem' }}>
          {t('verification.subtitle')}
        </p>
      </div>

      {/* Live count */}
      {queue.length > 0 && (
        <p className='text-muted-foreground' style={{ fontSize: '0.9375rem' }}>
          {queue.length} task{queue.length !== 1 ? 's' : ''} awaiting verification
        </p>
      )}

      <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
        {queue.length === 0 ? (
          <div className='col-span-full py-16 text-center border rounded-sm border-dashed bg-muted/30' role='status'>
            <PartyPopper className='size-10 text-muted-foreground/40 mx-auto mb-3' aria-hidden='true' />
            <p className='font-semibold' style={{ fontSize: '1.0625rem' }}>
              {t('verification.allClear')}
            </p>
            <p className='text-muted-foreground mt-1' style={{ fontSize: '0.875rem' }}>
              All completed tasks have been reviewed.
            </p>
          </div>
        ) : (
          queue.map(task => (
            <VerificationCard
              key={task.id}
              task={task}
              onVerify={handleVerify}
              onReject={handleReject}
              t={t}
            />
          ))
        )}
      </div>
    </div>
  )
}
