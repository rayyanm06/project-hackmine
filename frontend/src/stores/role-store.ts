import { create } from 'zustand'

export type Role = 'Guest' | 'Staff' | 'Team Head' | 'Manager'

interface RoleState {
  currentRole: Role
  setRole: (role: Role) => void
}

export const useRoleStore = create<RoleState>((set) => ({
  currentRole: 'Manager',
  setRole: (role) => set({ currentRole: role }),
}))
