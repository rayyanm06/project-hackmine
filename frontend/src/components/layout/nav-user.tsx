import { useState } from 'react'
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { UserSheet, type UserSheetTab } from '@/components/user-sheet'
import { UpgradeModal } from '@/components/upgrade-modal'
import { AuthService } from '@/lib/auth'

type NavUserProps = {
  user: {
    name: string
    email: string
    avatar: string
  }
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar()

  // Sheet / modal state
  const [sheetOpen,     setSheetOpen]     = useState(false)
  const [sheetTab,      setSheetTab]      = useState<UserSheetTab>('profile')
  const [upgradeOpen,   setUpgradeOpen]   = useState(false)

  function openSheet(tab: UserSheetTab) {
    setSheetTab(tab)
    setSheetOpen(true)
  }

  async function handleSignOut() {
    await AuthService.signOut()
    toast.success('Signed out', {
      description: 'You have been signed out of Smart Resort 360.',
    })
    window.location.href = '/'
  }

  const menuItemStyle = { fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border-t border-sidebar-border pt-2 rounded-none'
                aria-label='Open user menu'
              >
                <Avatar className='h-7 w-7 rounded-sm'>
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback
                    className='rounded-sm text-[0.6875rem] font-semibold tracking-wide'
                    style={{ background: 'var(--violet-surface)', color: 'var(--violet-deep)' }}
                  >
                    SR
                  </AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-start leading-tight'>
                  <span className='truncate font-semibold' style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}>
                    {user.name}
                  </span>
                  <span className='truncate text-muted-foreground' style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.8125rem' }}>
                    {user.email}
                  </span>
                </div>
                <ChevronsUpDown className='ms-auto size-4 opacity-40' aria-hidden='true' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-md'
              side={isMobile ? 'bottom' : 'right'}
              align='end'
              sideOffset={4}
            >
              {/* User identity header */}
              <DropdownMenuLabel className='p-0 font-normal'>
                <button
                  type='button'
                  onClick={() => openSheet('profile')}
                  className='flex w-full items-center gap-2 px-2 py-2 text-start rounded-sm hover:bg-[var(--violet-surface)] transition-colors'
                  aria-label='View profile'
                >
                  <Avatar className='h-7 w-7 rounded-sm'>
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className='rounded-sm text-[0.6875rem] font-semibold'
                      style={{ background: 'var(--violet-surface)', color: 'var(--violet-deep)' }}>
                      SR
                    </AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-start leading-tight'>
                    <span className='truncate font-semibold' style={menuItemStyle}>{user.name}</span>
                    <span className='truncate text-muted-foreground' style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.8125rem' }}>{user.email}</span>
                  </div>
                </button>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {/* Upgrade to Pro */}
              <DropdownMenuGroup>
                <DropdownMenuItem
                  style={menuItemStyle}
                  className='cursor-pointer'
                  onSelect={() => setUpgradeOpen(true)}
                  aria-label='Upgrade to Pro'
                >
                  <Sparkles className='opacity-70' style={{ color: 'var(--violet-fg)' }} aria-hidden='true' />
                  <span style={{ color: 'var(--violet-deep)', fontWeight: 500 }}>Upgrade to Pro</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* Account / Billing / Notifications */}
              <DropdownMenuGroup>
                <DropdownMenuItem
                  style={menuItemStyle}
                  className='cursor-pointer'
                  onSelect={() => openSheet('account')}
                  aria-label='Open account settings'
                >
                  <BadgeCheck className='opacity-60' aria-hidden='true' />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem
                  style={menuItemStyle}
                  className='cursor-pointer'
                  onSelect={() => openSheet('billing')}
                  aria-label='Open billing'
                >
                  <CreditCard className='opacity-60' aria-hidden='true' />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem
                  style={menuItemStyle}
                  className='cursor-pointer'
                  onSelect={() => openSheet('notifications')}
                  aria-label='Open notifications'
                >
                  <Bell className='opacity-60' aria-hidden='true' />
                  Notifications
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* Sign out */}
              <DropdownMenuItem
                variant='destructive'
                style={menuItemStyle}
                className='cursor-pointer'
                onSelect={handleSignOut}
                aria-label='Sign out'
              >
                <LogOut className='opacity-60' aria-hidden='true' />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Portals — rendered outside the sidebar tree */}
      <UserSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        initialTab={sheetTab}
        onUpgrade={() => setUpgradeOpen(true)}
        user={user}
      />

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
      />
    </>
  )
}
