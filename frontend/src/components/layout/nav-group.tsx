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
        className='text-[0.6875rem] font-semibold tracking-[0.12em] uppercase text-muted-foreground/70 px-3 mb-0.5'
        style={{ fontFamily: 'var(--font-cormorant)' }}
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
    <Badge className='rounded-sm px-1 py-0 text-[0.6875rem] font-semibold tracking-wide'>
      {children}
    </Badge>
  )
}

function SidebarMenuLink({ item, href }: { item: NavLink; href: string }) {
  const { setOpenMobile } = useSidebar()
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
            ? 'border-l-2 border-[var(--violet-deep)] bg-[var(--violet-surface)] text-[var(--violet-deep)] pl-[calc(0.75rem-2px)] font-medium'
            : 'border-l-2 border-transparent pl-[calc(0.75rem-2px)] text-sidebar-foreground/80 hover:text-sidebar-foreground'
        }
        style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}
      >
        <Link to={item.url} onClick={() => setOpenMobile(false)}>
          {item.icon && <item.icon className='opacity-70' />}
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
  const { setOpenMobile } = useSidebar()
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
            className='border-l-2 border-transparent pl-[calc(0.75rem-2px)] text-sidebar-foreground/80 hover:text-sidebar-foreground'
            style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}
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
                    style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9rem' }}
                  >
                    <Link to={subItem.url} onClick={() => setOpenMobile(false)}>
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
  const label = item.titleKey ? t(item.titleKey) : item.title
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={label}
            isActive={checkIsActive(href, item)}
            className='border-l-2 border-transparent pl-[calc(0.75rem-2px)]'
            style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}
          >
            {item.icon && <item.icon className='opacity-70' />}
            <span>{label}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className='ms-auto size-3.5 opacity-50 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side='right' align='start' sideOffset={4}>
          <DropdownMenuLabel
            style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.875rem' }}
          >
            {label} {item.badge ? `(${item.badge})` : ''}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.items.map((sub) => {
            const subLabel = sub.titleKey ? t(sub.titleKey) : sub.title
            return (
              <DropdownMenuItem key={`${sub.title}-${sub.url}`} asChild>
                <Link
                  to={sub.url}
                  className={`${checkIsActive(href, sub) ? 'bg-secondary' : ''}`}
                  style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem' }}
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
