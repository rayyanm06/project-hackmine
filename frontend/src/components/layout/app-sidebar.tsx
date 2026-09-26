import { useState, useEffect } from 'react'
import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { AuthService, type AuthUser } from '@/lib/auth'
import { useRoleStore } from '@/stores/role-store'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { currentRole } = useRoleStore()
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    return AuthService.getCurrentUser()
  })

  useEffect(() => {
    const unsub = AuthService.subscribeToAuthState((user) => {
      setCurrentUser(user)
    })
    return () => unsub()
  }, [])

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Operations Lead'
  const email = currentUser?.email || 'operations@smartresort360.com'
  const avatar = currentUser?.photoURL || '/avatars/shadcn.jpg'

  const user = {
    name: displayName,
    email: email,
    avatar: avatar,
    role: currentRole || 'Staff',
  }

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
