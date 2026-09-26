import { useState, useEffect, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BrainCircuit, Filter } from 'lucide-react'
import { api, type ComplaintResponse } from '@/lib/api'

export const Route = createFileRoute('/_layout/complaints')({
  component: ComplaintsPage,
})

// ── Types matching original mock-complaints shape ────────────────────────────
type Priority = 'low' | 'medium' | 'high' | 'critical'
type ComplaintStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

interface Complaint {
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
  sentiment: string
  confidence: number
  explanation: string
  createdAt: string
}

// ── Map API response to UI Complaint shape ───────────────────────────────────
function mapApiToComplaint(c: ComplaintResponse & { classification?: any; assignment?: any }): Complaint {
  return {
    id: `CMP-${c.id}`,
    guestName: `Guest ${c.guest_id}`,
    roomNumber: c.room_number?.toString() ?? 'N/A',
    text: c.text,
    language: c.language,
    category: c.classification?.department ?? 'Pending',
    subcategory: c.classification?.issue_type,
    priority: (c.classification?.priority?.toLowerCase() as Priority) ?? 'medium',
    status: (c.status === 'submitted' || c.status === 'classified' || c.status === 'open')
      ? 'open'
      : c.status === 'in_progress'
      ? 'in_progress'
      : c.status === 'resolved'
      ? 'resolved'
      : 'closed',
    assignedTo: c.assignment?.staff_name || undefined,
    sentiment: 'neutral',
    confidence: c.classification?.confidence ?? 0,
    explanation: c.classification?.reasoning ?? 'No AI explanation available.',
    createdAt: c.created_at,
  }
}

// ── Color helpers (original style) ──────────────────────────────────────────
function getPriorityColor(p: Priority): string {
  switch (p) {
    case 'critical': return 'bg-red-100 text-red-800'
    case 'high':     return 'bg-orange-100 text-orange-800'
    case 'medium':   return 'bg-blue-100 text-blue-800'
    case 'low':      return 'bg-slate-100 text-slate-800'
    default:         return 'bg-slate-100 text-slate-800'
  }
}

function getStatusColor(s: ComplaintStatus): string {
  switch (s) {
    case 'open':        return 'bg-yellow-100 text-yellow-800'
    case 'in_progress': return 'bg-blue-100 text-blue-800'
    case 'resolved':    return 'bg-green-100 text-green-800'
    case 'closed':      return 'bg-slate-100 text-slate-800'
    default:            return 'bg-slate-100 text-slate-800'
  }
}

