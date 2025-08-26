"use client"

import { AuthGuard } from "./auth-guard"

interface ProtectedPageProps {
  children: React.ReactNode
  requiredRole?: "admin" | "member"
}

export function ProtectedPage({ children, requiredRole }: ProtectedPageProps) {
  return (
    <AuthGuard requiredRole={requiredRole}>
      {children}
    </AuthGuard>
  )
}