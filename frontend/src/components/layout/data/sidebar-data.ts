import {
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  Users,
  ShieldCheck,
  Map,
  Camera,
  LineChart,
  BrainCircuit,
  History,
  Settings,
  Hotel,
  Gauge,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Smart Resort User',
    email: 'user@smartresort360.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Smart Resort 360',
      logo: Hotel,
      plan: 'Manager View',
    },
  ],
  navGroups: [
    {
      title: 'General',
      titleKey: 'nav.group.general',
      items: [
        { title: 'Dashboard',  titleKey: 'nav.dashboard',  url: '/',               icon: LayoutDashboard },
        { title: 'Resort 360',                             url: '/resort-360',     icon: Gauge },
      ],
    },
    {
      title: 'Operations',
      titleKey: 'nav.group.operations',
      items: [
        { title: 'Complaints',   titleKey: 'nav.complaints',   url: '/complaints',   icon: ClipboardList },
        { title: 'Tasks',        titleKey: 'nav.tasks',        url: '/tasks',        icon: CheckSquare },
        { title: 'Staff',        titleKey: 'nav.staff',        url: '/staff',        icon: Users },
        { title: 'Verification', titleKey: 'nav.verification', url: '/verification', icon: ShieldCheck },
      ],
    },
    {
      title: 'Guest Experience',
      titleKey: 'nav.group.guestExperience',
      items: [
        { title: 'Recommendations', titleKey: 'nav.recommendations', url: '/recommendations', icon: Map },
        { title: '360° Rooms',      titleKey: 'nav.rooms360',        url: '/rooms-360',       icon: Camera },
      ],
    },
    {
      title: 'Revenue & AI',
      titleKey: 'nav.group.revenueAI',
      items: [
        { title: 'Pricing Intelligence', titleKey: 'nav.pricing',   url: '/pricing',           icon: LineChart },
        { title: 'Cancellation Risk',                               url: '/cancellation-risk', icon: BrainCircuit },
        { title: 'AI Insights',          titleKey: 'nav.insights',  url: '/insights',          icon: BrainCircuit },
        { title: 'Audit Trail',          titleKey: 'nav.audit',     url: '/audit',             icon: History },
      ],
    },
    {
      title: 'Other',
      titleKey: 'nav.group.other',
      items: [
        { title: 'Settings', titleKey: 'nav.settings', url: '/settings', icon: Settings },
      ],
    },
  ],
}
