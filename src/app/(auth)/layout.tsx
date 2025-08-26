import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Authentication - Vedika Organics Dashboard",
  description: "Sign in to your dashboard",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/10">
      {children}
    </div>
  )
}