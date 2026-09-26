import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Info, LineChart } from 'lucide-react'
import { useI18n } from '@/i18n'
import { toast } from 'sonner'

export const Route = createFileRoute('/_layout/pricing')({
  component: PricingPage,
})

type RoomPricing = {
  name: string
  yourRate: string
  badge: string
  badgePositive: boolean | null  // true = good, false = bad, null = neutral
  competitors: Array<{ name: string; rate: string }>
  avg: string
  occupancy: string
  seasonality: string
  recommendation: {
    icon: 'up' | 'down' | 'hold'
    title: string
    body: string
    reasoning: string
  }
  actionLabel: string
  actionDisabled: boolean
}

const rooms: RoomPricing[] = [
  {
    name: 'AC Deluxe Room',
    yourRate: '₹3,500',
    badge: '12% below avg',
    badgePositive: false,
    competitors: [
      { name: 'Goa Palm Retreat', rate: '₹4,200' },
      { name: 'Oceanview Lodge', rate: '₹3,800' },
      { name: 'Beach Paradise', rate: '₹5,200' },
    ],
    avg: '₹4,400',
    occupancy: '85% (High)',
    seasonality: 'Pre-Diwali Peak',
    recommendation: {
      icon: 'up',
      title: 'Consider Raising Rate',
      body: 'Consider increasing your rate to ₹3,900 – ₹4,200.',
      reasoning: 'You are priced 20% below the top competitor while maintaining high (85%) occupancy ahead of a high-demand festival weekend.',
    },
    actionLabel: 'Apply Suggested Rate',
    actionDisabled: false,
  },
  {
    name: 'Standard Non-AC',
    yourRate: '₹2,500',
    badge: 'Optimised',
    badgePositive: true,
    competitors: [
      { name: 'Goa Palm Retreat', rate: '₹2,400' },
      { name: 'Oceanview Lodge', rate: '₹2,600' },
      { name: 'Beach Paradise', rate: '₹2,800' },
    ],
    avg: '₹2,600',
    occupancy: '65% (Normal)',
    seasonality: 'Pre-Diwali Peak',
    recommendation: {
      icon: 'hold',
      title: 'Hold Current Rate',
      body: 'Hold current rate.',
      reasoning: 'You are perfectly aligned with the market average. Occupancy is stable.',
    },
    actionLabel: 'Rate is Optimal',
    actionDisabled: true,
  },
  {
    name: 'Family Suite',
    yourRate: '₹8,500',
    badge: '15% above avg',
    badgePositive: false,
    competitors: [
      { name: 'Goa Palm Retreat', rate: '₹7,200' },
      { name: 'Oceanview Lodge', rate: '₹6,800' },
      { name: 'Beach Paradise', rate: '₹8,000' },
    ],
    avg: '₹7,333',
    occupancy: '40% (Low)',
    seasonality: 'Pre-Diwali Peak',
    recommendation: {
      icon: 'down',
      title: 'Consider Lowering Rate',
      body: 'Consider dropping your rate to ₹7,500 – ₹7,800.',
      reasoning: 'Low occupancy (40%) and pricing above the highest competitor is leading to abandoned bookings.',
    },
    actionLabel: 'Apply Suggested Rate',
    actionDisabled: false,
  },
]

function RecommendationBlock({ rec }: { rec: RoomPricing['recommendation'] }) {
  const icon = rec.icon === 'up'
    ? <TrendingUp className='size-4' />
    : rec.icon === 'down'
      ? <TrendingDown className='size-4' />
      : <LineChart className='size-4' />

  return (
    <div
      className='mt-4 p-4 rounded-sm border'
      style={{
        background: 'var(--ai-surface)',
        borderColor: 'var(--ai-surface-border)',
        color: 'var(--ai-surface-fg)',
      }}
    >
      <div className='flex items-center gap-2 font-semibold mb-2' style={{ fontSize: '0.9375rem' }}>
        {icon}
        {rec.title}
      </div>
      <p style={{ fontSize: '0.9375rem', lineHeight: '1.55' }}>{rec.body}</p>
      <p className='mt-1.5 opacity-80' style={{ fontSize: '0.875rem', lineHeight: '1.55' }}>
        <span className='font-semibold'>Reasoning: </span>{rec.reasoning}
      </p>
    </div>
  )
}

