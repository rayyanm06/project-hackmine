import { useState, useEffect } from 'react'
import { Outlet, createFileRoute, useRouterState, useNavigate } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { ResortEntryExperience } from '@/components/entry/ResortEntryExperience'
import { LandingPage } from '@/components/landing/LandingPage'
import { AuthService, type AuthUser } from '@/lib/auth'
import { useRoleStore } from '@/stores/role-store'
import { isRouteAllowedForRole, getDefaultRouteForRole } from '@/config/role-permissions'

export const Route = createFileRoute('/_layout')({
  component: LayoutComponent,
})

function LayoutComponent() {
  const routerState = useRouterState()
  const navigate = useNavigate()
  const isRoot = routerState.location.pathname === '/'
  const { currentRole, setRole } = useRoleStore()

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
      } else {
        setHasEntered(false)
        sessionStorage.removeItem('resort_entered')
      }
    })

    return () => unsubscribe()
  }, [setRole])

  const search = routerState.location.search as Record<string, string> | undefined
  const isLoginView =
    search?.view === 'login' ||
    (typeof window !== 'undefined' && window.location.search.includes('view=login'))

  const currentPath = routerState.location.pathname
  const isAuthorized = isRouteAllowedForRole(currentRole, currentPath)

  // Enforce role-based route protection
  useEffect(() => {
    if (currentUser && hasEntered) {
      if (!isAuthorized) {
        const target = getDefaultRouteForRole(currentRole)
        navigate({ to: target, replace: true })
      }
    }
  }, [currentUser, hasEntered, isAuthorized, currentRole, navigate])

  // If user is not authenticated or hasn't finished the entry transition:
  if (!currentUser || !hasEntered) {
    if (isRoot && !isLoginView) {
      return (
        <LandingPage
          onEnter={() => {
            navigate({ to: '/', search: { view: 'login' } })
          }}
        />
      )
    }

    return (
      <div className="relative w-full min-h-screen overflow-hidden">
        {/* Render background layout ready to be revealed */}
        <div
          id="dashboard-reveal-container"
          className="w-full min-h-screen will-change-transform"
          style={{
            transform: 'translateY(100%)',
            visibility: 'hidden',
          }}
        >
          <AuthenticatedLayout>
            <Outlet />
          </AuthenticatedLayout>
        </div>

        {/* The Entry Experience overlay on top */}
        <div className="fixed inset-0 z-50">
          <ResortEntryExperience
            initialView="login"
            onEntered={() => {
              sessionStorage.setItem('resort_entered', 'true')
              setHasEntered(true)
              const role = AuthService.getCurrentUser()?.role || currentRole
              if (!isRouteAllowedForRole(role, currentPath)) {
                navigate({ to: getDefaultRouteForRole(role), replace: true })
              }
            }}
          />
        </div>
      </div>
    )
  }

  // Fully authenticated and entered: render normal layout
  // Prevent rendering restricted route content while redirecting
  if (!isAuthorized) {
    return (
      <AuthenticatedLayout>
        <div className="w-full min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D8CFF]" />
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <Outlet />
    </AuthenticatedLayout>
  )
}


