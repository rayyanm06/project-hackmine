import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Search, MapPin, Camera } from 'lucide-react'
import { useI18n } from '@/i18n'
import { RoomBookingSheet } from '@/components/room-booking-sheet'
import { mockRooms, type Room } from '@/data/mock-rooms'

export const Route = createFileRoute('/_layout/recommendations')({
  component: RecommendationsPage,
})

function RecommendationsPage() {
  const { t } = useI18n()
  const [bookingRoom, setBookingRoom]         = useState<Room | null>(null)
  const [bookingSheetOpen, setBookingSheetOpen] = useState(false)

  // Map recommendation names to mock room data for the booking flow
  const roomByName: Record<string, Room | undefined> = {
    'Goa Palm Retreat':    mockRooms.find(r => r.id === 'RM-105'),
    'Munnar Valley Resort': mockRooms.find(r => r.id === 'RM-201'),
  }

  function openBooking(name: string) {
    const room = roomByName[name] ?? mockRooms[0]
    setBookingRoom(room)
    setBookingSheetOpen(true)
  }

  const properties = [
    {
      name: 'Goa Palm Retreat',
      location: 'South Goa',
      price: '₹4,200',
      tags: ['AC Deluxe', 'Pool', 'WiFi'],
      dietary: 'Pure Veg',
      reason: 'Matches your ₹5,000 max budget. Has all 2 requested amenities (Pool, WiFi) and features a certified Pure Veg kitchen.',
    },
    {
      name: 'Munnar Valley Resort',
      location: 'Kerala',
      price: '₹3,800',
      tags: ['Family Suite', 'WiFi'],
      dietary: 'Jain Options',
      reason: 'Excellent price match. Lacks a pool, but offers Jain dietary options and spacious family accommodation.',
    },
  ]

  return (
    <div className='px-8 py-8 space-y-8 min-h-screen'>

      {/* ── Page header ───────────────────────────────── */}
      <div>
        <h1 className='text-[2rem] font-semibold tracking-tight leading-tight'>{t('recommendations.title')}</h1>
        <p className='mt-1 text-muted-foreground' style={{ fontSize: '0.9375rem' }}>
          {t('recommendations.subtitle')}
        </p>
      </div>

      {/* Stack on mobile, side-by-side on md+ */}
      <div className='grid gap-6 md:grid-cols-12'>

        {/* Search form — full width on mobile, 4/12 on md+ */}
        <div className='md:col-span-4 space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='text-[1.0625rem]'>{t('recommendations.formTitle')}</CardTitle>
              <CardDescription>{t('recommendations.formDesc')}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-1.5'>
                <label htmlFor='rec-nlp' className='text-[0.9375rem] font-medium'>
                  {t('recommendations.naturalLanguage')}
                </label>
                <Textarea
                  id='rec-nlp'
                  placeholder={t('recommendations.naturalPlaceholder')}
                  className='min-h-[110px] rounded-sm text-[0.9375rem] resize-none'
                />
              </div>

              <div className='relative flex items-center py-1'>
                <div className='flex-grow border-t border-border' aria-hidden='true' />
                <span className='flex-shrink-0 mx-4 text-[0.75rem] font-semibold tracking-widest uppercase text-muted-foreground'>
                  {t('recommendations.orUseFilters')}
                </span>
                <div className='flex-grow border-t border-border' aria-hidden='true' />
              </div>

              <div className='space-y-3'>
                <div className='grid grid-cols-2 gap-2'>
                  <div className='space-y-1.5'>
                    <label htmlFor='rec-checkin' className='text-[0.875rem] font-medium'>
                      {t('recommendations.checkin')}
                    </label>
                    <Input id='rec-checkin' type='date' className='text-[0.875rem]' />
                  </div>
                  <div className='space-y-1.5'>
                    <label htmlFor='rec-checkout' className='text-[0.875rem] font-medium'>
                      {t('recommendations.checkout')}
                    </label>
                    <Input id='rec-checkout' type='date' className='text-[0.875rem]' />
                  </div>
                </div>
                <div className='space-y-1.5'>
                  <label htmlFor='rec-budget' className='text-[0.875rem] font-medium'>
                    {t('recommendations.budget')}
                  </label>
                  <Input id='rec-budget' type='number' placeholder='5000' />
                </div>
                <div className='space-y-1.5'>
                  <label htmlFor='rec-dietary' className='text-[0.875rem] font-medium'>
                    {t('recommendations.dietary')}
                  </label>
                  <Input id='rec-dietary' type='text' placeholder={t('recommendations.dietaryPlaceholder')} />
                </div>
              </div>
            </CardContent>
            <CardFooter className='border-t pt-4'>
              <Button className='w-full' aria-label={t('action.findMatches')}>
                <Search className='size-4' aria-hidden='true' /> {t('action.findMatches')}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Results — full width on mobile, 8/12 on md+ */}
        <div className='md:col-span-8 space-y-5'>
          <h2 className='text-[1.375rem] font-semibold tracking-tight'>{t('recommendations.resultsTitle')}</h2>

          {properties.map((property) => (
            <Card key={property.name} className='overflow-hidden'>
              <CardContent className='p-0'>
                {/* Mobile: stacked. sm+: side-by-side */}
                <div className='flex flex-col sm:flex-row'>
                  {/* Thumbnail */}
                  <div className='sm:w-1/3 bg-muted border-b sm:border-b-0 sm:border-r border-border flex items-center justify-center min-h-[140px] aspect-video sm:aspect-auto'>
                    <Camera className='size-8 text-muted-foreground/30' aria-hidden='true' />
                  </div>

                  {/* Content */}
                  <div className='sm:w-2/3 p-5 sm:p-6 flex flex-col justify-between gap-4'>
                    <div>
                      {/* Name + price row — stack on very small, inline on sm+ */}
                      <div className='flex flex-col xs:flex-row xs:justify-between xs:items-start gap-2'>
                        <div>
                          <h3 className='text-[1.1875rem] font-semibold tracking-tight'>{property.name}</h3>
                          <div className='flex items-center gap-1 text-muted-foreground mt-0.5' style={{ fontSize: '0.875rem' }}>
                            <MapPin className='size-3.5' aria-hidden='true' /> {property.location}
                          </div>
                        </div>
                        <div className='shrink-0'>
                          <div className='text-[1.375rem] font-semibold tracking-tight'>{property.price}</div>
                          <div className='text-muted-foreground' style={{ fontSize: '0.8125rem' }}>
                            {t('recommendations.perNight')}
                          </div>
                        </div>
                      </div>

                      <div className='mt-3 flex flex-wrap gap-1.5'>
                        {property.tags.map(tag => (
                          <Badge key={tag} variant='secondary' className='text-[0.8125rem]'>{tag}</Badge>
                        ))}
                        <Badge
                          variant='outline'
                          style={{
                            background: 'var(--status-success)',
                            color: 'var(--status-success-fg)',
                            borderColor: 'var(--status-success-border)',
                          }}
                          className='text-[0.8125rem]'
                        >
                          {property.dietary}
                        </Badge>
                      </div>

                      <div
                        className='mt-4 p-3 rounded-sm border'
                        style={{
                          background: 'var(--ai-surface)',
                          borderColor: 'var(--ai-surface-border)',
                          color: 'var(--ai-surface-fg)',
                        }}
                      >
                        <span className='font-semibold' style={{ fontSize: '0.875rem' }}>
                          {t('recommendations.whyRecommended')}:{' '}
                        </span>
                        <span style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>{property.reason}</span>
                      </div>
                    </div>

                    <div className='flex justify-end gap-2 flex-wrap'>
                      <Button variant='outline' size='sm' aria-label={`${t('action.view360')} — ${property.name}`}>
                        <Camera className='size-4' aria-hidden='true' /> {t('action.view360')}
                      </Button>
                      <Button
                        size='sm'
                        aria-label={`${t('action.book')} — ${property.name}`}
                        onClick={() => openBooking(property.name)}
                        style={{ background: 'var(--violet-deep)', color: 'oklch(1 0 0)' }}
                      >
                        {t('action.book')}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Booking sheet */}
      <RoomBookingSheet
        room={bookingRoom}
        open={bookingSheetOpen}
        onOpenChange={setBookingSheetOpen}
      />
    </div>
  )
}
