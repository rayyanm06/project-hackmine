import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BrainCircuit, Clock, User, FileCode } from 'lucide-react'
import { useI18n } from '@/i18n'

export const Route = createFileRoute('/_layout/audit')({
  component: AuditPage,
})

function AuditEntry({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  description,
  time,
  children,
}: {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  title: string
  description: React.ReactNode
  time: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className='p-6'>
        <div className='flex justify-between items-start gap-4'>
          <div className='flex gap-4'>
            {/* Icon container */}
            <div
              className='mt-0.5 size-9 rounded-sm border flex items-center justify-center shrink-0'
              style={{ background: iconBg, borderColor: 'var(--border)' }}
            >
              <Icon className='size-4' style={{ color: iconColor }} />
            </div>

            <div className='min-w-0'>
              <h3 className='text-[1.0625rem] font-semibold tracking-tight'>{title}</h3>
              <p className='mt-1 text-muted-foreground' style={{ fontSize: '0.9375rem', lineHeight: '1.6' }}>
                {description}
              </p>
              <div className='mt-4'>{children}</div>
            </div>
          </div>

          <div
            className='flex items-center gap-1.5 text-muted-foreground shrink-0'
            style={{ fontSize: '0.8125rem' }}
          >
            <Clock className='size-3.5' />
            {time}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ReasoningGrid({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return (
    <div
      className='p-4 rounded-sm border space-y-2'
      style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}
    >
      <div className='flex items-center gap-2 font-semibold pb-2 border-b border-border/60' style={{ fontSize: '0.875rem' }}>
        <FileCode className='size-3.5 text-muted-foreground' />
        Reasoning Log
      </div>
      <div className='grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5' style={{ fontSize: '0.9375rem' }}>
        {rows.map(([label, value]) => (
          <>
            <div key={`l-${label}`} className='text-muted-foreground whitespace-nowrap'>{label}</div>
            <div key={`v-${label}`}>{value}</div>
          </>
        ))}
      </div>
    </div>
  )
}

function AuditPage() {
  const { t } = useI18n()
  return (
    <div className='px-8 py-8 space-y-8 min-h-screen'>

      {/* ── Page header ───────────────────────────────── */}
      <div>
        <h1 className='text-[2rem] font-semibold tracking-tight leading-tight'>{t('audit.title')}</h1>
        <p className='mt-1 text-muted-foreground' style={{ fontSize: '0.9375rem' }}>
          {t('audit.subtitle')}
        </p>
      </div>

      <div className='space-y-4'>

        <AuditEntry
          icon={BrainCircuit}
          iconBg='var(--ai-surface)'
          iconColor='var(--ai-surface-fg)'
          title={t('audit.aiAssignment')}
          description={
            <>
              {t('audit.aiAssignmentDesc')}{' '}
              <span className='font-medium text-foreground'>TSK-1021 (AC Not Cooling)</span>
              {' '}to{' '}
              <span className='font-medium text-foreground'>Rahul Sharma</span>.
            </>
          }
          time={t('audit.justNow')}
        >
          <ReasoningGrid
            rows={[
              [t('audit.selectedStaff'), 'Rahul Sharma'],
              [t('audit.totalScore'), <Badge key='score' variant='outline' style={{ background: 'var(--status-success)', color: 'var(--status-success-fg)', borderColor: 'var(--status-success-border)' }}>92 / 100</Badge>],
              [t('audit.skillMatch'), '35/35 (Required skill present)'],
              [t('audit.workloadDetail'), '18/25 (1 open task)'],
              [t('audit.availabilityDetail'), '20/20 (Currently Available)'],
              [t('audit.rejectedAlt'), 'Arjun Patil (Score 65 – Lacks Skill), Priya Nair (Score 0 – On Leave)'],
            ]}
          />
        </AuditEntry>

        <AuditEntry
          icon={User}
          iconBg='var(--muted)'
          iconColor='var(--muted-foreground)'
          title={t('audit.classified')}
          description={t('audit.classifiedDesc')}
          time={t('audit.minsAgo')}
        >
          <div
            className='p-4 rounded-sm border'
            style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}
          >
            <div className='flex items-center gap-2 font-semibold pb-2 border-b border-border/60 mb-3' style={{ fontSize: '0.875rem' }}>
              <FileCode className='size-3.5 text-muted-foreground' aria-hidden='true' />
              {t('audit.llmOutput')}
            </div>
            <pre
              className='rounded-sm border p-3 overflow-x-auto'
              style={{
                fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
                fontSize: '0.8125rem',
                lineHeight: '1.7',
                background: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
              }}
            >
{`{
  "issue_type": "AC",
  "department": "Maintenance",
  "priority": "high",
  "location": "room_204",
  "required_skill": "AC Repair",
  "confidence": 0.98
}`}
            </pre>
          </div>
        </AuditEntry>

      </div>
    </div>
  )
}
