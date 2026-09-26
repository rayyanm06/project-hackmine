/**
 * UpgradeModal
 * Premium upgrade dialog. Frontend-only; no real payment processing.
 * Clearly communicates backend-pending state.
 */
import { useState } from 'react'
import { Sparkles, Check, ArrowRight, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

type UpgradeModalProps = {
  open: boolean
  onOpenChange: (v: boolean) => void
}

const PRO_FEATURES = [
  'Unlimited staff accounts',
  'Real-time AI assignment engine',
  'Live competitor pricing API',
  'Full audit trail with export',
  'Priority SLA monitoring & alerts',
  'Guest sentiment analytics',
  '360° room tour management',
  'Custom branding & white-label',
  'Dedicated support',
]

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const [clicked, setClicked] = useState(false)

  function handleUpgrade() {
    setClicked(true)
    // No real payment — inform the user clearly
    toast.info('Payment integration pending', {
      description: 'The payment flow requires backend setup. This is a frontend-only demo.',
      duration: 5000,
    })
    setTimeout(() => {
      setClicked(false)
      onOpenChange(false)
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='max-w-md w-[92vw] p-0 overflow-hidden'
        aria-label='Upgrade to Pro'
      >
        {/* Header band */}
        <div
          className='px-6 pt-6 pb-5'
          style={{ background: 'var(--violet-surface)', borderBottom: '1px solid var(--violet-border)' }}
        >
          <DialogHeader>
            <div className='flex items-center gap-2 mb-2'>
              <Sparkles className='size-5' style={{ color: 'var(--violet-deep)' }} aria-hidden='true' />
              <DialogTitle
                className='font-semibold leading-tight'
                style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.375rem', color: 'var(--violet-deep)' }}
              >
                Upgrade to Pro
              </DialogTitle>
            </div>
            <DialogDescription
              style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9375rem', color: 'var(--violet-fg)' }}
            >
              Unlock the full Smart Resort 360 platform for your property.
            </DialogDescription>
          </DialogHeader>

          {/* Price display */}
          <div className='mt-4 flex items-end gap-2'>
            <span className='font-semibold leading-none' style={{ fontSize: '2.25rem', color: 'var(--violet-deep)' }}>
              ₹4,999
            </span>
            <span className='text-muted-foreground mb-1' style={{ fontSize: '0.9375rem' }}>/ month per property</span>
          </div>
          <div className='flex items-center gap-2 mt-2'>
            <Badge variant='outline' className='text-[0.75rem]'
              style={{ background: 'var(--bronze-surface)', color: 'var(--bronze-deep)', borderColor: 'var(--bronze-border)' }}>
              Save 20% annually
            </Badge>
            <span className='text-muted-foreground' style={{ fontSize: '0.8125rem' }}>Cancel anytime</span>
          </div>
        </div>

        {/* Features */}
        <div className='px-6 py-5'>
          <p className='font-semibold mb-3' style={{ fontSize: '0.875rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
            Everything in Free, plus
          </p>
          <ul className='space-y-2.5' role='list'>
            {PRO_FEATURES.map(f => (
              <li key={f} className='flex items-center gap-2.5' style={{ fontSize: '0.9375rem' }}>
                <Check className='size-4 shrink-0' style={{ color: 'var(--sage-fg)' }} aria-hidden='true' />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        {/* Demo notice + CTA */}
        <div className='px-6 py-4 space-y-3'>
          <div className='flex items-start gap-2 rounded-sm border p-3'
            style={{ background: 'var(--terra-surface)', borderColor: 'var(--terra-border)' }}>
            <Info className='size-4 shrink-0 mt-0.5' style={{ color: 'var(--terra-fg)' }} aria-hidden='true' />
            <p style={{ fontSize: '0.8125rem', color: 'var(--terra-deep)', lineHeight: '1.55' }}>
              <strong>Demo Mode:</strong> Payment processing requires backend integration (Phase 2).
              Clicking "Start Pro Trial" will not charge your card.
            </p>
          </div>

          <div className='flex gap-3'>
            <Button
              className='flex-1 gap-2'
              style={{ background: 'var(--violet-deep)', color: 'oklch(1 0 0)' }}
              onClick={handleUpgrade}
              disabled={clicked}
              aria-label='Start 14-day free pro trial'
            >
              {clicked ? 'Processing…' : (
                <><Sparkles className='size-4' aria-hidden='true' /> Start 14-day Free Trial <ArrowRight className='size-4' aria-hidden='true' /></>
              )}
            </Button>
            <Button
              variant='outline'
              onClick={() => onOpenChange(false)}
              aria-label='Maybe later'
            >
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
