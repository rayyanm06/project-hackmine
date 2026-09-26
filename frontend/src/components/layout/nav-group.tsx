import { type ReactNode } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '../ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { useI18n } from '@/i18n'
import {
  type NavCollapsible,
  type NavItem,
  type NavLink,
  type NavGroup as NavGroupProps,
} from './types'

export function NavGroup({ title, titleKey, items }: NavGroupProps) {
  const { state, isMobile } = useSidebar()
  const { t } = useI18n()
  const href = useLocation({ select: (location) => location.href })
  const groupLabel = titleKey ? t(titleKey) : title
  return (
    <SidebarGroup>
      {/* Refined group label — small, spaced, restrained */}
      <SidebarGroupLabel
        className='text-[0.6875rem] font-bold tracking-[0.14em] uppercase text-slate-400 dark:text-slate-500 px-3 mb-1'
      >
        {groupLabel}
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const key = `${item.title}-${item.url}`

          if (!item.items)
            return <SidebarMenuLink key={key} item={item} href={href} />

          if (state === 'collapsed' && !isMobile)
            return (
              <SidebarMenuCollapsedDropdown key={key} item={item} href={href} />
            )

          return <SidebarMenuCollapsible key={key} item={item} href={href} />
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

function NavBadge({ children }: { children: ReactNode }) {
  return (
    <Badge className='rounded-full px-1.5 py-0 text-[10px] font-bold tracking-wide bg-[#2D8CFF]/15 text-[#2D8CFF] border border-[#2D8CFF]/30'>
      {children}
    </Badge>
  )
}

function SidebarMenuLink({ item, href }: { item: NavLink; href: string }) {
  const { setOpenMobile, setOpen } = useSidebar()
  const { t } = useI18n()
  const isActive = checkIsActive(href, item)
  const label = item.titleKey ? t(item.titleKey) : item.title
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={label}
        className={
          isActive
            ? 'border-l-2 border-[#2D8CFF] bg-[#2D8CFF]/10 text-[#2D8CFF] pl-[calc(0.75rem-2px)] font-bold rounded-r-xl'
            : 'border-l-2 border-transparent pl-[calc(0.75rem-2px)] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70 font-medium rounded-r-xl'
        }
      >
        <Link to={item.url} onClick={() => { setOpenMobile(false); setOpen(false); }}>
          {item.icon && <item.icon className={isActive ? 'opacity-100 text-[#2D8CFF]' : 'opacity-70'} />}
          <span>{label}</span>
          {item.badge && <NavBadge>{item.badge}</NavBadge>}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function SidebarMenuCollapsible({
  item,
  href,
}: {
  item: NavCollapsible
  href: string
}) {
  const { setOpenMobile, setOpen } = useSidebar()
  const { t } = useI18n()
  const label = item.titleKey ? t(item.titleKey) : item.title
  return (
    <Collapsible
      asChild
      defaultOpen={checkIsActive(href, item, true)}
      className='group/collapsible'
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={label}
            className='border-l-2 border-transparent pl-[calc(0.75rem-2px)] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70 font-medium rounded-r-xl'
          >
            {item.icon && <item.icon className='opacity-70' />}
            <span>{label}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className='ms-auto size-3.5 opacity-50 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:rotate-180' />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className='CollapsibleContent'>
          <SidebarMenuSub>
            {item.items.map((subItem) => {
              const subLabel = subItem.titleKey ? t(subItem.titleKey) : subItem.title
              return (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={checkIsActive(href, subItem)}
                    className='rounded-lg text-xs'
                  >
                    <Link to={subItem.url} onClick={() => { setOpenMobile(false); setOpen(false); }}>
                      {subItem.icon && <subItem.icon className='opacity-60' />}
                      <span>{subLabel}</span>
                      {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

function SidebarMenuCollapsedDropdown({
  item,
  href,
}: {
  item: NavCollapsible
  href: string
}) {
  const { t } = useI18n()
  const { setOpenMobile, setOpen } = useSidebar()
  const label = item.titleKey ? t(item.titleKey) : item.title
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={label}
            isActive={checkIsActive(href, item)}
            className='border-l-2 border-transparent pl-[calc(0.75rem-2px)]'
          >
            {item.icon && <item.icon className='opacity-70' />}
            <span>{label}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className='ms-auto size-3.5 opacity-50 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side='right' align='start' sideOffset={4} className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          <DropdownMenuLabel className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {label} {item.badge ? `(${item.badge})` : ''}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.items.map((sub) => {
            const subLabel = sub.titleKey ? t(sub.titleKey) : sub.title
            return (
              <DropdownMenuItem key={`${sub.title}-${sub.url}`} asChild>
                <Link
                  to={sub.url}
                  onClick={() => { setOpenMobile(false); setOpen(false); }}
                  className={`rounded-lg text-xs font-semibold ${checkIsActive(href, sub) ? 'bg-[#2D8CFF]/10 text-[#2D8CFF]' : ''}`}
                >
                  {sub.icon && <sub.icon className='opacity-70' />}
                  <span className='max-w-52 text-wrap'>{subLabel}</span>
                  {sub.badge && (
                    <span className='ms-auto text-xs'>{sub.badge}</span>
                  )}
                </Link>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function checkIsActive(href: string, item: NavItem, mainNav = false) {
  return (
    href === item.url ||
    href.split('?')[0] === item.url ||
    !!item?.items?.filter((i) => i.url === href).length ||
    (mainNav &&
      href.split('/')[1] !== '' &&
      href.split('/')[1] === item?.url?.split('/')[1])
  )
}
