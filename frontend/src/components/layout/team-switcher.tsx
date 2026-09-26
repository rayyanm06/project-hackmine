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
              {/* Brand mark */}
              <div className='flex aspect-square size-8 items-center justify-center rounded-xl border border-[#2D8CFF]/30 bg-[#2D8CFF]/10 text-[#2D8CFF] shrink-0'>
                <UserCircle2 className='size-4' />
              </div>
              <div className='grid flex-1 text-start leading-tight'>
                <span className='truncate font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight'>
                  Smart Resort 360
                </span>
                <span className='truncate text-[11px] text-slate-500 font-medium'>
                  {t('role.viewAs')}: <span className="text-[#2D8CFF] font-semibold">{currentRole}</span>
                </span>
              </div>
              <ChevronsUpDown className='ms-auto size-4 opacity-50 group-data-[state=open]:opacity-100 transition-opacity' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-2xl p-1.5 shadow-xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md'
            align='start'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className='text-[10px] font-bold tracking-wider uppercase text-slate-400 px-2.5 py-1.5'>
              {t('role.selectRole')}
            </DropdownMenuLabel>
            {roles.map((role) => (
              <DropdownMenuItem
                key={role}
                onClick={() => setRole(role)}
                className={`gap-2.5 px-2.5 py-2 cursor-pointer rounded-xl text-xs font-semibold ${
                  currentRole === role ? 'bg-[#2D8CFF]/10 text-[#2D8CFF]' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className='flex size-6 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'>
                  <UserCircle2 className='size-3.5 shrink-0 text-[#2D8CFF]' />
                </div>
                <span>{role}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
