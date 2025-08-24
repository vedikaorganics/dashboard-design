// In-memory cache for blazing fast performance
class MemoryCache {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()

  set(key: string, data: unknown, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    })
  }

  get(key: string): unknown | null {
    const item = this.cache.get(key)
    if (!item) return null

    const isExpired = Date.now() - item.timestamp > item.ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Get cache stats for monitoring
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

export const cache = new MemoryCache()

// Cache key generators
export const cacheKeys = {
  dashboard: 'dashboard-overview',
  orders: (page = 1, limit = 50, status?: string) => 
    `orders-${page}-${limit}-${status || 'all'}`,
  products: 'products-all',
  users: (page = 1, limit = 50) => `users-${page}-${limit}`,
  reviews: (page = 1, limit = 50, approved?: boolean) => 
    `reviews-${page}-${limit}-${approved || 'all'}`,
  offers: 'offers-all',
  campaigns: 'campaigns-utm-analytics',
  staff: 'staff-all'
}