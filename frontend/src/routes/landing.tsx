import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { LandingPage } from '@/components/landing/LandingPage'

export const Route = createFileRoute('/landing')({
  component: LandingRouteComponent,
})

function LandingRouteComponent() {
  const navigate = useNavigate()

  return (
    <LandingPage
      onEnter={() => {
        navigate({ to: '/', search: { view: 'login' } })
      }}
    />
  )
}
