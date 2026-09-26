import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { mockRooms, type Room } from '@/data/mock-rooms'
import { Camera, Users, Check, Maximize2 } from 'lucide-react'
import { useI18n } from '@/i18n'
import { RoomBookingSheet } from '@/components/room-booking-sheet'

export const Route = createFileRoute('/_layout/rooms-360')({
  component: Rooms360Page,
})

function Rooms360Page() {
  const rooms = mockRooms
  const { t } = useI18n()

  const [bookingRoom,     setBookingRoom]     = useState<Room | null>(null)
  const [bookingSheetOpen, setBookingSheetOpen] = useState(false)

  function openBooking(room: Room) {
    setBookingRoom(room)
    setBookingSheetOpen(true)
  }

  return (
    <div className='px-8 py-8 space-y-8 min-h-screen'>

      {/* ── Page header ───────────────────────────────── */}
      <div>
        <h1 className='font-semibold tracking-tight leading-tight' style={{ fontSize: 'var(--text-3xl)' }}>
          {t('rooms.title')}
        </h1>
        <p className='mt-1 text-muted-foreground' style={{ fontSize: '0.9375rem' }}>
          {t('rooms.subtitle')}
        </p>
      </div>

      {/* Room grid */}
      <div className='grid gap-5 md:grid-cols-2 lg:grid-cols-3'>
        {rooms.map((room) => (
          <Card
            key={room.id}
            className='overflow-hidden flex flex-col p-0 gap-0 group/card hover:shadow-sm transition-shadow duration-200'
          >
            {/* Image with hover overlay */}
            <div className='relative aspect-video bg-muted overflow-hidden'>
              <img
                src={room.thumbnail}
                alt={room.name}
                className='w-full h-full object-cover transition-transform duration-400 group-hover/card:scale-[1.03]'
              />
              {/* 360° tour trigger — shown on hover */}
              <div className='absolute inset-0 bg-foreground/30 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-250'>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant='secondary' className='gap-2 shadow-sm'>
                      <Camera className='size-4' aria-hidden='true' /> {t('rooms.viewTour')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className='max-w-4xl w-[90vw] h-[80vh] flex flex-col'>
                    <DialogHeader>
                      <DialogTitle style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.25rem' }}>
                        {room.name}
                      </DialogTitle>
                      <DialogDescription style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}>
                        {t('rooms.interactiveTour')}
                      </DialogDescription>
                    </DialogHeader>
                    <div className='flex-1 bg-foreground/95 rounded-sm relative overflow-hidden flex items-center justify-center border border-border/20'>
                      <div className='text-muted-foreground/40 flex flex-col items-center gap-2'>
                        <Maximize2 className='size-10 opacity-30' aria-hidden='true' />
                        <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}>
                          {t('rooms.pannellumPlaceholder')}
                        </p>
                        <p className='opacity-50' style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.8125rem' }}>
                          {t('rooms.pannellumNote')}
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Availability badge */}
              {!room.available && (
                <div className='absolute top-2.5 right-2.5'>
                  <Badge variant='outline' style={{
                    background: 'var(--status-critical)',
                    color: 'var(--status-critical-fg)',
                    borderColor: 'var(--status-critical-border)',
                  }}>
                    {t('rooms.soldOut')}
                  </Badge>
                </div>
              )}
            </div>

            {/* Card header */}
            <CardHeader className='pt-4 pb-2'>
              <div className='flex justify-between items-start gap-2'>
                <div>
                  <CardTitle className='text-[1.0625rem]'>{room.name}</CardTitle>
                  <CardDescription>{room.type}</CardDescription>
                </div>
                <div className='text-right shrink-0'>
                  <div className='text-[1.125rem] font-semibold tracking-tight'>
                    ₹{room.price.toLocaleString()}
                  </div>
                  <div className='text-muted-foreground' style={{ fontSize: '0.8125rem' }}>
                    {t('rooms.perNight')}
                  </div>
                </div>
              </div>
            </CardHeader>

            {/* Card body */}
            <CardContent className='flex-1 space-y-3 pb-4'>
              <p className='text-muted-foreground line-clamp-2' style={{ fontSize: '0.9rem', lineHeight: '1.55' }}>
                {room.description}
              </p>

              <div className='flex items-center gap-2 text-muted-foreground' style={{ fontSize: '0.875rem' }}>
                <Users className='size-3.5 shrink-0' aria-hidden='true' />
                {t('rooms.upTo')} {room.capacity} {t('rooms.guests')}
              </div>

              <div className='space-y-1.5'>
                <div className='text-[0.75rem] font-semibold tracking-widest uppercase text-muted-foreground'>
                  {t('rooms.amenities')}
                </div>
                <div className='flex flex-wrap gap-1'>
                  {room.amenities.map(a => (
                    <Badge key={a} variant='outline' className='text-[0.75rem] font-medium gap-1'
                      style={{ background: 'var(--sage-surface)', color: 'var(--sage-deep)', borderColor: 'var(--sage-border)' }}>
                      <Check className='size-3 shrink-0' aria-hidden='true' />
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>

            {/* Footer — Book Now opens the booking sheet */}
            <CardFooter className='border-t pt-4 pb-4'>
              <Button
                className='w-full'
                disabled={!room.available}
                onClick={() => openBooking(room)}
                aria-label={`${room.available ? t('action.book') : t('rooms.notAvailable')} — ${room.name}`}
                style={room.available ? { background: 'var(--violet-deep)', color: 'oklch(1 0 0)' } : {}}
              >
                {room.available ? t('action.book') : t('rooms.notAvailable')}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Booking sheet — rendered once outside the grid */}
      <RoomBookingSheet
        room={bookingRoom}
        open={bookingSheetOpen}
        onOpenChange={setBookingSheetOpen}
      />
    </div>
  )
}
