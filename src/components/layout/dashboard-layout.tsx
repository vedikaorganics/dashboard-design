"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { Header } from "./header"
import { AuthGuard } from "@/components/auth-guard"

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  requiredRole?: "admin" | "member"
}

export function DashboardLayout({ children, title, requiredRole }: DashboardLayoutProps) {
  return (
    <AuthGuard requiredRole={requiredRole}>
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
    </AuthGuard>
  )
}