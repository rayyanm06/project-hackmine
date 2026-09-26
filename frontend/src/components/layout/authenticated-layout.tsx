import { Outlet } from '@tanstack/react-router'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { ResortHeader } from '@/components/layout/resort-header'
import { SkipToMain } from '@/components/skip-to-main'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <SearchProvider>
      <LayoutProvider>
        <SidebarProvider defaultOpen={false}>
          <SkipToMain />
          <AppSidebar />
          <SidebarInset className="@container/content w-full flex-1 flex flex-col min-h-screen bg-slate-50/60 dark:bg-slate-950">
            <ResortHeader />
            <div className="flex-1 w-full">
              {children ?? <Outlet />}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </LayoutProvider>
    </SearchProvider>
  )
}
