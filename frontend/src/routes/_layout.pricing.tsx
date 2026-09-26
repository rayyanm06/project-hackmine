import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LineChart, TrendingUp, TrendingDown, Info, AlertTriangle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { api, PricingAnalysisResponse } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/_layout/pricing')({
  component: PricingPage,
})

function PricingPage() {
  const [data, setData] = useState<PricingAnalysisResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await api.getPricingAnalysis("AC Deluxe")
        setData(res)
      } catch (err: any) {
        setError(err.message || "Failed to load pricing data")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="p-6 space-y-6 bg-muted/20 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pricing Intelligence</h1>
        <p className="text-muted-foreground flex items-center mt-1">
          <Info className="h-4 w-4 mr-1 text-blue-500" />
          <span className="font-medium mr-1">DEMO DATA:</span> Competitor rates are synthetic. Occupancy is live-derived.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full max-w-md" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-900 border border-red-200 rounded-md max-w-md">
          <AlertTriangle className="h-5 w-5 mb-2 inline-block mr-2" />
          {error}
        </div>
      ) : !data ? (
        <div className="p-4 bg-amber-50 text-amber-900 border border-amber-200 rounded-md max-w-md">
          No competitor data found.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Main Dynamic Card */}
          <Card>
            <CardHeader>
              <CardTitle>{data.room_type}</CardTitle>
              <CardDescription>Current vs Market</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-end border-b pb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Your Rate</p>
                  <div className="text-3xl font-bold">₹{data.your_rate.toLocaleString()}</div>
                </div>
                {data.your_rate < data.market_average && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-800">Below avg</Badge>
                )}
                {data.your_rate > data.market_average && (
                  <Badge variant="outline" className="bg-red-50 text-red-800">Above avg</Badge>
                )}
                {data.your_rate === data.market_average && (
                  <Badge variant="outline" className="bg-green-50 text-green-800">Aligned</Badge>
                )}
              </div>
              
              <div>
                <p className="text-sm font-medium mb-3">Competitor Rates (Demo)</p>
                <div className="space-y-2">
                  {data.competitors.map((comp, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{comp.name}</span>
                      <span className="font-medium">₹{comp.rate.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Competitor Average:</span>
                  <span>₹{data.market_average.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-muted-foreground mt-1">
                  <span>Competitor Range:</span>
                  <span>₹{data.market_min.toLocaleString()} - ₹{data.market_max.toLocaleString()}</span>
                </div>
              </div>

              <div className={`mt-4 p-4 rounded-md border ${data.your_rate < data.market_average ? 'bg-emerald-50 text-emerald-900 border-emerald-100' : data.your_rate > data.market_average ? 'bg-red-50 text-red-900 border-red-100' : 'bg-slate-50 text-slate-800 border-slate-200'}`}>
                <div className="flex items-center justify-between font-bold mb-2">
                  <div className="flex items-center">
                    {data.your_rate < data.market_average ? (
                      <TrendingUp className="h-4 w-4 mr-2" />
                    ) : data.your_rate > data.market_average ? (
                      <TrendingDown className="h-4 w-4 mr-2" />
                    ) : (
                      <LineChart className="h-4 w-4 mr-2" />
                    )}
                    AI Recommendation
                  </div>
                  <Badge variant="outline" className="bg-white text-[10px] uppercase">
                    {data.source.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm mb-2 font-medium">
                  {data.recommendation}
                </p>
                {data.recommended_rate_min !== data.your_rate || data.recommended_rate_max !== data.your_rate ? (
                  <p className="text-sm mb-2 font-semibold">
                    Suggested Range: ₹{data.recommended_rate_min.toLocaleString()} – ₹{data.recommended_rate_max.toLocaleString()}/night
                  </p>
                ) : null}
                <p className="text-xs mb-3">
                  <strong>Why?</strong> {data.reason}
                </p>
                <div className="text-xs opacity-90 border-t pt-2">
                  <strong>Evidence:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {data.evidence.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
            {/* Omitted the "Apply Suggested Rate" button to ensure it is advisory only */}
          </Card>
        </div>
      )}
    </div>
  )
}
