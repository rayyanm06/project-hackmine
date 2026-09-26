import { create } from 'zustand'

export type Role = 'Guest' | 'Staff' | 'Team Head' | 'Manager'

interface RoleState {
  currentRole: Role
  setRole: (role: Role) => void
}

function getInitialRole(): Role {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sr360_auth_user')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.role && ['Guest', 'Staff', 'Team Head', 'Manager'].includes(parsed.role)) {
          return parsed.role
        }
      }
    }
  } catch {
    // ignore
  }
  return 'Guest'
}

export const useRoleStore = create<RoleState>((set) => ({
  currentRole: getInitialRole(),
  setRole: (role) => set({ currentRole: role }),
}))
