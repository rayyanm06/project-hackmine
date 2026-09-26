import { ShieldCheck, UserCircle2 } from 'lucide-react'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useRoleStore } from '@/stores/role-store'
import { useI18n } from '@/i18n'

export function TeamSwitcher() {
  const { currentRole } = useRoleStore()
  const { t } = useI18n()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size='lg'
          className='cursor-default hover:bg-transparent active:bg-transparent group select-none pointer-events-none'
        >
          {/* Brand mark */}
          <div className='flex aspect-square size-8 items-center justify-center rounded-xl border border-[#2D8CFF]/30 bg-[#2D8CFF]/10 text-[#2D8CFF] shrink-0'>
            <UserCircle2 className='size-4' />
          </div>
          <div className='grid flex-1 text-start leading-tight'>
            <span className='truncate font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight'>
              Smart Resort 360
            </span>
            <span className='truncate text-[11px] text-slate-500 font-medium flex items-center gap-1.5'>
              <ShieldCheck className="size-3 text-emerald-500 shrink-0" />
              <span>{t('role.viewAs')}:</span>
              <span className="text-[#2D8CFF] font-semibold">{currentRole}</span>
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
