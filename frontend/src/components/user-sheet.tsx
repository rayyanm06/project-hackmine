/**
 * UserSheet
 * Tabbed side drawer for Profile / Account / Billing / Notifications.
 * Opened from the nav-user dropdown; the initial tab is controlled by the caller.
 */
import { useState } from 'react'
import {
  BadgeCheck, Bell, CreditCard, User, Save, Camera,
  CheckCircle2, Clock, Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────
export type UserSheetTab = 'profile' | 'account' | 'billing' | 'notifications'

type Notification = {
  id: string; title: string; body: string; time: string
  read: boolean; category: 'sla' | 'ai' | 'system'
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'SLA Breach Alert', body: 'TSK-1022 (Plumbing Leak) is at risk of breaching SLA in 15 minutes.', time: '5 min ago', read: false, category: 'sla' },
  { id: 'n2', title: 'AI Staffing Recommendation', body: 'Consider scheduling 2 additional housekeeping staff tomorrow 10 AM–2 PM.', time: '1 hr ago', read: false, category: 'ai' },
  { id: 'n3', title: 'Task Completed', body: 'Priya Nair completed TSK-1023 (Extra Towels — Room 305).', time: '2 hr ago', read: true, category: 'system' },
  { id: 'n4', title: 'New Complaint Received', body: 'Room 112 submitted a complaint regarding plumbing. Assigned to Arjun Patil.', time: '3 hr ago', read: true, category: 'system' },
]

// ── Label styles ───────────────────────────────────────────────────────────
function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className='block font-medium text-muted-foreground'
      style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.8125rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}
    >
      {children}
    </label>
  )
}

// ── Profile Tab ────────────────────────────────────────────────────────────
function ProfileTab() {
  const [name,  setName]  = useState('Smart Resort User')
  const [email, setEmail] = useState('user@smartresort360.com')
  const [phone, setPhone] = useState('+91 98765 43210')
  const [role,  setRole]  = useState('Resort Manager')
  const [dirty, setDirty] = useState(false)

  function save(e: React.FormEvent) {
    e.preventDefault()
    setDirty(false)
    toast.success('Profile updated', { description: `Saved as ${name}` })
  }

  function mark(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value); setDirty(true)
    }
  }

  return (
    <form onSubmit={save} className='space-y-6'>
      {/* Avatar */}
      <div className='flex items-center gap-4'>
        <div className='relative'>
          <Avatar className='h-16 w-16 rounded-sm'>
            <AvatarImage src='/avatars/shadcn.jpg' alt={name} />
            <AvatarFallback className='rounded-sm text-sm font-semibold bg-[var(--violet-surface)] text-[var(--violet-deep)]'>
              SR
            </AvatarFallback>
          </Avatar>
          <button
            type='button'
            aria-label='Change profile photo'
            className='absolute -bottom-1 -right-1 size-6 rounded-sm border border-border bg-background flex items-center justify-center hover:bg-muted transition-colors'
          >
            <Camera className='size-3 text-muted-foreground' />
          </button>
        </div>
        <div>
          <p className='font-semibold' style={{ fontSize: '1rem' }}>{name}</p>
          <p className='text-muted-foreground' style={{ fontSize: '0.875rem' }}>{role}</p>
        </div>
      </div>

      <Separator />

      <div className='space-y-4'>
        <div className='space-y-1'>
          <FieldLabel htmlFor='profile-name'>Full Name</FieldLabel>
          <Input id='profile-name' value={name} onChange={mark(setName)} />
        </div>
        <div className='space-y-1'>
          <FieldLabel htmlFor='profile-email'>Email</FieldLabel>
          <Input id='profile-email' type='email' value={email} onChange={mark(setEmail)} />
        </div>
        <div className='space-y-1'>
          <FieldLabel htmlFor='profile-phone'>Phone</FieldLabel>
          <Input id='profile-phone' type='tel' value={phone} onChange={mark(setPhone)} />
        </div>
        <div className='space-y-1'>
          <FieldLabel htmlFor='profile-role'>Role</FieldLabel>
          <Input id='profile-role' value={role} onChange={mark(setRole)} />
        </div>
      </div>

      <div className='flex items-center gap-3 pt-2'>
        <Button type='submit' size='sm' disabled={!dirty} aria-label='Save profile'>
          <Save className='size-4' /> Save Changes
        </Button>
        {dirty && <span className='text-muted-foreground italic' style={{ fontSize: '0.8125rem' }}>Unsaved changes</span>}
      </div>
    </form>
  )
}

