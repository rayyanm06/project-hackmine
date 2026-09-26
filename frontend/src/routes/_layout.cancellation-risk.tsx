import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { api, BookingWithRoomResponse } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Info } from 'lucide-react'
import { format } from 'date-fns'

export const Route = createFileRoute('/_layout/cancellation-risk')({
  component: CancellationRisk,
})

function CancellationRisk() {
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<BookingWithRoomResponse[]>([])
  
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.getAllBookings()
        // Sort descending by created_at (or id) to show recent first
        res.sort((a, b) => b.id - a.id)
        setBookings(res)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [])

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Cancellation Risk Dashboard</h2>
      </div>
      
      <div className="flex items-center gap-2 p-3 bg-indigo-50 text-indigo-800 border border-indigo-100 rounded-md text-sm">
        <Info className="h-4 w-4" />
        <strong>AUTOMATED MODEL</strong> — Cancellation Risk is automatically predicted for new bookings. This dashboard shows the risk levels of recent reservations.
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-muted-foreground">Loading bookings...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookings.filter(b => b.status === 'confirmed').map(booking => {
              const risk = booking.cancellation_risk;
              const hasRisk = !!risk;
              const riskColor = risk?.risk_level === 'High' ? 'text-red-700 bg-red-100 border-red-200' :
                                risk?.risk_level === 'Medium' ? 'text-amber-700 bg-amber-100 border-amber-200' :
                                'text-green-700 bg-green-100 border-green-200';
                                
              return (
                <Card key={booking.id} className="overflow-hidden">
                  <CardHeader className="pb-2 bg-slate-50 border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Room {booking.room.room_number}</CardTitle>
                        <CardDescription>{booking.room.room_type}</CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-white">ID: #{booking.id}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="text-sm">
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Dates</span>
                        <span className="font-medium">{format(new Date(booking.check_in_date), 'dd MMM yyyy')} - {format(new Date(booking.check_out_date), 'dd MMM yyyy')}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Guests</span>
                        <span className="font-medium">{booking.adults} Adults, {booking.children} Children</span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Total Price</span>
                        <span className="font-medium">₹{booking.total_price}</span>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <div className="text-sm font-semibold mb-2 text-slate-700">Automated Risk Assessment</div>
                      {hasRisk ? (
                        <div className={`p-3 rounded-md border flex items-center justify-between ${riskColor}`}>
                          <div className="font-bold">{risk.risk_level} Risk</div>
                          <div className="text-lg font-black">{Math.round(risk.probability * 100 * 10) / 10}%</div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-md border bg-slate-100 text-slate-500 text-sm italic text-center">
                          Risk unavailable
                          <div className="text-[10px] mt-1">Genuinely insufficient information for this legacy booking.</div>
                        </div>
                      )}
                      {hasRisk && (
                         <div className="flex flex-col text-[10px] text-muted-foreground mt-2 text-right">
                           {risk.is_backfilled && (
                             <span className="italic text-slate-400 mb-1">Backfilled from available booking data</span>
                           )}
                           <span>Model: {risk.model}</span>
                         </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            
            {bookings.length === 0 && (
              <div className="col-span-full text-center p-8 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                No recent bookings found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
