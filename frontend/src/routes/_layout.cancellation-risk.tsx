import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Info } from 'lucide-react'

export const Route = createFileRoute('/_layout/cancellation-risk')({
  component: CancellationRisk,
})

function CancellationRisk() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any | null>(null)
  
  // Default values mapping the training features
  const [form, setForm] = useState({
    lead_time: 45,
    country: 'PRT',
    market_segment: 'Online TA',
    deposit_type: 'No Deposit',
    customer_type: 'Transient',
    total_of_special_requests: 0,
    previous_cancellations: 0,
    is_repeated_guest: 0,
    adults: 2,
    adr: 105.0,
    
    // Other defaults to satisfy schema
    arrival_date_week_number: 27,
    arrival_date_day_of_month: 4,
    stays_in_weekend_nights: 0,
    stays_in_week_nights: 2,
    children: 0,
    babies: 0,
    previous_bookings_not_canceled: 0,
    booking_changes: 0,
    agent: 9.0,
    days_in_waiting_list: 0,
    required_car_parking_spaces: 0,
    hotel: 'Resort Hotel',
    arrival_date_year: 2017,
    arrival_date_month: 'July',
    meal: 'BB',
    distribution_channel: 'TA/TO',
    reserved_room_type: 'A'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }))
  }

  const handleSelect = (name: string, value: string | number) => {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleAnalyze = async () => {
    setLoading(true)
    try {
      const res = await api.analyzeCancellationRisk(form)
      setResult(res)
    } catch (err) {
      console.error(err)
      alert("Failed to analyze risk")
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (level: string) => {
    if (level === 'High') return 'text-red-600 bg-red-50 border-red-200'
    if (level === 'Medium') return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-green-600 bg-green-50 border-green-200'
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Booking Risk Analysis</h2>
      </div>
      
      <div className="flex items-center gap-2 p-3 bg-indigo-50 text-indigo-800 border border-indigo-100 rounded-md text-sm">
        <Info className="h-4 w-4" />
        <strong>MODEL DEMO</strong> — Trained on public hospitality booking data. This does not use Smart Resort's actual history.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Booking Profile</CardTitle>
            <CardDescription>Input values for ML prediction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Lead Time (Days)</Label>
                <Input type="number" name="lead_time" value={form.lead_time} onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <Label>Country (e.g. PRT, GBR, FRA)</Label>
                <Input type="text" name="country" value={form.country} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Market Segment</Label>
                <Select value={form.market_segment} onValueChange={(val) => handleSelect('market_segment', val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Online TA">Online TA</SelectItem>
                    <SelectItem value="Offline TA/TO">Offline TA/TO</SelectItem>
                    <SelectItem value="Groups">Groups</SelectItem>
                    <SelectItem value="Direct">Direct</SelectItem>
                    <SelectItem value="Corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Deposit Type</Label>
                <Select value={form.deposit_type} onValueChange={(val) => handleSelect('deposit_type', val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No Deposit">No Deposit</SelectItem>
                    <SelectItem value="Non Refund">Non Refund</SelectItem>
                    <SelectItem value="Refundable">Refundable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>ADR ($)</Label>
                <Input type="number" step="0.01" name="adr" value={form.adr} onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <Label>Special Requests</Label>
                <Input type="number" name="total_of_special_requests" value={form.total_of_special_requests} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Previous Cancellations</Label>
                <Input type="number" name="previous_cancellations" value={form.previous_cancellations} onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <Label>Is Repeated Guest</Label>
                <Select value={form.is_repeated_guest.toString()} onValueChange={(val) => handleSelect('is_repeated_guest', Number(val))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No</SelectItem>
                    <SelectItem value="1">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleAnalyze} disabled={loading} className="w-full mt-4">
              {loading ? "Analyzing..." : "Analyze Cancellation Risk"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Prediction Result
                <Badge className={getRiskColor(result.risk_level)} variant="outline">
                  {result.risk_level} Risk
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center p-6 bg-slate-50 rounded-lg border">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">
                    {(result.cancellation_probability * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-slate-500 font-medium">Predicted Probability</div>
                </div>
              </div>

              <Separator />
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Model Name</span>
                  <span className="font-medium">{result.model_name} ({result.model_version})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Algorithm</span>
                  <span className="font-medium">{result.algorithm}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dataset Source</span>
                  <span className="font-medium">{result.dataset_source}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Evaluation (ROC-AUC)</span>
                  <span className="font-medium">{result.evaluation_metrics?.roc_auc?.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Evaluation (F1)</span>
                  <span className="font-medium">{result.evaluation_metrics?.f1?.toFixed(4)}</span>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-xs text-slate-500">Key Input Signals Provided</Label>
                <div className="mt-2 text-xs flex flex-wrap gap-2">
                  <Badge variant="secondary">Lead Time: {result.key_input_features.lead_time}</Badge>
                  <Badge variant="secondary">Deposit: {result.key_input_features.deposit_type}</Badge>
                  <Badge variant="secondary">Segment: {result.key_input_features.market_segment}</Badge>
                  <Badge variant="secondary">Country: {result.key_input_features.country}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
