import { useState, useEffect } from 'react'
import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { ResortEntryExperience } from '@/components/entry/ResortEntryExperience'
import { AuthService, type AuthUser } from '@/lib/auth'
import { useRoleStore } from '@/stores/role-store'

export const Route = createFileRoute('/_layout')({
  component: LayoutComponent,
})

function LayoutComponent() {
  const routerState = useRouterState()
  const isRoot = routerState.location.pathname === '/'
  const { setRole } = useRoleStore()

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    return AuthService.getCurrentUser()
  })

  const [hasEntered, setHasEntered] = useState<boolean>(() => {
    return (
      (Boolean(AuthService.getCurrentUser()) || AuthService.isAuthenticated()) &&
      sessionStorage.getItem('resort_entered') === 'true'
    )
  })

  // Subscribe to real Firebase Authentication State
  useEffect(() => {
    const unsubscribe = AuthService.subscribeToAuthState((user) => {
      setCurrentUser(user)
      if (user) {
        setRole(user.role)
        // Note: Do NOT set hasEntered here! hasEntered is driven solely by onEntered()
        // when the cinematic resort door animation completes.
      } else {
        setHasEntered(false)
        sessionStorage.removeItem('resort_entered')
      }
    })

    return () => unsubscribe()
  }, [setRole])

  // If user is not authenticated or hasn't finished the entry transition:
  if (!currentUser || !hasEntered) {
    return (
      <div className="relative w-full min-h-screen">
        {/* Render background layout ready to be revealed through the doors */}
        <div id="dashboard-reveal-container" className="w-full min-h-screen will-change-transform">
          <AuthenticatedLayout>
            <Outlet />
          </AuthenticatedLayout>
        </div>

        {/* The Entry Experience overlay on top */}
        <div className="fixed inset-0 z-50">
          <ResortEntryExperience
            initialView={isRoot ? 'landing' : 'login'}
            onEntered={() => {
              sessionStorage.setItem('resort_entered', 'true')
              setHasEntered(true)
            }}
          />
        </div>
      </div>
    )
  }

  // Fully authenticated and entered: render unmodified dashboard
  return (
    <AuthenticatedLayout>
      <Outlet />
    </AuthenticatedLayout>
  )
}
