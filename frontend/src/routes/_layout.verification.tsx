import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CheckCircle2, XCircle, Clock, Camera } from 'lucide-react'
import { api, type TaskResponse } from '@/lib/api'

export const Route = createFileRoute('/_layout/verification')({
  component: VerificationPage,
})

// ── Types matching original mock-tasks shape ─────────────────────────────────
interface VerifTask {
  id: string
  title: string
  assignedTo: string
  completionNotes?: string
  completionProofPath?: string
  _rawId: number
}

// ── Map API response to verification task ────────────────────────────────────
function mapApiToVerifTask(tData: TaskResponse): VerifTask {
  const latestAssignment =
    tData.assignments && tData.assignments.length > 0
      ? tData.assignments[tData.assignments.length - 1]
      : null

  return {
    id:              `TSK-${tData.id}`,
    title:           tData.issue_type
                       ? `${tData.issue_type} - ${tData.location ?? 'N/A'}`
                       : `Issue in ${tData.location ?? 'N/A'}`,
    assignedTo:      latestAssignment?.staff_name ?? 'Unassigned',
    completionNotes: tData.completion_proofs && tData.completion_proofs.length > 0
                       ? 'Completion proof provided.'
                       : undefined,
    completionProofPath: tData.completion_proofs && tData.completion_proofs.length > 0
                           ? tData.completion_proofs[tData.completion_proofs.length - 1].photo_path
                           : undefined,
    _rawId:          tData.id,
  }
}

// ── Page component ───────────────────────────────────────────────────────────
function VerificationPage() {
  const [queue,   setQueue]   = useState<VerifTask[]>([])
  const [loading, setLoading] = useState(true)

  async function loadTasks() {
    try {
      setLoading(true)
      const data = await api.getTasks()
      setQueue(data.filter(t => t.status === 'completed').map(mapApiToVerifTask))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  async function handleVerify(task: VerifTask) {
    try {
      await api.updateTaskStatus(task._rawId, 'verified')
      setQueue(prev => prev.filter(t => t.id !== task.id))
      alert(`${task.id} verified successfully.`)
    } catch (e: any) {
      alert('Failed to verify: ' + e.message)
    }
  }

  if (loading) {
    return (
      <div className="p-6 min-h-screen">
        <p className="text-muted-foreground">Loading tasks…</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Verification Queue</h1>
        <p className="text-muted-foreground">Manager review for completed tasks.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {queue.length === 0 ? (
          <div className="col-span-full p-8 text-center border rounded-lg bg-muted/50 border-dashed">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground font-medium">
              All caught up! No tasks waiting for verification.
            </p>
          </div>
        ) : (
          queue.map(task => (
            <Card key={task.id} className="border-indigo-100">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
                    Verification Pending
                  </Badge>
                  <span className="text-xs text-muted-foreground">{task.id}</span>
                </div>
                <CardTitle className="text-lg mt-2">{task.title}</CardTitle>
                <CardDescription>Assigned to: {task.assignedTo}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="bg-muted p-3 rounded-md space-y-2">
                  <div className="font-medium border-b pb-1">Completion Notes:</div>
                  <p className="italic text-muted-foreground">
                    "{task.completionNotes || 'No notes provided.'}"
                  </p>
                </div>

                <div className="border-2 border-dashed rounded-md h-32 flex flex-col items-center justify-center text-muted-foreground bg-slate-50 overflow-hidden relative">
                  {task.completionProofPath ? (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}/${task.completionProofPath}`}
                      alt="Completion Proof"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <Camera className="h-6 w-6 mb-1 opacity-50" />
                      <span className="text-xs">
                        {task.completionNotes ? 'Photo Evidence Attached' : 'No Photo Evidence'}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center text-xs text-muted-foreground pt-2">
                  <Clock className="h-3 w-3 mr-1" /> Pending review
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 border-t pt-4">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleVerify(task)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Verify
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700">
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reject Work: {task.id}</DialogTitle>
                      <DialogDescription>
                        Send this task back to {task.assignedTo} for rework.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Reason for rejection</label>
                        <Textarea placeholder="Please specify what needs to be fixed..." />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline">Cancel</Button>
                      <Button
                        variant="destructive"
                        onClick={() => alert('Rejection not supported in current phase')}
                      >
                        Confirm Rejection
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
