import { useState, useEffect, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { User, Wrench, CheckCircle } from 'lucide-react'
import { api, type StaffMemberResponse } from '@/lib/api'

export const Route = createFileRoute('/_layout/staff')({
  component: StaffPage,
})

function StaffPage() {
  const [staff, setStaff] = useState<StaffMemberResponse[]>([])
  const [loading, setLoading] = useState(true)

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.getStaff()
      setStaff(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStaff()
  }, [loadStaff])

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
        <p className="text-muted-foreground">Monitor availability, workload, and skills for AI assignments.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-muted-foreground">Loading staff...</p>
        ) : (
          staff.map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div className="flex gap-3">
                  <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{s.name}</CardTitle>
                    <CardDescription>{s.department}</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className={s.available ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                  {s.available ? 'Available' : 'Busy'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center"><Wrench className="h-3 w-3 mr-1" /> Skills</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {s.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-2 text-sm text-center">
                  <div className="bg-muted rounded p-2">
                    <div className="text-muted-foreground text-xs">Active Tasks</div>
                    <div className="font-bold text-lg">{s.active_task_count}</div>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <div className="text-muted-foreground text-xs flex items-center justify-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Shift
                    </div>
                    <div className="font-bold text-lg">{s.shift_start}</div>
                  </div>
                </div>

                <div className="pt-2 border-t flex justify-between items-center text-sm">
                  <span className="font-medium">Force Available</span>
                  <Switch checked={s.available} disabled />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
