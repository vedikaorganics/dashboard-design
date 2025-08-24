"use client"

import { useState, useEffect, useCallback } from 'react'
import { cache } from '@/lib/cache'

interface UseDataResult<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  mutate: () => void
}

// Generic data fetching hook with caching
function useData<T>(url: string, cacheKey: string, ttl: number = 300): UseDataResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const fetchData = useCallback(async () => {
    try {
      // Check cache first
      const cachedData = cache.get(cacheKey)
      if (cachedData) {
        setData(cachedData as T)
        setError(null)
        return
      }

      setIsLoading(true)
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      // Cache the result
      cache.set(cacheKey, result, ttl)
      
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      // Don't clear data on error - keep showing cached data
    } finally {
      setIsLoading(false)
    }
  }, [url, cacheKey, ttl])

  const mutate = useCallback(() => {
    cache.delete(cacheKey)
    fetchData()
  }, [cacheKey, fetchData])

  useEffect(() => {
    fetchData()
    
    // Set up periodic refresh
    const interval = setInterval(fetchData, ttl * 1000)
    
    return () => clearInterval(interval)
  }, [fetchData, ttl])

  return { data, error, isLoading, mutate }
}

// Dashboard overview data
export function useDashboard() {
  return useData('/api/dashboard', 'dashboard-overview', 60) // 1 minute refresh
}

// Orders with pagination and filtering
export function useOrders(page = 1, limit = 50, status?: string) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status })
  })
  
  const cacheKey = `orders-${page}-${limit}-${status || 'all'}`
  return useData(`/api/orders?${params}`, cacheKey, 30) // 30 seconds refresh
}

// Products with variants and reviews
export function useProducts() {
  return useData('/api/products', 'products-all', 600) // 10 minutes refresh
}

// Users/customers with analytics
export function useUsers(page = 1, limit = 50) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  })
  
  const cacheKey = `users-${page}-${limit}`
  return useData(`/api/users?${params}`, cacheKey, 300) // 5 minutes refresh
}

// Reviews with moderation
export function useReviews(page = 1, limit = 50, approved?: boolean) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(approved !== undefined && { approved: approved.toString() })
  })
  
  const cacheKey = `reviews-${page}-${limit}-${approved || 'all'}`
  return useData(`/api/reviews?${params}`, cacheKey, 120) // 2 minutes refresh
}

// Offers and promotions
export function useOffers() {
  return useData('/api/offers', 'offers-all', 300) // 5 minutes refresh
}

// Marketing campaigns
export function useCampaigns() {
  return useData('/api/campaigns', 'campaigns-utm-analytics', 300) // 5 minutes refresh
}

// Staff management
export function useStaff() {
  return useData('/api/staff', 'staff-all', 900) // 15 minutes refresh
}

// Utility hook for manual cache invalidation
export function useInvalidateCache() {
  return {
    invalidateAll: () => {
      cache.clear()
    },
    invalidateDashboard: () => {
      cache.delete('dashboard-overview')
    },
    invalidateOrders: () => {
      const keys = cache.getStats().keys
      keys.forEach(key => {
        if (key.startsWith('orders-')) {
          cache.delete(key)
        }
      })
    }
  }
}

// Prefetch utility for hovering and navigation
export function usePrefetch() {
  return {
    prefetchOrders: () => {
      fetch('/api/orders?page=1&limit=50').catch(() => {}) // Silent prefetch
    },
    prefetchProducts: () => {
      fetch('/api/products').catch(() => {})
    },
    prefetchUsers: () => {
      fetch('/api/users?page=1&limit=50').catch(() => {})
    }
  }
}