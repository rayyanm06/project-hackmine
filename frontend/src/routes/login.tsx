import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ResortEntryExperience } from '@/components/entry/ResortEntryExperience'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()

  return (
    <ResortEntryExperience
      initialView="login"
      onEntered={() => {
        sessionStorage.setItem('resort_entered', 'true')
        navigate({ to: '/' })
      }}
    />
  )
}
