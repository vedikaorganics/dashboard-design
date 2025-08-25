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
export function useOrders(
  page = 1, 
  limit = 50, 
  status?: string,
  search?: string,
  paymentStatus?: string[],
  deliveryStatus?: string[]
) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status }),
    ...(search && search.trim() && { search: search.trim() }),
    ...(paymentStatus && paymentStatus.length > 0 && { paymentStatus: paymentStatus.join(',') }),
    ...(deliveryStatus && deliveryStatus.length > 0 && { deliveryStatus: deliveryStatus.join(',') })
  })
  
  // Create cache key that includes all filter parameters
  const filterParams = {
    status: status || 'all',
    search: search || '',
    paymentStatus: paymentStatus?.sort().join(',') || '',
    deliveryStatus: deliveryStatus?.sort().join(',') || ''
  }
  const cacheKey = `orders-${page}-${limit}-${JSON.stringify(filterParams)}`
  
  return useData(`/api/orders?${params}`, cacheKey, 30) // 30 seconds refresh
}

// Individual order details
export function useOrder(orderId: string) {
  const cacheKey = `order-${orderId}`
  return useData(`/api/orders/${orderId}`, cacheKey, 300) // 5 minutes refresh
}

// Products with variants and reviews
export function useProducts() {
  return useData('/api/products', 'products-all', 600) // 10 minutes refresh
}

// Users/customers with analytics
export function useUsers(
  page = 1, 
  limit = 50,
  search?: string,
  phoneVerified?: string[],
  lastOrdered?: string[]
) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && search.trim() && { search: search.trim() }),
    ...(phoneVerified && phoneVerified.length > 0 && { phoneVerified: phoneVerified.join(',') }),
    ...(lastOrdered && lastOrdered.length > 0 && { lastOrdered: lastOrdered.join(',') })
  })
  
  // Create cache key that includes all filter parameters
  const filterParams = {
    search: search || '',
    phoneVerified: phoneVerified?.sort().join(',') || '',
    lastOrdered: lastOrdered?.sort().join(',') || ''
  }
  const cacheKey = `users-${page}-${limit}-${JSON.stringify(filterParams)}`
  
  return useData(`/api/users?${params}`, cacheKey, 300) // 5 minutes refresh
}

// Reviews with moderation
export function useReviews(
  page = 1, 
  limit = 50, 
  approved?: boolean,
  search?: string,
  rating?: string[]
) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(approved !== undefined && { approved: approved.toString() }),
    ...(search && search.trim() && { search: search.trim() }),
    ...(rating && rating.length > 0 && { rating: rating.join(',') })
  })
  
  // Create cache key that includes all filter parameters
  const filterParams = {
    approved: approved !== undefined ? approved.toString() : 'all',
    search: search || '',
    rating: rating?.sort().join(',') || ''
  }
  const cacheKey = `reviews-${page}-${limit}-${JSON.stringify(filterParams)}`
  
  return useData(`/api/reviews?${params}`, cacheKey, 120) // 2 minutes refresh
}

// Offers and promotions
export function useOffers(page = 1, limit = 50) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  })
  
  const cacheKey = `offers-${page}-${limit}`
  return useData(`/api/offers?${params}`, cacheKey, 300) // 5 minutes refresh
}

// Marketing campaigns
export function useCampaigns() {
  return useData('/api/campaigns', 'campaigns-utm-analytics', 300) // 5 minutes refresh
}

// Staff management
export function useStaff(page = 1, limit = 50) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  })
  
  const cacheKey = `staff-${page}-${limit}`
  return useData(`/api/staff?${params}`, cacheKey, 900) // 15 minutes refresh
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