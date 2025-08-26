"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { getSession } from "@/lib/auth-client"

interface AuthContextType {
  session: any | null
  user: any | null
  isLoading: boolean
  isAdmin: boolean
  isMember: boolean
  refreshSession: () => Promise<void>
  clearSession: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const user = session?.user || null
  const isAdmin = user?.role === "admin"
  const isMember = user?.role === "member"

  const refreshSession = async () => {
    try {
      setIsLoading(true)
      const response = await getSession()
      setSession(response?.data || null)
    } catch (error) {
      console.error("Error fetching session:", error)
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }

  const clearSession = () => {
    setSession(null)
  }

  useEffect(() => {
    refreshSession()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        isAdmin,
        isMember,
        refreshSession,
        clearSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}