function PricingPage() {
  const { t } = useI18n()
  return (
    <div className='px-8 py-8 space-y-8 min-h-screen'>

      {/* ── Page header ───────────────────────────────── */}
      <div>
        <h1 className='text-[2rem] font-semibold tracking-tight leading-tight'>{t('pricing.title')}</h1>
        <p className='mt-1 flex items-center gap-1.5 text-muted-foreground' style={{ fontSize: '0.9375rem' }}>
          <Info className='size-4 shrink-0' aria-hidden='true' />
          <span>
            <span className='font-semibold'>{t('pricing.simulatedData')}</span>{' '}
            {t('pricing.subtitle')}
          </span>
        </p>
      </div>

      <div className='grid gap-5 md:grid-cols-2 lg:grid-cols-3'>
        {rooms.map((room) => (
          <Card key={room.name} className='flex flex-col'>
            <CardHeader>
              <CardTitle className='text-[1.0625rem]'>{room.name}</CardTitle>
              <CardDescription>Current vs Market</CardDescription>
            </CardHeader>

            <CardContent className='space-y-4 flex-1'>
              {/* Your rate */}
              <div className='flex justify-between items-end border-b pb-4'>
                <div>
                  <p className='text-[0.8125rem] font-semibold tracking-widest uppercase text-muted-foreground mb-0.5'>{t('pricing.yourRate')}</p>
                  <div className='text-[2rem] font-semibold leading-none tracking-tight'>{room.yourRate}</div>
                </div>
                <Badge
                  variant='outline'
                  style={
                    room.badgePositive === true
                      ? { background: 'var(--status-success)', color: 'var(--status-success-fg)', borderColor: 'var(--status-success-border)' }
                      : room.badgePositive === false
                        ? { background: 'var(--status-open)', color: 'var(--status-open-fg)', borderColor: 'var(--status-open-border)' }
                        : { background: 'var(--status-neutral)', color: 'var(--status-neutral-fg)', borderColor: 'var(--status-neutral-border)' }
                  }
                >
                  {room.badge}
                </Badge>
              </div>

              {/* Competitor rates */}
              <div>
                <p className='text-[0.8125rem] font-semibold tracking-widest uppercase text-muted-foreground mb-2'>{t('pricing.competitorRates')}</p>
                <div className='space-y-1.5'>
                  {room.competitors.map(c => (
                    <div key={c.name} className='flex justify-between' style={{ fontSize: '0.9375rem' }}>
                      <span className='text-muted-foreground'>{c.name}</span>
                      <span className='font-medium'>{c.rate}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Market data */}
              <div className='pt-3 border-t space-y-1.5' style={{ fontSize: '0.9375rem' }}>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>{t('pricing.competitorAvg')}</span>
                  <span className='font-semibold'>{room.avg}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>{t('pricing.occupancy')}</span>
                  <span className='font-medium'>{room.occupancy}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>{t('pricing.seasonality')}</span>
                  <span className='font-medium'>{room.seasonality}</span>
                </div>
              </div>

              <RecommendationBlock rec={room.recommendation} />
            </CardContent>

            <CardFooter className='border-t pt-4'>
              <Button
                className='w-full'
                disabled={room.actionDisabled}
                variant={room.actionDisabled ? 'outline' : 'default'}
                onClick={() => {
                  if (!room.actionDisabled) {
                    toast.success('Rate applied', {
                      description: `${room.name} rate updated to the suggested range.`,
                    })
                  }
                }}
              >
                {room.actionLabel}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
