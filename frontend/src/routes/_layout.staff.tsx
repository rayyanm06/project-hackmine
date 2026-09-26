import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { mockStaff, type Staff } from '@/data/mock-staff'
import { User, Wrench, CheckCircle } from 'lucide-react'
import { useI18n } from '@/i18n'
import { toast } from 'sonner'

export const Route = createFileRoute('/_layout/staff')({
  component: StaffPage,
})

function availabilityStyle(avail: Staff['availability']): React.CSSProperties {
  switch (avail) {
    case 'available': return { background: 'var(--status-success)', color: 'var(--status-success-fg)', borderColor: 'var(--status-success-border)' }
    case 'busy':      return { background: 'var(--status-open)',    color: 'var(--status-open-fg)',    borderColor: 'var(--status-open-border)' }
    case 'on_leave':  return { background: 'var(--status-neutral)', color: 'var(--status-neutral-fg)', borderColor: 'var(--status-neutral-border)' }
  }
}

function workloadColor(pct: number): string {
  if (pct >= 85) return 'var(--status-critical-fg)'
  if (pct >= 60) return 'var(--status-open-fg)'
  return 'var(--status-success-fg)'
}

/* ── Staff card ──────────────────────────────────────────────────────────── */
function StaffCard({ member, t }: { member: Staff; t: (k: any) => string }) {
  // Local availability state — toggle is live within the page
  const [availability, setAvailability] = useState<Staff['availability']>(member.availability)

  const isForced = availability === 'available' && member.availability !== 'available'

  function handleForceAvailable(checked: boolean) {
    const next = checked ? 'available' : member.availability
    setAvailability(next)
    toast.success(
      checked
        ? `${member.name} marked available`
        : `${member.name} reverted to ${member.availability.replace('_', ' ')}`,
    )
  }

  return (
    <Card>
      <CardHeader className='pb-3 flex flex-row items-start justify-between'>
        <div className='flex gap-3'>
          <div className='h-10 w-10 bg-muted rounded-sm border border-border flex items-center justify-center shrink-0'>
            <User className='size-4 text-muted-foreground' aria-hidden='true' />
          </div>
          <div>
            <CardTitle className='text-[1.0625rem]'>{member.name}</CardTitle>
            <CardDescription>{member.role}</CardDescription>
          </div>
        </div>
        <Badge variant='outline' style={availabilityStyle(availability)}>
          {availability.replace('_', ' ')}
        </Badge>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Skills */}
        <div className='space-y-1.5'>
          <div className='flex items-center gap-1.5 text-muted-foreground' style={{ fontSize: '0.8125rem' }}>
            <Wrench className='size-3' aria-hidden='true' /> {t('staff.skills')}
          </div>
          <div className='flex flex-wrap gap-1'>
            {member.skills.map(skill => (
              <Badge
                key={skill}
                variant='outline'
                className='text-[0.75rem]'
                style={{ background: 'var(--sage-surface)', color: 'var(--sage-deep)', borderColor: 'var(--sage-border)' }}
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Workload bar */}
        <div className='space-y-1.5 pt-3 border-t'>
          <div className='flex justify-between' style={{ fontSize: '0.875rem' }}>
            <span className='text-muted-foreground'>{t('staff.workload')}</span>
            <span className='font-semibold' style={{ color: workloadColor(member.currentWorkload) }}>
              {member.currentWorkload}%
            </span>
          </div>
          <div className='h-1.5 w-full bg-muted rounded-full overflow-hidden' role='progressbar'
            aria-valuenow={member.currentWorkload} aria-valuemin={0} aria-valuemax={100}
            aria-label={`${member.name} workload`}>
            <div
              className='h-full rounded-full transition-all duration-300'
              style={{ width: `${member.currentWorkload}%`, background: workloadColor(member.currentWorkload) }}
            />
          </div>
        </div>

        {/* Task counts */}
        <div className='grid grid-cols-2 gap-2 pt-1'>
          <div className='bg-muted/50 border border-border rounded-sm p-3 text-center'>
            <div className='text-[0.75rem] font-semibold tracking-wide uppercase text-muted-foreground mb-0.5'>
              {t('staff.active')}
            </div>
            <div className='text-[1.5rem] font-semibold leading-none'>{member.activeTasks}</div>
          </div>
          <div className='bg-muted/50 border border-border rounded-sm p-3 text-center'>
            <div className='flex items-center justify-center gap-1 text-[0.75rem] font-semibold tracking-wide uppercase text-muted-foreground mb-0.5'>
              <CheckCircle className='size-3' aria-hidden='true' /> {t('staff.done')}
            </div>
            <div className='text-[1.5rem] font-semibold leading-none'>{member.completedTasks}</div>
          </div>
        </div>

        {/* Force Available toggle */}
        <div className='pt-3 border-t flex justify-between items-center gap-3'>
          <div>
            <span className='font-medium' style={{ fontSize: '0.9375rem' }}>
              {t('staff.forceAvailable')}
            </span>
            {isForced && (
              <span className='ml-2 text-[0.75rem]' style={{ color: 'var(--status-success-fg)' }}>
                (override active)
              </span>
            )}
          </div>
          <Switch
            checked={availability === 'available'}
            onCheckedChange={handleForceAvailable}
            aria-label={`${t('staff.forceAvailable')} — ${member.name}`}
          />
        </div>
      </CardContent>
    </Card>
  )
}

/* ── Page ────────────────────────────────────────────────────────────────── */
function StaffPage() {
  const { t } = useI18n()

  return (
    <div className='px-8 py-8 space-y-8 min-h-screen'>
      <div>
        <h1 className='text-[2rem] font-semibold tracking-tight leading-tight'>{t('staff.title')}</h1>
        <p className='mt-1 text-muted-foreground' style={{ fontSize: '0.9375rem' }}>
          {t('staff.subtitle')}
        </p>
      </div>

      <div className='grid gap-5 md:grid-cols-2 lg:grid-cols-3'>
        {mockStaff.map(s => (
          <StaffCard key={s.id} member={s} t={t} />
        ))}
      </div>
    </div>
  )
}
