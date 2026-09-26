import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, BrainCircuit, AlertTriangle, Info, CheckCircle2, IndianRupee } from 'lucide-react'
import { useState } from 'react'
import { api, RoomMatchResponse, MatchedRoom } from '@/lib/api'

export const Route = createFileRoute('/_layout/recommendations')({
  component: RecommendationsPage,
})

function RoomCard({ room }: { room: MatchedRoom }) {
  const typeColors: Record<string, string> = {
    Suite: 'bg-purple-100 text-purple-800',
    Deluxe: 'bg-blue-100 text-blue-800',
    Family: 'bg-green-100 text-green-800',
    Standard: 'bg-slate-100 text-slate-700',
  }

  return (
    <Card className="border-l-4 border-l-indigo-400">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">
              Room {room.room_number}
              <Badge className={`ml-2 text-xs font-normal ${typeColors[room.room_type] ?? 'bg-muted'}`}>
                {room.room_type}
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Available · Floor {room.floor ?? '—'}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="flex items-center text-xl font-bold">
              <IndianRupee className="h-4 w-4 mt-0.5" />
              {room.base_rate.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">per night</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-md text-sm text-indigo-900">
          <span className="font-semibold">Why this room: </span>
          {room.explanation}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" />
          Match score: {room.match_score} · Matched on: {room.match_reason}
        </div>
      </CardContent>
    </Card>
  )
}

function RecommendationsPage() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<RoomMatchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await api.getRoomRecommendation(query.trim())
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Failed to get recommendations')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="p-6 space-y-6 bg-muted/20 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Room Matchmaker</h1>
        <p className="text-muted-foreground flex items-center gap-1 mt-1">
          <BrainCircuit className="h-4 w-4 text-indigo-500" />
          Describe what you need — we'll find the best available room at Smart Resort 360.
        </p>
      </div>

      {/* Search Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Describe Your Stay</CardTitle>
          <CardDescription>
            Type a natural-language request. Only room type and price are matched from live data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              id="room-query-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. I need a family room for 4 people under ₹6000 a night"
              className="flex-1"
            />
            <Button id="find-room-btn" onClick={handleSearch} disabled={loading || !query.trim()}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? 'Searching…' : 'Find My Room'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            Only <strong>room type</strong> and <strong>price/night</strong> are verified from live database.
            Amenities (pool, WiFi, etc.) are not in the current room data.
          </p>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-900 border border-red-200 rounded-md">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4">
          {/* Parsed requirements summary */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Matched on:</span>
            {result.parsed_requirements.room_type && (
              <Badge variant="outline">Type: {result.parsed_requirements.room_type}</Badge>
            )}
            {result.parsed_requirements.max_price && (
              <Badge variant="outline">Max: ₹{result.parsed_requirements.max_price.toLocaleString()}</Badge>
            )}
            {result.parsed_requirements.unsupported_requirements.length > 0 && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                ⚠ Unverified: {result.parsed_requirements.unsupported_requirements.join(', ')}
              </Badge>
            )}
            <Badge variant="secondary" className="ml-auto capitalize text-xs">
              {result.source.replace('_', ' ')}
            </Badge>
          </div>

          {/* Warning */}
          {result.warning && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-md text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{result.warning}</span>
            </div>
          )}

          {/* Room cards */}
          {result.matches.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                {result.matches.length} Room{result.matches.length > 1 ? 's' : ''} Found
              </h2>
              {result.matches.map(room => (
                <RoomCard key={room.room_number} room={room} />
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground border rounded-md bg-muted/30">
              No available rooms match your request. Try adjusting your requirements.
            </div>
          )}

          {/* Data label */}
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            <strong>LIVE DATA:</strong> Room availability and rates are from the current database.
            No booking functionality is available in this demo.
          </p>
        </div>
      )}
    </div>
  )
}
