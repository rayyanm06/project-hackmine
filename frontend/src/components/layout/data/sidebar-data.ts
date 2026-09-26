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
    name: 'Operations Lead',
    email: 'operations@smartresort360.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Smart Resort 360',
      logo: Hotel,
      plan: 'Command Center',
    },
  ],
  navGroups: [
    {
      title: 'Resort',
      titleKey: 'nav.group.general',
      items: [
        { title: 'Dashboard',           titleKey: 'nav.dashboard',  url: '/',                   icon: LayoutDashboard },
        { title: 'Resort 360',                                      url: '/resort-360',         icon: Gauge },
        { title: 'Booking & Occupancy',                             url: '/booking-occupancy',  icon: LayoutDashboard },
        { title: 'Rooms 360',           titleKey: 'nav.rooms360',   url: '/rooms-360',          icon: Camera },
      ],
    },
    {
      title: 'Operations',
      titleKey: 'nav.group.operations',
      items: [
        { title: 'Tasks',        titleKey: 'nav.tasks',        url: '/tasks',        icon: CheckSquare },
        { title: 'Complaints',   titleKey: 'nav.complaints',   url: '/complaints',   icon: ClipboardList },
        { title: 'Staff',        titleKey: 'nav.staff',        url: '/staff',        icon: Users },
        { title: 'Verification', titleKey: 'nav.verification', url: '/verification', icon: ShieldCheck },
      ],
    },
    {
      title: 'Revenue & Intelligence',
      titleKey: 'nav.group.revenueAI',
      items: [
        { title: 'Pricing Intelligence', titleKey: 'nav.pricing',          url: '/pricing',           icon: LineChart },
        { title: 'Recommendations',     titleKey: 'nav.recommendations',  url: '/recommendations',   icon: Map },
        { title: 'Cancellation Risk',                                      url: '/cancellation-risk', icon: BrainCircuit },
        { title: 'Resort Insights',      titleKey: 'nav.insights',         url: '/insights',          icon: BrainCircuit },
      ],
    },
    {
      title: 'Control',
      titleKey: 'nav.group.other',
      items: [
        { title: 'Audit Trail', titleKey: 'nav.audit',    url: '/audit',    icon: History },
        { title: 'Settings',    titleKey: 'nav.settings', url: '/settings', icon: Settings },
      ],
    },
  ],
}

