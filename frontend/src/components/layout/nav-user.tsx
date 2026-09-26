import { useState } from 'react'
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
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
    role?: string
  }
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile, setOpen, setOpenMobile } = useSidebar()

  // Sheet / modal state
  const [sheetOpen,     setSheetOpen]     = useState(false)
  const [sheetTab,      setSheetTab]      = useState<UserSheetTab>('profile')
  const [upgradeOpen,   setUpgradeOpen]   = useState(false)

  function openSheet(tab: UserSheetTab) {
    setSheetTab(tab)
    setSheetOpen(true)
    setOpen(false)
    setOpenMobile(false)
  }

  async function handleSignOut() {
    await AuthService.signOut()
    toast.success('Signed out', {
      description: 'You have been signed out of Smart Resort 360.',
    })
    window.location.href = '/'
  }

  const initial = (user.name?.charAt(0) || 'U').toUpperCase()

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border-t border-sidebar-border pt-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800'
                aria-label='Open user menu'
              >
                <Avatar className='h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700'>
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className='rounded-full text-xs font-bold bg-[#2D8CFF] text-white'>
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-start leading-tight'>
                  <span className='truncate font-bold text-xs text-slate-800 dark:text-slate-100'>
                    {user.name}
                  </span>
                  <span className='truncate text-[11px] text-slate-500 font-medium'>
                    {user.role || 'Staff'} • {user.email}
                  </span>
                </div>
                <ChevronsUpDown className='ms-auto size-4 opacity-40' aria-hidden='true' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-2xl p-1.5 shadow-xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md'
              side={isMobile ? 'bottom' : 'right'}
              align='end'
              sideOffset={4}
            >
              {/* User identity header */}
              <DropdownMenuLabel className='p-0 font-normal'>
                <button
                  type='button'
                  onClick={() => openSheet('profile')}
                  className='flex w-full items-center gap-2.5 px-2.5 py-2 text-start rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
                  aria-label='View profile'
                >
                  <Avatar className='h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700'>
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className='rounded-full text-xs font-bold bg-[#2D8CFF] text-white'>
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-start leading-tight'>
                    <span className='truncate font-bold text-xs text-slate-900 dark:text-slate-100'>{user.name}</span>
                    <span className='truncate text-[11px] text-slate-500'>{user.email}</span>
                  </div>
                </button>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {/* Account / Preferences */}
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className='rounded-xl px-2.5 py-2 cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800'
                  onSelect={() => openSheet('account')}
                  aria-label='Open account settings'
                >
                  <BadgeCheck className='opacity-70 size-4 text-[#2D8CFF]' aria-hidden='true' />
                  <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className='rounded-xl px-2.5 py-2 cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800'
                  onSelect={() => openSheet('billing')}
                  aria-label='Open billing'
                >
                  <CreditCard className='opacity-70 size-4 text-slate-500' aria-hidden='true' />
                  <span>Billing</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className='rounded-xl px-2.5 py-2 cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800'
                  onSelect={() => openSheet('notifications')}
                  aria-label='Open notifications'
                >
                  <Bell className='opacity-70 size-4 text-slate-500' aria-hidden='true' />
                  <span>Notifications</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* Sign out */}
              <DropdownMenuItem
                variant='destructive'
                className='rounded-xl px-2.5 py-2 cursor-pointer text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                onSelect={handleSignOut}
                aria-label='Sign out'
              >
                <LogOut className='opacity-70 size-4 mr-2' aria-hidden='true' />
                <span>Sign out</span>
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
