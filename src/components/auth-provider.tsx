"use client"

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react"
import { getSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

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

// Session cache with TTL
const SESSION_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
let sessionCache: { data: any; timestamp: number } | null = null

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const isMountedRef = useRef(true)
  const fetchingRef = useRef(false)

  // Memoize derived values to prevent unnecessary re-renders
  const user = useMemo(() => session?.user || null, [session])
  const isAdmin = useMemo(() => user?.role === "admin", [user])
  const isMember = useMemo(() => user?.role === "member", [user])

  const refreshSession = useCallback(async (force = false) => {
    // Prevent multiple simultaneous requests
    if (fetchingRef.current && !force) return
    
    // Check cache first (unless forced refresh)
    if (!force && sessionCache) {
      const now = Date.now()
      if (now - sessionCache.timestamp < SESSION_CACHE_TTL) {
        setSession(sessionCache.data)
        setIsLoading(false)
        return
      }
    }

    try {
      fetchingRef.current = true
      setIsLoading(true)
      const response = await getSession()
      const sessionData = response?.data || null
      
      // Only update if component is still mounted
      if (isMountedRef.current) {
        setSession(sessionData)
        
        // Update cache
        sessionCache = {
          data: sessionData,
          timestamp: Date.now()
        }
        
        // Handle redirects for unauthenticated users
        if (!sessionData && typeof window !== 'undefined') {
          const currentPath = window.location.pathname
          if (!currentPath.startsWith('/login') && !currentPath.startsWith('/verify')) {
            router.push('/login')
          }
        }
      }
    } catch (error) {
      console.error("Error fetching session:", error)
      if (isMountedRef.current) {
        setSession(null)
        sessionCache = null
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
      fetchingRef.current = false
    }
  }, [router])

  const clearSession = useCallback(() => {
    setSession(null)
    sessionCache = null
    router.push('/login')
  }, [router])

  useEffect(() => {
    isMountedRef.current = true
    refreshSession()
    
    return () => {
      isMountedRef.current = false
    }
  }, [refreshSession])

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    session,
    user,
    isLoading,
    isAdmin,
    isMember,
    refreshSession,
    clearSession,
  }), [session, user, isLoading, isAdmin, isMember, refreshSession, clearSession])

  return (
    <AuthContext.Provider value={contextValue}>
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