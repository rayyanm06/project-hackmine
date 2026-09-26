export interface Staff {
  id: string
  name: string
  role: string
  skills: string[]
  availability: 'available' | 'busy' | 'on_leave'
  currentWorkload: number // 0-100%
  activeTasks: number
  completedTasks: number
}

export const mockStaff: Staff[] = [
  {
    id: 'STF-001',
    name: 'Rahul Sharma',
    role: 'Maintenance',
    skills: ['AC Repair', 'Electrical', 'General'],
    availability: 'busy',
    currentWorkload: 75,
    activeTasks: 1,
    completedTasks: 4,
  },
  {
    id: 'STF-002',
    name: 'Priya Nair',
    role: 'Housekeeping',
    skills: ['Cleaning', 'Room Service', 'Inventory'],
    availability: 'available',
    currentWorkload: 20,
    activeTasks: 0,
    completedTasks: 6,
  },
  {
    id: 'STF-003',
    name: 'Arjun Patil',
    role: 'Maintenance',
    skills: ['Plumbing', 'Carpentry', 'General'],
    availability: 'available',
    currentWorkload: 40,
    activeTasks: 1,
    completedTasks: 3,
  },
  {
    id: 'STF-004',
    name: 'Sneha Menon',
    role: 'Front Desk',
    skills: ['Concierge', 'Check-in', 'Guest Relations'],
    availability: 'on_leave',
    currentWorkload: 0,
    activeTasks: 0,
    completedTasks: 12,
  },
  {
    id: 'STF-005',
    name: 'Vikram Singh',
    role: 'Security',
    skills: ['Patrol', 'First Aid'],
    availability: 'available',
    currentWorkload: 10,
    activeTasks: 0,
    completedTasks: 1,
  }
]
