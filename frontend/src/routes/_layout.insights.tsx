import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BrainCircuit, TrendingUp, AlertTriangle, Users, Target, Activity } from 'lucide-react'
import { useI18n } from '@/i18n'

export const Route = createFileRoute('/_layout/insights')({
  component: InsightsPage,
})

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className='flex items-center gap-2.5 mb-5'>
      <Icon className='size-4 text-muted-foreground/70 shrink-0' aria-hidden='true' />
      <h2 className='text-[1.375rem] font-semibold tracking-tight'>{title}</h2>
      <div className='flex-1 h-px bg-border ml-2' aria-hidden='true' />
    </div>
  )
}

function InsightsPage() {
  const { t } = useI18n()

  return (
    <div className='px-8 py-8 space-y-10 min-h-screen'>

      {/* ── Page header ───────────────────────────────── */}
      <div>
        <h1 className='text-[2rem] font-semibold tracking-tight leading-tight'>{t('insights.title')}</h1>
        <p className='mt-1 flex items-center gap-1.5 text-muted-foreground' style={{ fontSize: '0.9375rem' }}>
          <BrainCircuit className='size-4 shrink-0' aria-hidden='true' />
          <span>
            <span className='font-semibold'>{t('insights.simulatedData')}</span>{' '}
            {t('insights.subtitle')}
          </span>
        </p>
      </div>

      {/* ── Operations & Staffing ─────────────────────── */}
      <section aria-labelledby='section-operations'>
        <SectionHeader icon={Activity} title={t('insights.operations')} />
        {/* 1 col → 2 col → 4 col responsive grid */}
        <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-4'>

          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-[0.8125rem] font-semibold tracking-widest uppercase text-muted-foreground'>
                {t('insights.slaRisk')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-[2rem] font-semibold leading-none tracking-tight'>12%</div>
              <div className='flex items-center gap-1 mt-1.5' style={{ fontSize: '0.875rem', color: 'var(--status-critical-fg)' }}>
                <TrendingUp className='size-3.5' aria-hidden='true' /> {t('insights.vsYesterday')}
              </div>
              <p className='mt-2 text-muted-foreground' style={{ fontSize: '0.875rem', lineHeight: '1.55' }}>
                Plumbing tasks in South Wing are experiencing delays due to staff shortage.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-[0.8125rem] font-semibold tracking-widest uppercase text-muted-foreground'>
                {t('insights.workloadImbalance')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-[1.5rem] font-semibold leading-none tracking-tight' style={{ color: 'var(--status-open-fg)' }}>
                Moderate
              </div>
              <p className='mt-2 text-muted-foreground' style={{ fontSize: '0.875rem', lineHeight: '1.55' }}>
                Housekeeping is overutilised (85%), Maintenance is underutilised (40%).
              </p>
            </CardContent>
          </Card>

          {/* AI card — spans 2 cols on lg, full width on mobile/tablet */}
          <Card
            className='sm:col-span-2'
            style={{ background: 'var(--ai-surface)', borderColor: 'var(--ai-surface-border)' }}
          >
            <CardHeader className='pb-2'>
              <CardTitle
                className='text-[0.9375rem] font-semibold flex items-center gap-2'
                style={{ color: 'var(--ai-surface-fg)' }}
              >
                <BrainCircuit className='size-4 opacity-70' aria-hidden='true' />
                {t('insights.aiStaffing')}
              </CardTitle>
            </CardHeader>
            <CardContent style={{ color: 'var(--ai-surface-fg)' }}>
              <p style={{ fontSize: '0.9375rem', lineHeight: '1.65' }}>
                Based on historical trends, you will need{' '}
                <strong>2 additional housekeeping staff</strong> between 10:00 AM and 2:00 PM
                tomorrow due to a high volume of check-outs (15 rooms).
              </p>
              <div className='mt-3 flex flex-wrap gap-2'>
                <Badge variant='outline' style={{ background: 'var(--background)', color: 'var(--ai-surface-fg)', borderColor: 'var(--ai-surface-border)', fontSize: '0.8125rem' }}>
                  {t('insights.confidence')}: 94%
                </Badge>
                <Badge variant='outline' style={{ background: 'var(--background)', color: 'var(--ai-surface-fg)', borderColor: 'var(--ai-surface-border)', fontSize: '0.8125rem' }}>
                  {t('insights.actionable')}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Guest Experience ──────────────────────────── */}
      <section aria-labelledby='section-guest'>
        <SectionHeader icon={Users} title={t('insights.guestExp')} />
        {/* 1 col → stacked on mobile, 3-col on md+ */}
        <div className='grid gap-5 md:grid-cols-3'>

          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-[0.8125rem] font-semibold tracking-widest uppercase text-muted-foreground'>
                {t('insights.sentimentScore')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-[2.25rem] font-semibold leading-none tracking-tight' style={{ color: 'var(--status-success-fg)' }}>
                4.2 / 5
              </div>
              <div className='flex items-center gap-1 mt-1.5' style={{ fontSize: '0.875rem', color: 'var(--status-success-fg)' }}>
                <TrendingUp className='size-3.5' aria-hidden='true' /> {t('insights.stable')}
              </div>
            </CardContent>
          </Card>

          {/* Spans 2 cols on md+, full width on mobile */}
          <Card className='md:col-span-2'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-[0.8125rem] font-semibold tracking-widest uppercase text-muted-foreground'>
                {t('insights.complaintTrend')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-start gap-3'>
                <AlertTriangle className='size-5 shrink-0 mt-0.5' style={{ color: 'var(--status-open-fg)' }} aria-hidden='true' />
                <div>
                  <h4 className='text-[1.0625rem] font-semibold tracking-tight'>
                    AC Cooling Issues in North Wing
                  </h4>
                  <p className='mt-1.5 text-muted-foreground' style={{ fontSize: '0.9375rem', lineHeight: '1.6' }}>
                    NLP analysis of the last 48 hours shows a 40% spike in complaints regarding
                    "AC not cooling" specifically in the North Wing (Rooms 200–220).
                  </p>
                  <p className='mt-2 font-semibold' style={{ fontSize: '0.9375rem', color: 'var(--ai-surface-fg)' }}>
                    Recommendation: Schedule preventative maintenance for North Wing HVAC system.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Revenue & Market ──────────────────────────── */}
      <section aria-labelledby='section-revenue'>
        <SectionHeader icon={Target} title={t('insights.revenue')} />
        <div className='grid gap-5 md:grid-cols-2'>

          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-[0.8125rem] font-semibold tracking-widest uppercase text-muted-foreground'>
                {t('insights.forecastedOcc')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-[2.5rem] font-semibold leading-none tracking-tight'>88%</div>
              <div className='mt-1.5 text-muted-foreground' style={{ fontSize: '0.875rem' }}>
                {t('insights.nextWeekend')}
              </div>
              <div
                className='mt-4 p-3 rounded-sm border'
                style={{ background: 'var(--muted)', borderColor: 'var(--border)', fontSize: '0.9375rem', lineHeight: '1.55' }}
              >
                Pacing 12% ahead of same time last year. Market average is currently at 82%.
              </div>
            </CardContent>
          </Card>

          <Card style={{ background: 'var(--ai-surface)', borderColor: 'var(--ai-surface-border)' }}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-[0.9375rem] font-semibold flex items-center gap-2' style={{ color: 'var(--ai-surface-fg)' }}>
                <BrainCircuit className='size-4 opacity-70' aria-hidden='true' />
                {t('insights.pricingOpp')}
              </CardTitle>
            </CardHeader>
            <CardContent style={{ color: 'var(--ai-surface-fg)' }}>
              <p style={{ fontSize: '0.9375rem', lineHeight: '1.65' }}>
                Competitor "Beach Paradise" has sold out their Family Suites.
              </p>
              <div
                className='mt-3 p-3 border rounded-sm'
                style={{ background: 'var(--background)', borderColor: 'var(--ai-surface-border)' }}
              >
                <p className='font-semibold' style={{ fontSize: '0.9375rem', color: 'var(--ai-surface-fg)', lineHeight: '1.55' }}>
                  Increase Family Suite rate by 15% (₹1,200) for the upcoming weekend.
                  Estimated revenue impact: +₹14,400.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
