/**
 * RoomBookingSheet
 * Full booking flow for a room. Opens as a side sheet from "Book Now".
 * Steps: Detail → Booking Form → Confirmation
 * Frontend-only; no real payment or backend call.
 */
import { useState } from 'react'
import {
  Users, Check, Calendar, ChevronRight, CheckCircle2,
  Bed, Wifi, Bath, Tv, Coffee, Mountain,
  X, Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { type Room } from '@/data/mock-rooms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'

// ── Amenity → icon map ─────────────────────────────────────────────────────
const AMENITY_ICONS: Record<string, React.ElementType> = {
  'Sea View': Mountain,  'Garden View': Mountain, 'City View': Mountain,
  'Balcony': Mountain,   'Patio': Mountain,
  'King Bed': Bed,       'Queen Bed': Bed,        'Double Bed': Bed,
  'Free WiFi': Wifi,
  'Bathtub': Bath,       'Ensuite Bathroom': Bath,
  'TV': Tv,
  'Minibar': Coffee,     'Kitchenette': Coffee,
}
function AmenityIcon({ name }: { name: string }) {
  const Icon = AMENITY_ICONS[name] ?? Check
  return <Icon className='size-3.5 shrink-0' aria-hidden='true' />
}

// ── Date helpers ───────────────────────────────────────────────────────────
function today() {
  return new Date().toISOString().split('T')[0]
}
function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}
function nightsBetween(a: string, b: string) {
  const ms = new Date(b).getTime() - new Date(a).getTime()
  return Math.max(1, Math.round(ms / 86_400_000))
}
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ── Step indicator ─────────────────────────────────────────────────────────
type Step = 'detail' | 'booking' | 'confirmation'