// ── Account Tab ────────────────────────────────────────────────────────────
function AccountTab() {
  const [email2FA, setEmail2FA] = useState(true)
  const [loginAlerts, setLoginAlerts] = useState(true)
  const [sessions] = useState([
    { device: 'Chrome — Windows', location: 'Mumbai, IN', current: true,  time: 'Active now' },
    { device: 'Safari — iPhone',  location: 'Mumbai, IN', current: false, time: '2 days ago' },
  ])

  return (
    <div className='space-y-6'>

      {/* Account info */}
      <div className='rounded-sm border p-4 space-y-3'
        style={{ background: 'var(--violet-surface)', borderColor: 'var(--violet-border)' }}>
        <div className='flex items-center gap-2'>
          <BadgeCheck className='size-4 shrink-0' style={{ color: 'var(--violet-deep)' }} />
          <span className='font-semibold' style={{ fontSize: '0.9375rem', color: 'var(--violet-deep)' }}>
            Manager Account
          </span>
          <Badge variant='outline' className='ml-auto text-[0.75rem]'
            style={{ background: 'var(--violet-muted)', color: 'var(--violet-deep)', borderColor: 'var(--violet-border)' }}>
            Active
          </Badge>
        </div>
        <p className='text-muted-foreground' style={{ fontSize: '0.875rem' }}>
          user@smartresort360.com · Member since Jan 2025
        </p>
      </div>

      {/* Security */}
      <div>
        <h4 className='font-semibold mb-3' style={{ fontSize: '0.9375rem', letterSpacing: '0.02em' }}>Security</h4>
        <div className='space-y-0 divide-y divide-border'>
          {[
            { label: 'Email two-factor authentication', desc: 'Require an email code on new device logins.', checked: email2FA, onChange: setEmail2FA },
            { label: 'Login alerts', desc: 'Notify me when a new device signs in.', checked: loginAlerts, onChange: setLoginAlerts },
          ].map(item => (
            <div key={item.label} className='flex items-center justify-between py-3 gap-4'>
              <div>
                <p className='font-medium' style={{ fontSize: '0.9rem' }}>{item.label}</p>
                <p className='text-muted-foreground mt-0.5' style={{ fontSize: '0.8125rem' }}>{item.desc}</p>
              </div>
              <Switch checked={item.checked} onCheckedChange={item.onChange} aria-label={item.label} />
            </div>
          ))}
        </div>
        <Button variant='outline' size='sm' className='mt-4' onClick={() => toast.info('Password reset email sent.')}>
          Change Password
        </Button>
      </div>

      {/* Active sessions */}
      <div>
        <h4 className='font-semibold mb-3' style={{ fontSize: '0.9375rem' }}>Active Sessions</h4>
        <div className='space-y-2'>
          {sessions.map(s => (
            <div key={s.device}
              className={cn('rounded-sm border p-3 flex items-start justify-between gap-3', s.current && 'border-[var(--sage-border)]')}
              style={s.current ? { background: 'var(--sage-surface)' } : {}}
            >
              <div>
                <p className='font-medium' style={{ fontSize: '0.9rem' }}>{s.device}</p>
                <p className='text-muted-foreground' style={{ fontSize: '0.8125rem' }}>{s.location} · {s.time}</p>
              </div>
              {s.current
                ? <Badge variant='outline' className='shrink-0 text-[0.75rem]'
                    style={{ background: 'var(--sage-surface)', color: 'var(--sage-deep)', borderColor: 'var(--sage-border)' }}>
                    Current
                  </Badge>
                : <Button variant='ghost' size='sm' className='shrink-0 text-destructive hover:text-destructive'
                    onClick={() => toast.success('Session revoked')}>
                    Revoke
                  </Button>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Billing Tab ────────────────────────────────────────────────────────────
function BillingTab({ onUpgrade }: { onUpgrade: () => void }) {
  const invoices = [
    { id: 'INV-2025-003', date: 'Mar 1, 2025', amount: '₹0', status: 'paid' },
    { id: 'INV-2025-002', date: 'Feb 1, 2025', amount: '₹0', status: 'paid' },
    { id: 'INV-2025-001', date: 'Jan 1, 2025', amount: '₹0', status: 'paid' },
  ]

  return (
    <div className='space-y-6'>

      {/* Current plan */}
      <div className='rounded-sm border p-4 space-y-3'
        style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <p className='font-semibold' style={{ fontSize: '1rem' }}>Free Plan</p>
            <p className='text-muted-foreground mt-0.5' style={{ fontSize: '0.875rem' }}>Demo mode — full access for hackathon evaluation</p>
          </div>
          <Badge variant='outline' className='shrink-0 text-[0.75rem]'
            style={{ background: 'var(--status-success)', color: 'var(--status-success-fg)', borderColor: 'var(--status-success-border)' }}>
            Active
          </Badge>
        </div>
        <Separator />
        <Button size='sm' onClick={onUpgrade} className='gap-2'
          style={{ background: 'var(--bronze-fg)', color: 'oklch(1 0 0)', borderColor: 'var(--bronze-deep)' }}>
          <Sparkles className='size-4' /> Upgrade to Pro
        </Button>
      </div>

      {/* Payment method */}
      <div>
        <h4 className='font-semibold mb-3' style={{ fontSize: '0.9375rem' }}>Payment Method</h4>
        <div className='rounded-sm border border-dashed p-4 text-center text-muted-foreground'
          style={{ fontSize: '0.9rem' }}>
          <CreditCard className='size-6 mx-auto mb-2 opacity-40' />
          <p>No payment method on file.</p>
          <p style={{ fontSize: '0.8125rem' }}>Required when upgrading to a paid plan.</p>
          <Button variant='outline' size='sm' className='mt-3'
            onClick={() => toast.info('Payment integration pending backend setup.')}>
            Add Payment Method
          </Button>
        </div>
      </div>

      {/* Invoice history */}
      <div>
        <h4 className='font-semibold mb-3' style={{ fontSize: '0.9375rem' }}>Invoice History</h4>
        <div className='rounded-sm border overflow-hidden'>
          <table className='w-full' style={{ fontSize: '0.875rem' }}>
            <thead>
              <tr className='bg-muted/50 border-b'>
                <th className='px-4 py-2.5 text-left text-[0.75rem] font-semibold tracking-widest uppercase text-muted-foreground'>Invoice</th>
                <th className='px-4 py-2.5 text-left text-[0.75rem] font-semibold tracking-widest uppercase text-muted-foreground'>Date</th>
                <th className='px-4 py-2.5 text-left text-[0.75rem] font-semibold tracking-widest uppercase text-muted-foreground'>Amount</th>
                <th className='px-4 py-2.5 text-left text-[0.75rem] font-semibold tracking-widest uppercase text-muted-foreground'>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className='border-b last:border-0 hover:bg-muted/30 transition-colors'>
                  <td className='px-4 py-3 font-medium'>{inv.id}</td>
                  <td className='px-4 py-3 text-muted-foreground'>{inv.date}</td>
                  <td className='px-4 py-3'>{inv.amount}</td>
                  <td className='px-4 py-3'>
                    <Badge variant='outline' className='text-[0.75rem]'
                      style={{ background: 'var(--status-success)', color: 'var(--status-success-fg)', borderColor: 'var(--status-success-border)' }}>
                      {inv.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Notifications Tab ──────────────────────────────────────────────────────
function NotificationsTab() {
  const [items, setItems] = useState<Notification[]>(MOCK_NOTIFICATIONS)

  const unread = items.filter(n => !n.read).length

  function markRead(id: string) {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function markAllRead() {
    setItems(prev => prev.map(n => ({ ...n, read: true })))
    toast.success('All notifications marked as read')
  }

  const catColor: Record<Notification['category'], { bg: string; fg: string; border: string }> = {
    sla:    { bg: 'var(--status-critical)',  fg: 'var(--status-critical-fg)',  border: 'var(--status-critical-border)' },
    ai:     { bg: 'var(--violet-surface)',   fg: 'var(--violet-deep)',         border: 'var(--violet-border)' },
    system: { bg: 'var(--status-neutral)',   fg: 'var(--status-neutral-fg)',   border: 'var(--status-neutral-border)' },
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <p className='font-medium' style={{ fontSize: '0.9375rem' }}>
          {unread > 0 ? `${unread} unread` : 'All caught up'}
        </p>
        {unread > 0 && (
          <Button variant='ghost' size='sm' onClick={markAllRead} className='text-muted-foreground hover:text-foreground'
            style={{ fontSize: '0.875rem' }}>
            <CheckCircle2 className='size-4 mr-1' /> Mark all read
          </Button>
        )}
      </div>

      <div className='space-y-2'>
        {items.map(n => (
          <button
            key={n.id}
            type='button'
            onClick={() => markRead(n.id)}
            className={cn(
              'w-full text-left rounded-sm border p-3 space-y-1 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              n.read
                ? 'bg-background border-border hover:bg-muted/30'
                : 'bg-card border-[var(--violet-border)] hover:bg-[var(--violet-surface)]'
            )}
            aria-label={`${n.read ? '' : 'Unread: '}${n.title}`}
          >
            <div className='flex items-start justify-between gap-2'>
              <div className='flex items-center gap-2'>
                {!n.read && (
                  <span className='size-2 rounded-full shrink-0 mt-0.5' style={{ background: 'var(--violet-deep)' }} aria-hidden='true' />
                )}
                <span className='font-semibold' style={{ fontSize: '0.9rem' }}>{n.title}</span>
              </div>
              <div className='flex items-center gap-2 shrink-0'>
                <Badge variant='outline' className='text-[0.6875rem] px-1.5 py-0'
                  style={{ background: catColor[n.category].bg, color: catColor[n.category].fg, borderColor: catColor[n.category].border }}>
                  {n.category}
                </Badge>
                <span className='text-muted-foreground flex items-center gap-0.5' style={{ fontSize: '0.75rem' }}>
                  <Clock className='size-3' aria-hidden='true' />{n.time}
                </span>
              </div>
            </div>
            <p className={cn('leading-snug', n.read ? 'text-muted-foreground' : 'text-foreground')}
              style={{ fontSize: '0.875rem', paddingLeft: n.read ? 0 : '0.875rem' }}>
              {n.body}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main exported component ────────────────────────────────────────────────
type UserSheetProps = {
  open: boolean
  onOpenChange: (v: boolean) => void
  initialTab?: UserSheetTab
  onUpgrade: () => void
  user: { name: string; email: string; avatar: string }
}

export function UserSheet({ open, onOpenChange, initialTab = 'profile', onUpgrade, user }: UserSheetProps) {
  const [tab, setTab] = useState<UserSheetTab>(initialTab)

  // Sync tab when the sheet is re-opened with a different initialTab
  const handleOpenChange = (v: boolean) => {
    if (v) setTab(initialTab)
    onOpenChange(v)
  }

  const tabs: { value: UserSheetTab; icon: React.ElementType; label: string }[] = [
    { value: 'profile',       icon: User,        label: 'Profile'       },
    { value: 'account',       icon: BadgeCheck,  label: 'Account'       },
    { value: 'billing',       icon: CreditCard,  label: 'Billing'       },
    { value: 'notifications', icon: Bell,        label: 'Notifications' },
  ]

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        className='flex flex-col w-full sm:max-w-lg p-0 gap-0'
        aria-label='User account panel'
      >
        <SheetHeader className='px-6 pt-6 pb-4 border-b border-border shrink-0'>
          <div className='flex items-center gap-3'>
            <Avatar className='h-10 w-10 rounded-sm'>
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className='rounded-sm text-[0.75rem] font-semibold bg-[var(--violet-surface)] text-[var(--violet-deep)]'>
                SR
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle
                className='font-semibold leading-tight'
                style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.0625rem' }}
              >
                {user.name}
              </SheetTitle>
              <SheetDescription
                className='text-muted-foreground'
                style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.875rem' }}
              >
                {user.email}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as UserSheetTab)}
          className='flex flex-col flex-1 min-h-0'
        >
          {/* Tab list */}
          <TabsList className='shrink-0 h-auto p-0 bg-transparent border-b border-border rounded-none grid grid-cols-4'>
            {tabs.map(({ value, icon: Icon, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className={cn(
                  'flex flex-col items-center gap-1 py-3 rounded-none border-b-2 border-transparent',
                  'text-muted-foreground font-medium transition-colors duration-150',
                  'data-[state=active]:border-[var(--violet-deep)] data-[state=active]:text-[var(--violet-deep)] data-[state=active]:bg-[var(--violet-surface)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'
                )}
                style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.75rem' }}
                aria-label={label}
              >
                <Icon className='size-4' aria-hidden='true' />
                <span className='hidden sm:inline'>{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Scrollable tab content */}
          <div className='flex-1 overflow-y-auto'>
            <TabsContent value='profile' className='p-6 mt-0'>
              <ProfileTab />
            </TabsContent>
            <TabsContent value='account' className='p-6 mt-0'>
              <AccountTab />
            </TabsContent>
            <TabsContent value='billing' className='p-6 mt-0'>
              <BillingTab onUpgrade={() => { onOpenChange(false); onUpgrade() }} />
            </TabsContent>
            <TabsContent value='notifications' className='p-6 mt-0'>
              <NotificationsTab />
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
