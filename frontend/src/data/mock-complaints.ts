export type Priority = 'low' | 'medium' | 'high' | 'critical'
export type ComplaintStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface Complaint {
  id: string
  guestName?: string
  roomNumber?: string
  text: string
  language: string
  category: string
  subcategory?: string
  priority: Priority
  status: ComplaintStatus
  assignedTo?: string
  sentiment: 'positive' | 'neutral' | 'negative'
  confidence: number
  explanation: string
  createdAt: string
}

export const mockComplaints: Complaint[] = [
  {
    id: 'CMP-2023-001',
    guestName: 'Arjun Kapoor',
    roomNumber: '204',
    text: 'The AC in my room is not cooling properly and making a weird noise.',
    language: 'English',
    category: 'Maintenance',
    subcategory: 'AC',
    priority: 'high',
    status: 'in_progress',
    assignedTo: 'Rahul Sharma',
    sentiment: 'negative',
    confidence: 0.98,
    explanation: 'Mentions "AC not cooling" and "weird noise", clear maintenance issue.',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'CMP-2023-002',
    guestName: 'Priya Patel',
    roomNumber: '112',
    text: 'pani tapak raha hai bathroom me',
    language: 'Hinglish',
    category: 'Maintenance',
    subcategory: 'Plumbing',
    priority: 'medium',
    status: 'open',
    sentiment: 'negative',
    confidence: 0.95,
    explanation: 'Translates to "water is leaking in the bathroom".',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'CMP-2023-003',
    guestName: 'Sneha Reddy',
    roomNumber: '305',
    text: 'Need 2 extra towels please.',
    language: 'English',
    category: 'Housekeeping',
    subcategory: 'Amenities',
    priority: 'low',
    status: 'resolved',
    assignedTo: 'Priya Nair',
    sentiment: 'neutral',
    confidence: 0.99,
    explanation: 'Simple request for towels.',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  }
]
