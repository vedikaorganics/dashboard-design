import { NextRequest } from 'next/server'
import { auth, Session, User } from './auth'

/**
 * Get the current user from the request
 * @param request Next.js request object
 * @returns User object or null if not authenticated
 */
export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    }) as Session | null
    
    return session?.user || null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Get the current user ID from the request
 * @param request Next.js request object
 * @returns User ID string or 'system' as fallback
 */
export async function getCurrentUserId(request: NextRequest): Promise<string> {
  const user = await getCurrentUser(request)
  return user?.id || 'system'
}

/**
 * Get the current user's full name or email from the request
 * @param request Next.js request object
 * @returns Full name, email, or 'System' as fallback
 */
export async function getCurrentUserName(request: NextRequest): Promise<string> {
  const user = await getCurrentUser(request)
  return user?.fullName || user?.email || 'System'
}

/**
 * Check if the current user has a specific role
 * @param request Next.js request object
 * @param role Role to check for
 * @returns True if user has the role or no user (for backward compatibility)
 */
export async function hasRole(request: NextRequest, role: string): Promise<boolean> {
  const user = await getCurrentUser(request)
  // If no user, allow for backward compatibility
  if (!user) return true
  return user.role === role || user.role === 'admin'
}

/**
 * Require authentication - throws error if user is not authenticated
 * @param request Next.js request object
 * @returns User object
 * @throws Error if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<User> {
  const user = await getCurrentUser(request)
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}