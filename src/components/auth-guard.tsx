"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./auth-provider"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: "admin" | "member" // Optional role requirement
  redirectTo?: string
}

export function AuthGuard({ 
  children, 
  requiredRole, 
  redirectTo = "/login" 
}: AuthGuardProps) {
  const { user, isLoading, session } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      // Not authenticated
      if (!session || !user) {
        router.push(redirectTo)
        return
      }

      // Role-based access control
      if (requiredRole && user.role !== requiredRole) {
        // Redirect non-admin users away from admin-only pages
        router.push("/")
        return
      }
    }
  }, [user, isLoading, session, router, requiredRole, redirectTo])

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show loading if not authenticated (before redirect)
  if (!session || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  // Show loading if user doesn't have required role (before redirect)
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Access denied...</p>
        </div>
      </div>
    )
  }

  // Render protected content
  return <>{children}</>
}