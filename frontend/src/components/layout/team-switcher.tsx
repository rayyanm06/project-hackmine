import { ChevronsUpDown, UserCircle2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
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
import { useRoleStore, type Role } from '@/stores/role-store'
import { useI18n } from '@/i18n'

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const { currentRole, setRole } = useRoleStore()
  const { t } = useI18n()

  const roles: Role[] = ['Guest', 'Staff', 'Team Head', 'Manager']

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group'
            >
              {/* Brand mark — subtle border square */}
              <div className='flex aspect-square size-8 items-center justify-center rounded border border-sidebar-border bg-sidebar-primary text-sidebar-primary-foreground shrink-0'>
                <UserCircle2 className='size-4' />
              </div>
              <div className='grid flex-1 text-start leading-tight'>
                <span
                  className='truncate font-semibold tracking-tight'
                  style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1rem' }}
                >
                  Smart Resort 360
                </span>
                <span
                  className='truncate text-muted-foreground'
                  style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.8125rem' }}
                >
                  {t('role.viewAs')}: {currentRole}
                </span>
              </div>
              <ChevronsUpDown className='ms-auto size-4 opacity-50 group-data-[state=open]:opacity-100 transition-opacity' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-md'
            align='start'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel
              className='text-[0.75rem] tracking-widest uppercase text-muted-foreground px-2 py-1.5'
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              {t('role.selectRole')}
            </DropdownMenuLabel>
            {roles.map((role) => (
              <DropdownMenuItem
                key={role}
                onClick={() => setRole(role)}
                className='gap-2 p-2 cursor-pointer'
                style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}
              >
                <div className='flex size-6 items-center justify-center rounded-sm border border-border'>
                  <UserCircle2 className='size-3.5 shrink-0' />
                </div>
                {role}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