// ── Main page component ──────────────────────────────────────────────────────
function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)

  // Form state
  const [text,       setText]       = useState('')
  const [lang,       setLang]       = useState('en')
  const [room,       setRoom]       = useState('')
  const [guest,      setGuest]      = useState('')
  const [priority,   setPriority]   = useState<Priority>('medium')
  const [submitting, setSubmitting] = useState(false)

  // AI result from last submission
  const [lastResult, setLastResult] = useState<any>(null)

  const loadComplaints = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.getComplaints()
      setComplaints(data.map(mapApiToComplaint).reverse())
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadComplaints()
  }, [loadComplaints])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    try {
      const response = await api.createComplaint({
        guest_id:    parseInt(guest) || 1,
        room_number: parseInt(room)  || 0,
        text:        text.trim(),
        language:    lang,
      })
      const newComplaint = mapApiToComplaint(response)
      setComplaints(prev => [newComplaint, ...prev])
      setLastResult(response)
      setText('')
      setRoom('')
      setGuest('')
      setPriority('medium')
      setLang('en')
      alert(`Complaint submitted (Task ID: ${response.task_id ?? 'N/A'})`)
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Complaint Management</h1>
        <p className="text-muted-foreground">AI-powered complaint intake, classification, and routing.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">

        {/* ── Left: Submit form + AI card ───────────────── */}
        <div className="md:col-span-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Submit Complaint</CardTitle>
              <CardDescription>Enter details manually or via voice</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Complaint Text</label>
                  <Textarea
                    placeholder="Describe the issue..."
                    value={text}
                    onChange={e => setText(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Language</label>
                  <Select value={lang} onValueChange={setLang}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="mr">Marathi</SelectItem>
                      <SelectItem value="ta">Tamil</SelectItem>
                      <SelectItem value="hinglish">Hinglish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Room (Optional)</label>
                    <Input
                      placeholder="e.g. 204"
                      value={room}
                      onChange={e => setRoom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Guest (Optional)</label>
                    <Input
                      placeholder="Name"
                      value={guest}
                      onChange={e => setGuest(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={priority} onValueChange={v => setPriority(v as Priority)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit Complaint'}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* AI Classification card */}
          <Card className="border-indigo-100 bg-indigo-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-indigo-900 text-base">
                <BrainCircuit className="w-4 h-4 mr-2" />
                AI Classification — {lastResult ? 'Latest Result' : 'Demo'}
              </CardTitle>
              <CardDescription>
                {lastResult ? `Task ID: ${lastResult.task_id ?? 'N/A'}` : 'Live preview of LLM output for the last submission.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-muted-foreground text-xs font-medium">Category</div>
                  <div className="font-medium">{lastResult?.classification?.department ?? 'Maintenance'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs font-medium">Subcategory</div>
                  <div className="font-medium">{lastResult?.classification?.issue_type ?? 'Plumbing'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs font-medium">Priority</div>
                  <div>
                    <Badge
                      variant="outline"
                      className={getPriorityColor((lastResult?.classification?.priority?.toLowerCase() as Priority) ?? 'medium')}
                    >
                      {lastResult?.classification?.priority ?? 'Medium'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs font-medium">Sentiment</div>
                  <div>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Negative</Badge>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs font-medium">Required Skill</div>
                  <div className="font-medium">{lastResult?.classification?.required_skill ?? 'Plumbing'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs font-medium">Confidence</div>
                  <div className="font-medium">
                    {Math.round((lastResult?.classification?.confidence ?? 0.95) * 100)}%
                  </div>
                </div>
                {lastResult?.assignment?.staff_name && (
                  <div className="col-span-2">
                    <div className="text-muted-foreground text-xs font-medium">Assigned To</div>
                    <div className="font-medium">{lastResult.assignment.staff_name}</div>
                  </div>
                )}
              </div>
              <div className="pt-2 border-t border-indigo-100">
                <div className="text-muted-foreground text-xs font-medium mb-1">Explanation</div>
                <p className="text-xs text-indigo-900/80">
                  {lastResult?.classification?.reasoning
                    ?? 'User mentioned "pani tapak raha hai" which translates to water leaking. This falls under Maintenance > Plumbing.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Complaint list ──────────────────────── */}
        <div className="md:col-span-8 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Complaint List</CardTitle>
                <CardDescription>All recorded complaints</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadComplaints} disabled={loading}>
                <Filter className="w-4 h-4 mr-2" />
                {loading ? 'Loading…' : 'Refresh'}
              </Button>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="text-red-600 text-sm mb-3">
                  {error}{' '}
                  <button onClick={loadComplaints} className="underline">Retry</button>
                </div>
              )}
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium">ID</th>
                      <th className="p-3 text-left font-medium">Guest/Room</th>
                      <th className="p-3 text-left font-medium">Complaint</th>
                      <th className="p-3 text-left font-medium">Category</th>
                      <th className="p-3 text-left font-medium">Priority</th>
                      <th className="p-3 text-left font-medium">Status</th>
                      <th className="p-3 text-left font-medium">Assigned</th>
                      <th className="p-3 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-muted-foreground">
                          Loading complaints…
                        </td>
                      </tr>
                    ) : complaints.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-muted-foreground">
                          No complaints yet.
                        </td>
                      </tr>
                    ) : (
                      complaints.map(c => (
                        <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-3 font-medium">{c.id}</td>
                          <td className="p-3">
                            <div className="font-medium">{c.guestName || 'Unknown'}</div>
                            <div className="text-xs text-muted-foreground">Rm {c.roomNumber || 'N/A'}</div>
                          </td>
                          <td className="p-3 max-w-[200px]">
                            <div className="truncate" title={c.text}>{c.text}</div>
                            <div className="text-xs text-muted-foreground">{c.language}</div>
                          </td>
                          <td className="p-3">
                            <div>{c.category}</div>
                            <div className="text-xs text-muted-foreground">{c.subcategory}</div>
                          </td>
                          <td className="p-3">
                            <Badge className={getPriorityColor(c.priority)}>{c.priority}</Badge>
                          </td>
                          <td className="p-3">
                            <Badge className={getStatusColor(c.status)}>
                              {c.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">{c.assignedTo || 'Unassigned'}</td>
                          <td className="p-3">
                            <Button variant="ghost" size="sm">View</Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
