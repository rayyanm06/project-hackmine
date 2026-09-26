import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate({ to: '/', search: { view: 'login' }, replace: true })
  }, [navigate])

  return null
}

