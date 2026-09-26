import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api, RoomResponse, BookingWithRoomResponse } from '@/lib/api'
import { format, addDays, isBefore, isSameDay } from 'date-fns'

export const Route = createFileRoute('/_layout/booking-occupancy')({
  component: BookingOccupancyPage,
})

const roomImages: Record<string, string> = {
  'Normal': '/images/rooms/normal.jpg',
  'Deluxe': '/images/rooms/normal.jpg',
  'Duplex': '/images/rooms/family.jpg',
  'Luxury': '/images/rooms/suite.jpg',
  'Suite': '/images/rooms/suite.jpg',
  'Family': '/images/rooms/family.jpg'
}

function BookingOccupancyPage() {
  const [rooms, setRooms] = useState<RoomResponse[]>([])
  const [bookings, setBookings] = useState<BookingWithRoomResponse[]>([])
  const [loading, setLoading] = useState(true)

  // Detail Modal State
  const [selectedRoom, setSelectedRoom] = useState<RoomResponse | null>(null)
  
  // Booking Form State
  const [checkIn, setCheckIn] = useState<Date>(new Date())
  const [checkOut, setCheckOut] = useState<Date>(addDays(new Date(), 1))
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [extraBedSelected, setExtraBedSelected] = useState(false)
  const [guestId] = useState(1)
  
  // ML Fields State
  const [guestCountry, setGuestCountry] = useState("PRT")
  const [bookingChannel, setBookingChannel] = useState("Website")
  const [customerType, setCustomerType] = useState("Transient")
  const [depositType, setDepositType] = useState("No Deposit")
  const [mealPlan, setMealPlan] = useState("Breakfast")
  const [specialRequests, setSpecialRequests] = useState<string[]>([])
  
  const [isChecking, setIsChecking] = useState(false)
  const [availabilityResult, setAvailabilityResult] = useState<'unchecked' | 'available' | 'unavailable' | 'error'>('unchecked')
  const [bookingSuccessData, setBookingSuccessData] = useState<any>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [roomsData, bookingsData] = await Promise.all([
        api.getRooms(),
        api.getAllBookings()
      ])
      setRooms(roomsData)
      setBookings(bookingsData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Reset availability when dates or room changes
  useEffect(() => {
    setAvailabilityResult('unchecked')
    setBookingSuccessData(null)
    setExtraBedSelected(false)
  }, [checkIn, checkOut, selectedRoom])

  // Handle Check-In Change
  const handleCheckInChange = (date: Date | undefined) => {
    if (!date) return
    setCheckIn(date)
    if (isBefore(checkOut, date) || isSameDay(date, checkOut)) {
      setCheckOut(addDays(date, 1))
    }
  }

  const checkAvailability = async () => {
    if (!checkIn || !checkOut || !selectedRoom) return
    setIsChecking(true)
    try {
      const formattedCheckIn = format(checkIn, 'yyyy-MM-dd')
      const formattedCheckOut = format(checkOut, 'yyyy-MM-dd')
      const availableRooms = await api.getAvailableRooms(formattedCheckIn, formattedCheckOut)
      const isAvail = availableRooms.some(r => r.id === selectedRoom.id)
      setAvailabilityResult(isAvail ? 'available' : 'unavailable')
    } catch (e) {
      console.error(e)
      setAvailabilityResult('error')
    } finally {
      setIsChecking(false)
    }
  }

  const handleCreateBooking = async () => {
    if (!selectedRoom || availabilityResult !== 'available') return
    try {
      const formattedCheckIn = format(checkIn, 'yyyy-MM-dd')
      const formattedCheckOut = format(checkOut, 'yyyy-MM-dd')
      
      const res = await api.createBooking({
        room_id: selectedRoom.id,
        guest_id: guestId,
        check_in_date: formattedCheckIn,
        check_out_date: formattedCheckOut,
        adults: adults,
        children: children,
        extra_beds_requested: extraBedSelected ? 1 : 0,
        guest_country: guestCountry,
        booking_channel: bookingChannel,
        customer_type: customerType,
        deposit_type: depositType,
        meal_plan: mealPlan,
        special_requests: specialRequests
      })
      
      setBookingSuccessData({
        id: res.id,
        room: selectedRoom.room_number,
        checkIn: formattedCheckIn,
        checkOut: formattedCheckOut,
        total: res.total_price,
        cancellation_risk: res.cancellation_risk
      })
      loadData()
    } catch (e: any) {
      alert(e.message || "Failed to create booking")
    }
  }

  const handleCloseModal = (open: boolean) => {
    if (!open) {
      setSelectedRoom(null)
      setBookingSuccessData(null)
      setAvailabilityResult('unchecked')
    }
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  
  // Compute active bookings today
  const activeBookingsToday = useMemo(() => {
    return bookings.filter(b => b.status === 'confirmed' && b.check_in_date <= todayStr && b.check_out_date > todayStr)
  }, [bookings, todayStr])

  const occupiedRoomIds = new Set(activeBookingsToday.map(b => b.room_id))
  const occupiedCount = occupiedRoomIds.size
  const totalRooms = rooms.length
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0

  // Group rooms by category
  const roomsByCategory = useMemo(() => {
    const groups: Record<string, RoomResponse[]> = {}
    rooms.forEach(r => {
      if (!groups[r.room_type]) groups[r.room_type] = []
      groups[r.room_type].push(r)
    })
    return groups
  }, [rooms])

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Booking & Occupancy</h2>
          <p className="text-muted-foreground">Manage room inventory and reservations.</p>
        </div>
        <Button variant="outline" onClick={() => alert("Detailed bookings list will be built in a future phase.")}>
          View all bookings
        </Button>
      </div>

      {/* COMPACT OCCUPANCY SUMMARY */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold text-primary">{occupancyRate}% Occupied</div>
            <div className="text-muted-foreground">|</div>
            <div className="text-sm font-medium">{occupiedCount} of {totalRooms} rooms currently booked</div>
          </div>
        </CardContent>
      </Card>

      {/* ROOMS GROUPED BY CATEGORY */}
      {loading ? (
        <div className="text-muted-foreground">Loading rooms...</div>
      ) : (
        <div className="space-y-8">
          {Object.entries(roomsByCategory).map(([category, catRooms]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-2xl font-bold border-b pb-2 tracking-tight">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {catRooms.map(room => {
                  const isBooked = occupiedRoomIds.has(room.id)
                  const imgUrl = roomImages[room.room_type] || '/images/rooms/normal.jpg'
                  
                  return (
                    <Card 
                      key={room.id} 
                      className="overflow-hidden cursor-pointer hover:border-primary/50 transition-all hover:shadow-md flex flex-col h-full"
                      onClick={() => setSelectedRoom(room)}
                    >
                      <div className="relative h-48 w-full bg-muted">
                        <img 
                          src={imgUrl} 
                          alt={`${room.room_type} room`} 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                          Demo Image
                        </div>
                      </div>
                      <CardContent className="p-5 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">{room.room_type}</div>
                            <div className="text-xl font-bold">Room {room.room_number} <span className="text-sm font-normal text-muted-foreground ml-1">• Floor {room.floor}</span></div>
                          </div>
                          <div className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1.5 ${isBooked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            <div className={`w-2 h-2 rounded-full ${isBooked ? 'bg-red-500' : 'bg-green-500'}`} />
                            {isBooked ? 'Booked' : 'Available'}
                          </div>
                        </div>
                        
                        <div className="text-2xl font-bold mt-2">
                          ₹{room.base_price_per_night} <span className="text-sm font-normal text-muted-foreground">/ night</span>
                        </div>

                        <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                          <div>Up to {room.max_adults} adults{room.max_children > 0 ? ` · ${room.max_children} child${room.max_children > 1 ? 'ren' : ''}` : ''}</div>
                          {room.has_extra_bed_option && (
                            <div className="text-primary">Extra bed available (₹{room.extra_bed_price})</div>
                          )}
                        </div>

                        <div className="mt-auto pt-4">
                          <div className="text-primary font-medium text-sm flex items-center group">
                            View Details 
                            <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL VIEW MODAL */}
      <Dialog open={selectedRoom !== null} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-xl p-6 overflow-hidden">
          {selectedRoom && (
            <div className="space-y-8">
              {/* LAYER 2: SIMPLE ROOM INFORMATION */}
              <div className="flex flex-col sm:flex-row gap-6">
                 {/* Left: Room Image */}
                 <div className="w-full sm:w-2/5 aspect-[4/3] relative rounded-xl overflow-hidden bg-muted flex-shrink-0">
                   <img 
                      src={roomImages[selectedRoom.room_type] || '/images/rooms/normal.jpg'} 
                      alt={selectedRoom.room_type} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                      Demo Image
                    </div>
                 </div>
                 
                 {/* Right: Room Details */}
                 <div className="w-full sm:w-3/5 flex flex-col justify-center">
                    <div className="flex justify-between items-start">
                       <h3 className="text-2xl font-bold">{selectedRoom.room_type}</h3>
                       <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs font-medium capitalize">
                         <div className={`w-2 h-2 rounded-full ${selectedRoom.status === 'available' ? 'bg-green-500' : 'bg-red-500'}`} />
                         {selectedRoom.status}
                       </div>
                    </div>
                    <div className="text-muted-foreground mt-1">Room {selectedRoom.room_number} · Floor {selectedRoom.floor}</div>
                    <div className="text-xl font-bold text-primary mt-3">₹{selectedRoom.base_price_per_night} <span className="text-sm font-normal text-muted-foreground">/ night</span></div>
                    
                    <div className="text-sm text-muted-foreground mt-3 font-medium">
                       {selectedRoom.max_adults} Adult{selectedRoom.max_adults > 1 ? 's' : ''} · {selectedRoom.max_children} Child{selectedRoom.max_children !== 1 ? 'ren' : ''}
                       {selectedRoom.has_extra_bed_option && ' · Extra Bed'}
                    </div>
                 </div>
              </div>

              {/* LAYER 3: BOOKING FORM */}
              <div className="bg-muted/30 p-5 rounded-lg border space-y-4">
                {bookingSuccessData ? (
                  <div className="flex flex-col items-center justify-center text-center space-y-4 py-4 animate-in fade-in zoom-in">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-xl text-green-700">Booking Confirmed</h4>
                    </div>
                    <div className="w-full py-3 my-2 text-sm text-center space-y-1">
                       <div className="font-medium">Room {bookingSuccessData.room} — {selectedRoom.room_type}</div>
                       <div className="text-muted-foreground">{format(new Date(bookingSuccessData.checkIn), 'dd MMM yyyy')} → {format(new Date(bookingSuccessData.checkOut), 'dd MMM yyyy')}</div>
                       <div className="font-medium text-primary mt-2">Total: ₹{bookingSuccessData.total}</div>
                    </div>
                    
                    {bookingSuccessData.cancellation_risk && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-semibold text-sm mb-3 text-slate-700">Cancellation Risk</h4>
                        <div className="p-4 rounded-md border bg-slate-50 flex items-center gap-4">
                          <div className={`p-3 rounded-full flex items-center justify-center text-lg font-bold w-16 h-16
                            ${bookingSuccessData.cancellation_risk.risk_level === 'High' ? 'bg-red-100 text-red-700 border border-red-200' : 
                              bookingSuccessData.cancellation_risk.risk_level === 'Medium' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                              'bg-green-100 text-green-700 border border-green-200'}`}
                          >
                            {Math.round(bookingSuccessData.cancellation_risk.probability * 100 * 10) / 10}%
                          </div>
                          <div>
                            <div className={`font-bold ${
                              bookingSuccessData.cancellation_risk.risk_level === 'High' ? 'text-red-700' : 
                              bookingSuccessData.cancellation_risk.risk_level === 'Medium' ? 'text-amber-700' : 
                              'text-green-700'
                            }`}>
                              {bookingSuccessData.cancellation_risk.risk_level} Risk
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Based on booking details available at creation time.</div>
                            <div className="text-[10px] text-slate-400 mt-1 italic">Guest history: Unavailable — authentication not yet implemented.</div>
                          </div>
                        </div>
                      </div>
                    )}
                    <Button className="w-full mt-4" variant="outline" onClick={() => handleCloseModal(false)}>Done</Button>
                  </div>
                ) : (
                  <>
                    <h4 className="font-semibold text-lg">Check Availability & Book</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Check In</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !checkIn && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {checkIn ? format(checkIn, "dd MMM yyyy") : <span>Select date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={checkIn}
                              onSelect={handleCheckInChange}
                              disabled={(date) => isBefore(date, new Date(new Date().setHours(0,0,0,0)))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label>Check Out</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !checkOut && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {checkOut ? format(checkOut, "dd MMM yyyy") : <span>Select date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={checkOut}
                              onSelect={(date) => date && setCheckOut(date)}
                              disabled={(date) => isBefore(date, addDays(checkIn, 1)) || isSameDay(date, checkIn)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    {(!checkIn || !checkOut || isBefore(checkOut, checkIn) || isSameDay(checkIn, checkOut)) && (
                      <div className="text-xs text-red-500">Check-out must be after check-in.</div>
                    )}
                    
                    {availabilityResult === 'unchecked' && (
                      <Button 
                        onClick={checkAvailability} 
                        disabled={isChecking || !checkIn || !checkOut || isBefore(checkOut, checkIn) || isSameDay(checkIn, checkOut)} 
                        className="w-full mt-4" 
                        variant="secondary"
                      >
                        {isChecking ? "Checking..." : "Check Availability"}
                      </Button>
                    )}

                    {availabilityResult === 'error' && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm text-center font-medium mt-4">
                        Unable to check availability. Please try again.
                      </div>
                    )}

                    {availabilityResult === 'unavailable' && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm text-center font-medium mt-4">
                        ✕ Room is already booked for these dates
                      </div>
                    )}

                    {availabilityResult === 'available' && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 pt-2 mt-4">
                        <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-md text-sm text-center font-medium flex items-center justify-center gap-2">
                           ✓ Room available for these dates
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="grid gap-2">
                            <Label>Adults</Label>
                            <Input type="number" max={selectedRoom.max_adults} min={1} value={adults} onChange={e => setAdults(parseInt(e.target.value) || 1)} />
                          </div>
                          <div className="grid gap-2">
                            <Label>Children</Label>
                            <Input type="number" max={selectedRoom.max_children} min={0} value={children} onChange={e => setChildren(parseInt(e.target.value) || 0)} />
                          </div>
                          <div className="grid gap-2 col-span-2 mt-1">
                            <Label>Extra Bed {selectedRoom.has_extra_bed_option && <span className="font-normal text-muted-foreground ml-1">(+₹{selectedRoom.extra_bed_price} / night)</span>}</Label>
                            {selectedRoom.has_extra_bed_option ? (
                               <div className="flex gap-2">
                                  <Button 
                                    variant={!extraBedSelected ? "default" : "outline"} 
                                    onClick={() => setExtraBedSelected(false)}
                                    className="flex-1"
                                  >No</Button>
                                  <Button 
                                    variant={extraBedSelected ? "default" : "outline"} 
                                    onClick={() => setExtraBedSelected(true)}
                                    className="flex-1"
                                  >Yes</Button>
                               </div>
                            ) : (
                               <div className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/30">Not available</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {availabilityResult === 'available' && (
                      <div className="mt-6 pt-6 border-t animate-in fade-in slide-in-from-bottom-4">
                        <h4 className="font-semibold text-sm mb-4">Booking Details</h4>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label>Guest Country</Label>
                              <select 
                                className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={guestCountry} 
                                onChange={e => setGuestCountry(e.target.value)}
                              >
                                <option value="PRT">Portugal (PRT)</option>
                                <option value="GBR">United Kingdom (GBR)</option>
                                <option value="FRA">France (FRA)</option>
                                <option value="ESP">Spain (ESP)</option>
                                <option value="DEU">Germany (DEU)</option>
                                <option value="ITA">Italy (ITA)</option>
                                <option value="IRL">Ireland (IRL)</option>
                                <option value="BEL">Belgium (BEL)</option>
                                <option value="BRA">Brazil (BRA)</option>
                                <option value="NLD">Netherlands (NLD)</option>
                                <option value="USA">United States (USA)</option>
                                <option value="CHE">Switzerland (CHE)</option>
                                <option value="AUT">Austria (AUT)</option>
                                <option value="SWE">Sweden (SWE)</option>
                                <option value="CHN">China (CHN)</option>
                                <option value="POL">Poland (POL)</option>
                                <option value="IND">India (IND)</option>
                              </select>
                            </div>
                            
                            <div className="grid gap-2">
                              <Label>Booking Channel</Label>
                              <select 
                                className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={bookingChannel} 
                                onChange={e => setBookingChannel(e.target.value)}
                              >
                                <option value="Direct">Direct</option>
                                <option value="Website">Website</option>
                                <option value="Travel Agent">Travel Agent</option>
                                <option value="Corporate">Corporate</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            
                            <div className="grid gap-2">
                              <Label>Customer Type</Label>
                              <select 
                                className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={customerType} 
                                onChange={e => setCustomerType(e.target.value)}
                              >
                                <option value="Transient">Transient</option>
                                <option value="Contract">Contract</option>
                                <option value="Group">Group</option>
                              </select>
                            </div>
                            
                            <div className="grid gap-2">
                              <Label>Deposit Type</Label>
                              <select 
                                className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={depositType} 
                                onChange={e => setDepositType(e.target.value)}
                              >
                                <option value="No Deposit">No Deposit</option>
                                <option value="Refundable">Refundable</option>
                                <option value="Non Refund">Non-refundable</option>
                              </select>
                            </div>
                            
                            <div className="grid gap-2">
                              <Label>Meal Plan</Label>
                              <select 
                                className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={mealPlan} 
                                onChange={e => setMealPlan(e.target.value)}
                              >
                                <option value="No Meal">No Meal</option>
                                <option value="Breakfast">Breakfast</option>
                                <option value="Half Board">Half Board</option>
                                <option value="Full Board">Full Board</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="grid gap-2">
                            <Label>Special Requests</Label>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              {['Extra pillow', 'Early check-in', 'Airport pickup', 'High floor'].map(req => (
                                <label key={req} className="flex items-center gap-2 text-sm">
                                  <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={specialRequests.includes(req)}
                                    onChange={(e) => {
                                      if (e.target.checked) setSpecialRequests(prev => [...prev, req])
                                      else setSpecialRequests(prev => prev.filter(r => r !== req))
                                    }}
                                  />
                                  {req}
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <Button onClick={handleCreateBooking} size="lg" className="w-full mt-6">Book Room</Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