function StepBar({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 'detail',       label: 'Room Details' },
    { id: 'booking',      label: 'Your Details' },
    { id: 'confirmation', label: 'Confirmed'    },
  ]
  const idx = steps.findIndex(s => s.id === step)
  return (
    <div className='flex items-center gap-0 px-6 py-3 border-b border-border bg-muted/30' role='list' aria-label='Booking steps'>
      {steps.map((s, i) => (
        <div key={s.id} className='flex items-center gap-0 flex-1' role='listitem'>
          <div className={cn(
            'flex items-center gap-1.5 text-[0.8125rem] font-medium transition-colors',
            i < idx  ? 'text-[var(--sage-fg)]' :
            i === idx ? 'text-[var(--violet-deep)]' :
                       'text-muted-foreground'
          )}>
            <span className={cn(
              'size-5 rounded-full flex items-center justify-center text-[0.6875rem] font-semibold shrink-0 border transition-all',
              i < idx  ? 'bg-[var(--sage-surface)] border-[var(--sage-border)] text-[var(--sage-deep)]' :
              i === idx ? 'bg-[var(--violet-surface)] border-[var(--violet-border)] text-[var(--violet-deep)]' :
                         'bg-muted border-border text-muted-foreground'
            )}>
              {i < idx ? <Check className='size-2.5' aria-hidden='true' /> : i + 1}
            </span>
            <span className='hidden sm:inline'>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight className='size-3.5 text-muted-foreground/40 mx-1 shrink-0' aria-hidden='true' />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Step 1: Room Detail ────────────────────────────────────────────────────
function DetailStep({ room, onContinue }: { room: Room; onContinue: () => void }) {
  return (
    <div className='flex flex-col h-full'>
      {/* Room image */}
      <div className='relative aspect-[16/7] bg-muted overflow-hidden shrink-0'>
        <img
          src={room.thumbnail}
          alt={room.name}
          className='w-full h-full object-cover'
        />
        <div className='absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent' aria-hidden='true' />
        <div className='absolute bottom-4 left-5 right-5'>
          <p className='text-white font-semibold leading-tight' style={{ fontSize: 'var(--text-xl)', fontFamily: 'var(--font-cormorant)', textShadow: '0 1px 4px oklch(0 0 0 / 40%)' }}>
            {room.name}
          </p>
          <p className='text-white/80' style={{ fontSize: '0.875rem' }}>{room.type}</p>
        </div>
        {!room.available && (
          <div className='absolute top-3 right-3'>
            <Badge variant='outline' style={{ background: 'var(--status-critical)', color: 'var(--status-critical-fg)', borderColor: 'var(--status-critical-border)' }}>
              Sold Out
            </Badge>
          </div>
        )}
      </div>

      {/* Details */}
      <div className='flex-1 overflow-y-auto p-5 space-y-5'>

        {/* Price + capacity */}
        <div className='flex items-end justify-between'>
          <div>
            <span className='font-semibold' style={{ fontSize: 'var(--text-3xl)', fontFamily: 'var(--font-cormorant)' }}>
              ₹{room.price.toLocaleString()}
            </span>
            <span className='text-muted-foreground ml-1' style={{ fontSize: '0.875rem' }}>/night</span>
          </div>
          <div className='flex items-center gap-1.5 text-muted-foreground' style={{ fontSize: '0.9rem' }}>
            <Users className='size-4' aria-hidden='true' />
            Up to {room.capacity} guests
          </div>
        </div>

        <Separator />

        {/* Description */}
        <p className='text-muted-foreground' style={{ fontSize: '0.9375rem', lineHeight: '1.65' }}>
          {room.description}
        </p>

        {/* Amenities */}
        <div>
          <p className='font-semibold mb-2.5 text-[0.8125rem] tracking-widest uppercase text-muted-foreground'>
            Amenities
          </p>
          <div className='grid grid-cols-2 gap-y-2 gap-x-4'>
            {room.amenities.map(a => (
              <div key={a} className='flex items-center gap-2' style={{ fontSize: '0.9rem' }}>
                <span className='flex items-center justify-center size-6 rounded-sm shrink-0'
                  style={{ background: 'var(--sage-surface)', color: 'var(--sage-fg)' }}>
                  <AmenityIcon name={a} />
                </span>
                {a}
              </div>
            ))}
          </div>
        </div>

        {/* Room details grid */}
        <div className='rounded-sm border p-4 grid grid-cols-2 gap-3'
          style={{ background: 'var(--ai-surface)', borderColor: 'var(--ai-surface-border)' }}>
          <div>
            <p className='text-[0.75rem] font-semibold tracking-wide uppercase text-muted-foreground mb-0.5'>Room ID</p>
            <p style={{ fontSize: '0.9375rem' }}>{room.id}</p>
          </div>
          <div>
            <p className='text-[0.75rem] font-semibold tracking-wide uppercase text-muted-foreground mb-0.5'>Category</p>
            <p style={{ fontSize: '0.9375rem' }}>{room.type}</p>
          </div>
          <div>
            <p className='text-[0.75rem] font-semibold tracking-wide uppercase text-muted-foreground mb-0.5'>Capacity</p>
            <p style={{ fontSize: '0.9375rem' }}>{room.capacity} guests max</p>
          </div>
          <div>
            <p className='text-[0.75rem] font-semibold tracking-wide uppercase text-muted-foreground mb-0.5'>Availability</p>
            <Badge variant='outline' className='text-[0.75rem]' style={
              room.available
                ? { background: 'var(--status-success)', color: 'var(--status-success-fg)', borderColor: 'var(--status-success-border)' }
                : { background: 'var(--status-critical)', color: 'var(--status-critical-fg)', borderColor: 'var(--status-critical-border)' }
            }>
              {room.available ? 'Available' : 'Sold Out'}
            </Badge>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className='shrink-0 p-5 border-t border-border'>
        <Button
          className='w-full'
          disabled={!room.available}
          onClick={onContinue}
          aria-label={`Continue to book ${room.name}`}
          style={{ background: 'var(--violet-deep)', color: 'oklch(1 0 0)' }}
        >
          {room.available ? 'Continue to Book' : 'Not Available'}
        </Button>
      </div>
    </div>
  )
}

// ── Step 2: Booking Form ───────────────────────────────────────────────────
type BookingData = {
  checkIn: string; checkOut: string; guests: number
  firstName: string; lastName: string; email: string; phone: string
  requests: string
}

function BookingStep({
  room, onConfirm, onBack,
}: {
  room: Room
  onConfirm: (data: BookingData) => void
  onBack: () => void
}) {
  const defaultIn  = addDays(today(), 1)
  const defaultOut = addDays(today(), 3)

  const [form, setForm] = useState<BookingData>({
    checkIn:   defaultIn,
    checkOut:  defaultOut,
    guests:    1,
    firstName: '',
    lastName:  '',
    email:     '',
    phone:     '',
    requests:  '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof BookingData, string>>>({})

  const nights = nightsBetween(form.checkIn, form.checkOut)
  const total  = nights * room.price

  function set<K extends keyof BookingData>(key: K, value: BookingData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const e: typeof errors = {}
    if (!form.firstName.trim()) e.firstName = 'First name is required'
    if (!form.lastName.trim())  e.lastName  = 'Last name is required'
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Valid email is required'
    if (form.guests < 1 || form.guests > room.capacity)
      e.guests = `Guests must be 1–${room.capacity}`
    if (form.checkOut <= form.checkIn) e.checkOut = 'Check-out must be after check-in'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) onConfirm(form)
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col h-full'>
      <div className='flex-1 overflow-y-auto p-5 space-y-5'>

        {/* Price summary */}
        <div className='rounded-sm border p-4 space-y-2'
          style={{ background: 'var(--violet-surface)', borderColor: 'var(--violet-border)' }}>
          <p className='font-semibold' style={{ fontSize: '1rem', color: 'var(--violet-deep)' }}>{room.name}</p>
          <div className='flex justify-between text-muted-foreground' style={{ fontSize: '0.875rem' }}>
            <span>₹{room.price.toLocaleString()} × {nights} night{nights !== 1 ? 's' : ''}</span>
            <span className='font-semibold text-foreground'>₹{total.toLocaleString()}</span>
          </div>
        </div>

        {/* Dates + guests */}
        <fieldset className='space-y-3'>
          <legend className='font-semibold mb-2' style={{ fontSize: '0.9375rem' }}>Stay Details</legend>
          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1'>
              <label htmlFor='bk-checkin' className='text-[0.8125rem] font-medium text-muted-foreground flex items-center gap-1'>
                <Calendar className='size-3.5' aria-hidden='true' /> Check-in
              </label>
              <Input
                id='bk-checkin' type='date' value={form.checkIn} min={today()}
                onChange={e => set('checkIn', e.target.value)}
                aria-invalid={!!errors.checkIn}
                aria-describedby={errors.checkIn ? 'bk-checkin-err' : undefined}
              />
              {errors.checkIn && <p id='bk-checkin-err' className='text-destructive' style={{ fontSize: '0.8125rem' }}>{errors.checkIn}</p>}
            </div>
            <div className='space-y-1'>
              <label htmlFor='bk-checkout' className='text-[0.8125rem] font-medium text-muted-foreground flex items-center gap-1'>
                <Calendar className='size-3.5' aria-hidden='true' /> Check-out
              </label>
              <Input
                id='bk-checkout' type='date' value={form.checkOut} min={addDays(form.checkIn, 1)}
                onChange={e => set('checkOut', e.target.value)}
                aria-invalid={!!errors.checkOut}
                aria-describedby={errors.checkOut ? 'bk-checkout-err' : undefined}
              />
              {errors.checkOut && <p id='bk-checkout-err' className='text-destructive' style={{ fontSize: '0.8125rem' }}>{errors.checkOut}</p>}
            </div>
          </div>
          <div className='space-y-1'>
            <label htmlFor='bk-guests' className='text-[0.8125rem] font-medium text-muted-foreground flex items-center gap-1'>
              <Users className='size-3.5' aria-hidden='true' /> Guests (max {room.capacity})
            </label>
            <Input
              id='bk-guests' type='number' min={1} max={room.capacity} value={form.guests}
              onChange={e => set('guests', parseInt(e.target.value) || 1)}
              aria-invalid={!!errors.guests}
              aria-describedby={errors.guests ? 'bk-guests-err' : undefined}
              className='max-w-[8rem]'
            />
            {errors.guests && <p id='bk-guests-err' className='text-destructive' style={{ fontSize: '0.8125rem' }}>{errors.guests}</p>}
          </div>
        </fieldset>

        <Separator />

        {/* Guest info */}
        <fieldset className='space-y-3'>
          <legend className='font-semibold mb-2' style={{ fontSize: '0.9375rem' }}>Guest Information</legend>
          <div className='grid grid-cols-2 gap-3'>
            <div className='space-y-1'>
              <label htmlFor='bk-fname' className='text-[0.8125rem] font-medium text-muted-foreground'>First Name</label>
              <Input
                id='bk-fname' placeholder='Arjun'
                value={form.firstName} onChange={e => set('firstName', e.target.value)}
                aria-invalid={!!errors.firstName}
                aria-describedby={errors.firstName ? 'bk-fname-err' : undefined}
              />
              {errors.firstName && <p id='bk-fname-err' className='text-destructive' style={{ fontSize: '0.8125rem' }}>{errors.firstName}</p>}
            </div>
            <div className='space-y-1'>
              <label htmlFor='bk-lname' className='text-[0.8125rem] font-medium text-muted-foreground'>Last Name</label>
              <Input
                id='bk-lname' placeholder='Kapoor'
                value={form.lastName} onChange={e => set('lastName', e.target.value)}
                aria-invalid={!!errors.lastName}
                aria-describedby={errors.lastName ? 'bk-lname-err' : undefined}
              />
              {errors.lastName && <p id='bk-lname-err' className='text-destructive' style={{ fontSize: '0.8125rem' }}>{errors.lastName}</p>}
            </div>
          </div>
          <div className='space-y-1'>
            <label htmlFor='bk-email' className='text-[0.8125rem] font-medium text-muted-foreground'>Email</label>
            <Input
              id='bk-email' type='email' placeholder='arjun@example.com'
              value={form.email} onChange={e => set('email', e.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'bk-email-err' : undefined}
            />
            {errors.email && <p id='bk-email-err' className='text-destructive' style={{ fontSize: '0.8125rem' }}>{errors.email}</p>}
          </div>
          <div className='space-y-1'>
            <label htmlFor='bk-phone' className='text-[0.8125rem] font-medium text-muted-foreground'>Phone (optional)</label>
            <Input
              id='bk-phone' type='tel' placeholder='+91 98765 43210'
              value={form.phone} onChange={e => set('phone', e.target.value)}
            />
          </div>
          <div className='space-y-1'>
            <label htmlFor='bk-requests' className='text-[0.8125rem] font-medium text-muted-foreground'>Special Requests (optional)</label>
            <textarea
              id='bk-requests'
              rows={2}
              placeholder='e.g. early check-in, vegetarian meal, extra pillows…'
              value={form.requests}
              onChange={e => set('requests', e.target.value)}
              className='w-full rounded-sm border border-input bg-transparent px-3 py-2 text-[0.9375rem] placeholder:text-muted-foreground/70 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              style={{ fontFamily: 'var(--font-cormorant)' }}
            />
          </div>
        </fieldset>

        {/* Demo notice */}
        <div className='flex items-start gap-2 rounded-sm border p-3'
          style={{ background: 'var(--terra-surface)', borderColor: 'var(--terra-border)' }}>
          <Info className='size-4 shrink-0 mt-0.5' style={{ color: 'var(--terra-fg)' }} aria-hidden='true' />
          <p style={{ fontSize: '0.8125rem', color: 'var(--terra-deep)', lineHeight: '1.55' }}>
            <strong>Demo Mode:</strong> No real reservation will be made. Payment integration is pending backend setup.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className='shrink-0 p-5 border-t border-border flex gap-3'>
        <Button type='button' variant='outline' onClick={onBack} aria-label='Back to room details'>
          Back
        </Button>
        <Button
          type='submit'
          className='flex-1'
          style={{ background: 'var(--violet-deep)', color: 'oklch(1 0 0)' }}
          aria-label='Confirm booking'
        >
          Confirm Booking — ₹{total.toLocaleString()}
        </Button>
      </div>
    </form>
  )
}

// ── Step 3: Confirmation ───────────────────────────────────────────────────
function ConfirmationStep({
  room, booking, onClose,
}: {
  room: Room
  booking: BookingData
  onClose: () => void
}) {
  const nights = nightsBetween(booking.checkIn, booking.checkOut)
  const total  = nights * room.price
  // Generate a stable reference once on mount
  const [ref] = useState(
    () => `SR360-${room.id}-${Date.now().toString(36).toUpperCase().slice(-6)}`
  )

  return (
    <div className='flex flex-col h-full'>
      <div className='flex-1 overflow-y-auto p-6 space-y-6'>

        {/* Success header */}
        <div className='text-center space-y-3 py-4'>
          <div className='flex items-center justify-center'>
            <span className='size-14 rounded-full flex items-center justify-center'
              style={{ background: 'var(--sage-surface)', border: '2px solid var(--sage-border)' }}>
              <CheckCircle2 className='size-7' style={{ color: 'var(--sage-fg)' }} aria-hidden='true' />
            </span>
          </div>
          <h2 className='font-semibold' style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'var(--text-2xl)' }}>
            Booking Requested
          </h2>
          <p className='text-muted-foreground' style={{ fontSize: '0.9375rem' }}>
            Your reservation request has been submitted.
          </p>
          <div className='inline-block rounded-sm border px-4 py-2'
            style={{ background: 'var(--violet-surface)', borderColor: 'var(--violet-border)' }}>
            <p className='text-[0.75rem] font-semibold tracking-widest uppercase text-muted-foreground mb-0.5'>Reference</p>
            <p className='font-semibold' style={{ fontSize: '1rem', color: 'var(--violet-deep)', letterSpacing: '0.05em' }}>{ref}</p>
          </div>
        </div>

        <Separator />

        {/* Booking summary */}
        <div className='space-y-3'>
          <p className='font-semibold text-[0.8125rem] tracking-widest uppercase text-muted-foreground'>Booking Summary</p>

          {[
            ['Room',     `${room.name} (${room.type})`],
            ['Check-in',  formatDate(booking.checkIn)],
            ['Check-out', formatDate(booking.checkOut)],
            ['Nights',   `${nights} night${nights !== 1 ? 's' : ''}`],
            ['Guests',   `${booking.guests}`],
            ['Guest',    `${booking.firstName} ${booking.lastName}`],
            ['Email',    booking.email],
          ].map(([label, value]) => (
            <div key={label} className='flex justify-between items-start gap-4' style={{ fontSize: '0.9375rem' }}>
              <span className='text-muted-foreground shrink-0'>{label}</span>
              <span className='font-medium text-right'>{value}</span>
            </div>
          ))}

          {booking.requests && (
            <div className='flex justify-between items-start gap-4' style={{ fontSize: '0.9375rem' }}>
              <span className='text-muted-foreground shrink-0'>Requests</span>
              <span className='font-medium text-right italic'>{booking.requests}</span>
            </div>
          )}

          <Separator />

          <div className='flex justify-between items-center' style={{ fontSize: '1.0625rem' }}>
            <span className='font-semibold'>Total</span>
            <span className='font-semibold' style={{ color: 'var(--violet-deep)' }}>
              ₹{total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Demo notice */}
        <div className='flex items-start gap-2 rounded-sm border p-3'
          style={{ background: 'var(--terra-surface)', borderColor: 'var(--terra-border)' }}>
          <Info className='size-4 shrink-0 mt-0.5' style={{ color: 'var(--terra-fg)' }} aria-hidden='true' />
          <p style={{ fontSize: '0.8125rem', color: 'var(--terra-deep)', lineHeight: '1.55' }}>
            <strong>Demo Mode:</strong> This is a frontend-only confirmation. No actual reservation has been created — backend integration is pending Phase 2.
          </p>
        </div>
      </div>

      <div className='shrink-0 p-5 border-t border-border'>
        <Button className='w-full' onClick={onClose} aria-label='Close booking confirmation'>
          Done
        </Button>
      </div>
    </div>
  )
}

// ── Main exported component ────────────────────────────────────────────────
type RoomBookingSheetProps = {
  room: Room | null
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function RoomBookingSheet({ room, open, onOpenChange }: RoomBookingSheetProps) {
  const [step,    setStep]    = useState<Step>('detail')
  const [booking, setBooking] = useState<BookingData | null>(null)

  function handleOpenChange(v: boolean) {
    if (!v) { setStep('detail'); setBooking(null) }
    onOpenChange(v)
  }

  function handleConfirm(data: BookingData) {
    setBooking(data)
    setStep('confirmation')
    toast.success('Booking submitted', {
      description: `${room?.name} · ${data.firstName} ${data.lastName}`,
    })
  }

  if (!room) return null

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        className='flex flex-col w-full sm:max-w-xl p-0 gap-0 overflow-hidden'
        aria-label={`Book ${room.name}`}
      >
        {/* Sheet header */}
        <SheetHeader className='px-5 pt-5 pb-3 border-b border-border shrink-0'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <SheetTitle
                style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.1875rem', fontWeight: 600 }}
              >
                {step === 'confirmation' ? 'Booking Confirmed' : `Book — ${room.name}`}
              </SheetTitle>
              <SheetDescription
                style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.875rem' }}
              >
                {step === 'detail'       && `₹${room.price.toLocaleString()} / night · ${room.type}`}
                {step === 'booking'      && 'Fill in your details to complete the booking'}
                {step === 'confirmation' && 'Your reservation has been submitted'}
              </SheetDescription>
            </div>
            <button
              type='button'
              onClick={() => handleOpenChange(false)}
              className='rounded-sm p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0'
              aria-label='Close booking sheet'
            >
              <X className='size-4' aria-hidden='true' />
            </button>
          </div>
        </SheetHeader>

        {/* Step indicator */}
        <StepBar step={step} />

        {/* Step content fills remaining height */}
        <div className='flex-1 min-h-0 flex flex-col'>
          {step === 'detail' && (
            <DetailStep room={room} onContinue={() => setStep('booking')} />
          )}
          {step === 'booking' && (
            <BookingStep
              room={room}
              onConfirm={handleConfirm}
              onBack={() => setStep('detail')}
            />
          )}
          {step === 'confirmation' && booking && (
            <ConfirmationStep
              room={room}
              booking={booking}
              onClose={() => handleOpenChange(false)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
