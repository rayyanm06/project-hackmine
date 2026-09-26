import { type Role } from '@/stores/role-store'

/**
 * Route URLs permitted for each user role.
 *
 * GUEST:
 * - Dashboard (/)
 * - Resort 360 (/resort-360)
 * - Complaints (/complaints)
 * - Recommendations (/recommendations)
 * - Booking & Occupancy (/booking-occupancy)
 * - Rooms 360 (/rooms-360) (Virtual tour subview)
 *
 * STAFF:
 * - Tasks (/tasks)
 * - Staff (/staff)
 *
 * ADMIN / MANAGEMENT (Manager, Team Head):
 * - Dashboard (/)
 * - Resort 360 (/resort-360)
 * - Complaints (/complaints)
 * - Tasks (/tasks)
 * - Staff (/staff)
 * - Verification (/verification)
 * - Recommendations (/recommendations)
 * - Booking & Occupancy (/booking-occupancy)
 * - Pricing Intelligence (/pricing)
 * - Cancellation Risk (/cancellation-risk)
 * - AI Insights (/insights)
 * - Audit Trail (/audit)
 * - Settings (/settings)
 * - Rooms 360 (/rooms-360)
 */
export const ROLE_ALLOWED_ROUTES: Record<Role, string[]> = {
  Guest: [
    '/',
    '/resort-360',
    '/complaints',
    '/recommendations',
    '/booking-occupancy',
    '/rooms-360',
  ],
  Staff: [
    '/tasks',
    '/staff',
  ],
  'Team Head': [
    '/',
    '/resort-360',
    '/complaints',
    '/tasks',
    '/staff',
    '/verification',
    '/recommendations',
    '/booking-occupancy',
    '/pricing',
    '/cancellation-risk',
    '/insights',
    '/audit',
    '/settings',
    '/rooms-360',
  ],
  Manager: [
    '/',
    '/resort-360',
    '/complaints',
    '/tasks',
    '/staff',
    '/verification',
    '/recommendations',
    '/booking-occupancy',
    '/pricing',
    '/cancellation-risk',
    '/insights',
    '/audit',
    '/settings',
    '/rooms-360',
  ],
}

/**
 * Default landing/home route for each role.
 */
export const ROLE_DEFAULT_ROUTE: Record<Role, string> = {
  Guest: '/',
  Staff: '/tasks',
  'Team Head': '/',
  Manager: '/',
}

/**
 * Check whether a pathname is allowed for a given role.
 */
export function isRouteAllowedForRole(role: Role | undefined | null, pathname: string): boolean {
  const activeRole: Role = role && ROLE_ALLOWED_ROUTES[role] ? role : 'Guest'
  const allowed = ROLE_ALLOWED_ROUTES[activeRole] || []

  // Normalize pathname (remove trailing slashes except for root '/')
  const normalized = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname

  return allowed.includes(normalized)
}

/**
 * Get the default route to redirect to for a given role.
 */
export function getDefaultRouteForRole(role: Role | undefined | null): string {
  const activeRole: Role = role && ROLE_DEFAULT_ROUTE[role] ? role : 'Guest'
  return ROLE_DEFAULT_ROUTE[activeRole] || '/'
}
