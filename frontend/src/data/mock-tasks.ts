export type TaskStatus = 'Created' | 'Assigned' | 'In Progress' | 'Completed' | 'Verified' | 'Closed'

export interface Task {
  id: string
  complaintId?: string
  title: string
  assignedTo: string
  skill: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: TaskStatus
  createdAt: string
  dueAt: string
  slaStatus: 'on_track' | 'at_risk' | 'breached'
  completionNotes?: string
  assignmentScore?: number
}

export const mockTasks: Task[] = [
  {
    id: 'TSK-1021',
    complaintId: 'CMP-2023-001',
    title: 'Fix AC in Room 204',
    assignedTo: 'Rahul Sharma',
    skill: 'AC Repair',
    priority: 'high',
    status: 'In Progress',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    dueAt: new Date(Date.now() + 1000 * 60 * 35).toISOString(),
    slaStatus: 'on_track',
    assignmentScore: 92,
  },
  {
    id: 'TSK-1022',
    complaintId: 'CMP-2023-002',
    title: 'Fix plumbing leak in Room 112',
    assignedTo: 'Arjun Patil',
    skill: 'Plumbing',
    priority: 'medium',
    status: 'Assigned',
    createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    dueAt: new Date(Date.now() + 1000 * 60 * 65).toISOString(),
    slaStatus: 'at_risk',
    assignmentScore: 85,
  },
  {
    id: 'TSK-1023',
    complaintId: 'CMP-2023-003',
    title: 'Deliver extra towels to Room 305',
    assignedTo: 'Priya Nair',
    skill: 'Housekeeping',
    priority: 'low',
    status: 'Completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 115).toISOString(),
    dueAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    slaStatus: 'on_track',
    completionNotes: 'Delivered 2 bath towels as requested.',
    assignmentScore: 98,
  }
]
