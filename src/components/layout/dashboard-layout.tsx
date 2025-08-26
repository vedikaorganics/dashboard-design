"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { Header } from "./header"
import { useAuth } from "@/components/auth-provider"
import { Loader2 } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  requiredRole?: "admin" | "member"
}

export function DashboardLayout({ children, title, requiredRole }: DashboardLayoutProps) {
  const { user, isLoading, session } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      // Not authenticated
      if (!session || !user) {
        router.push('/login')
        return
      }

      // Role-based access control
      if (requiredRole && user.role !== requiredRole) {
        // Redirect non-admin users away from admin-only pages
        router.push('/')
        return
      }
    }
  }, [user, isLoading, session, router, requiredRole])

  // Optimistic UI: Show skeleton layout while auth is loading (faster perceived performance)
  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex flex-1 flex-col">
            <Header title={title} />
            <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    )
  }

  // Show skeleton while redirecting (should be very fast with optimized auth)
  if (!session || !user) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex flex-1 flex-col">
            <Header title={title} />
            <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm text-muted-foreground">Redirecting...</p>
                </div>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    )
  }

  // Show skeleton while checking role access
  if (requiredRole && user.role !== requiredRole) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex flex-1 flex-col">
            <Header title={title} />
            <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm text-muted-foreground">Access denied...</p>
                </div>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    )
  }

  // Render the dashboard
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <Header title={title} />
          <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}