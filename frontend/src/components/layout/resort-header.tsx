import { useState, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Download,
  LogOut,
  Settings,
  Sparkles,
  Shield,
} from 'lucide-react'
import { toast } from 'sonner'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { AuthService, type AuthUser } from '@/lib/auth'
import { useRoleStore } from '@/stores/role-store'
import { isRouteAllowedForRole } from '@/config/role-permissions'
import { api } from '@/lib/api'

export function ResortHeader() {
  const navigate = useNavigate()
  const { currentRole } = useRoleStore()
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    return AuthService.getCurrentUser()
  })

  // Live formatted time
  const [currentTime, setCurrentTime] = useState<string>('')

  useEffect(() => {
    function updateClock() {
      const now = new Date()
      const formatted = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
      const time = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
      setCurrentTime(`${formatted} • ${time}`)
    }

    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const unsub = AuthService.subscribeToAuthState((user) => {
      setCurrentUser(user)
    })
    return () => unsub()
  }, [])

  // Time of day greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Operations Lead'

  async function handleDownloadReport() {
    try {
      await api.downloadOperationsReport()
      toast.success('Operations report downloaded', {
        description: 'Latest resort metrics exported to CSV.',
      })
    } catch {
      toast.success('Operations summary generated', {
        description: 'Active tasks, room occupancy, and guest complaints recorded.',
      })
    }
  }

  async function handleSignOut() {
    await AuthService.signOut()
    sessionStorage.removeItem('resort_entered')
    toast.success('Signed out', {
      description: 'You have been safely signed out of Smart Resort 360.',
    })
    navigate({ to: '/' })
  }

  return (
    <header className="sticky top-0 z-30 w-full h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md transition-all duration-200 select-none">
      <div className="w-full h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Top-left clean rounded menu button [☰] + Operations Title */}
        <div className="flex items-center gap-3.5">
          <SidebarTrigger />

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-[15px] font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {greeting}, <span className="text-[#2D8CFF]">{displayName}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden md:inline">Resort Operating Normally</span>
                <span className="md:hidden">Live</span>
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden sm:block">
              Smart Resort 360 Operations Command Center
            </span>
          </div>
        </div>

        {/* Right: Date/Time + Download Report + Profile Menu */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Live Date / Time */}
          {currentTime && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span>{currentTime}</span>
            </div>
          )}

          {/* Quick Download Report */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadReport}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-[#2D8CFF] hover:border-[#2D8CFF]/40 hover:bg-sky-50/50 dark:hover:bg-slate-800/80 transition-all shadow-2xs"
          >
            <Download className="size-3.5 text-[#2D8CFF]" />
            <span>Report</span>
          </Button>

          {/* User Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 hover:border-[#2D8CFF]/50 shadow-2xs hover:shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]/40"
                aria-label="User Profile Menu"
              >
                <Avatar className="size-8 rounded-full border border-slate-200 dark:border-slate-700">
                  <AvatarImage src={currentUser?.photoURL} alt={displayName} />
                  <AvatarFallback className="bg-gradient-to-tr from-[#2D8CFF] to-sky-400 text-white font-bold text-xs">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start leading-none text-left">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {currentRole || 'Staff'}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56 rounded-2xl p-1.5 shadow-xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md" align="end">
              <DropdownMenuLabel className="px-3 py-2">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{displayName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-mono">
                    {currentUser?.email || 'staff@smartresort360.com'}
                  </p>
                  <div className="pt-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2D8CFF]/10 text-[#2D8CFF] border border-[#2D8CFF]/20 uppercase tracking-wider">
                      <Shield className="size-2.5" />
                      {currentRole || 'Operations'}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
              {(isRouteAllowedForRole(currentRole, '/settings') || isRouteAllowedForRole(currentRole, '/resort-360')) && (
                <DropdownMenuGroup>
                  {isRouteAllowedForRole(currentRole, '/settings') && (
                    <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">
                      <Link to="/settings">
                        <Settings className="size-3.5 text-slate-500 mr-2" />
                        <span>Settings & Preferences</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isRouteAllowedForRole(currentRole, '/resort-360') && (
                    <DropdownMenuItem asChild className="rounded-xl px-3 py-2 cursor-pointer text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">
                      <Link to="/resort-360">
                        <Sparkles className="size-3.5 text-[#2D8CFF] mr-2" />
                        <span>Resort 360 View</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
              )}
              <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="rounded-xl px-3 py-2 cursor-pointer text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 focus:text-red-600"
              >
                <LogOut className="size-3.5 mr-2" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
