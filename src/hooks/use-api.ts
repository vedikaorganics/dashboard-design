import useSWR from 'swr/dist/index.js'
import type { SWRConfiguration } from 'swr/dist/index.js'
import { cache } from '@/lib/cache'

// Fast fetcher with built-in error handling
const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }
  return response.json()
}

// Default SWR config for blazing fast performance
const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: true,          // Refresh when tab regains focus
  revalidateOnReconnect: true,      // Refresh on network reconnect
  dedupingInterval: 2000,           // Dedupe requests within 2 seconds
  focusThrottleInterval: 5000,      // Throttle focus revalidation to 5 seconds
  refreshInterval: 300000,          // Auto refresh every 5 minutes
  errorRetryCount: 3,               // Retry failed requests 3 times
  errorRetryInterval: 1000,         // Wait 1 second between retries
  shouldRetryOnError: true,
  keepPreviousData: true,           // Keep previous data while loading new data
}

// Dashboard overview data
export function useDashboard() {
  return useSWR('/api/dashboard', fetcher, {
    ...defaultConfig,
    refreshInterval: 60000, // Refresh every minute for dashboard
  })
}

// Orders with pagination and filtering
export function useOrders(page = 1, limit = 50, status?: string) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status })
  })
  
  return useSWR(`/api/orders?${params}`, fetcher, {
    ...defaultConfig,
    refreshInterval: 30000, // Refresh every 30 seconds for orders
  })
}

// Products with variants and reviews
export function useProducts() {
  return useSWR('/api/products', fetcher, {
    ...defaultConfig,
    refreshInterval: 600000, // Refresh every 10 minutes (products change less frequently)
  })
}

// Users/customers with analytics
export function useUsers(page = 1, limit = 50) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  })
  
  return useSWR(`/api/users?${params}`, fetcher, defaultConfig)
}

// Reviews with moderation
export function useReviews(page = 1, limit = 50, approved?: boolean) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(approved !== undefined && { approved: approved.toString() })
  })
  
  return useSWR(`/api/reviews?${params}`, fetcher, {
    ...defaultConfig,
    refreshInterval: 120000, // Refresh every 2 minutes
  })
}

// Offers and promotions
export function useOffers() {
  return useSWR('/api/offers', fetcher, {
    ...defaultConfig,
    refreshInterval: 300000, // Refresh every 5 minutes
  })
}

// Marketing campaigns
export function useCampaigns() {
  return useSWR('/api/campaigns', fetcher, {
    ...defaultConfig,
    refreshInterval: 300000, // Refresh every 5 minutes
  })
}

// Staff management
export function useStaff() {
  return useSWR('/api/staff', fetcher, {
    ...defaultConfig,
    refreshInterval: 900000, // Refresh every 15 minutes (staff changes rarely)
  })
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