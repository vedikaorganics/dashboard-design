export interface SearchResult {
  id: string
  type: 'user' | 'order' | 'review'
  title: string
  subtitle: string
  metadata: Record<string, any>
}

export interface SearchResponse {
  query: string
  totalResults: number
  categories: {
    users: SearchResult[]
    orders: SearchResult[]
    reviews: SearchResult[]
  }
}

export const SEARCH_CATEGORIES = {
  users: { label: 'Users', icon: 'Users', route: '/users' },
  orders: { label: 'Orders', icon: 'ShoppingCart', route: '/orders' },
  reviews: { label: 'Reviews', icon: 'MessageSquare', route: '/reviews' }
} as const

export function getSearchResultUrl(result: SearchResult): string {
  const baseRoutes = {
    user: '/users',
    order: '/orders',
    review: '/reviews'
  }
  
  // For reviews, go to the reviews page with search filter instead of detail page
  if (result.type === 'review') {
    // Use the author name as the search query
    const searchQuery = result.title.replace('Review by ', '')
    return `${baseRoutes[result.type]}?search=${encodeURIComponent(searchQuery)}`
  }
  
  return `${baseRoutes[result.type]}/${result.id}`
}

export function formatSearchResultSubtitle(result: SearchResult): string {
  switch (result.type) {
    case 'order':
      return result.metadata?.totalAmount 
        ? `${result.subtitle} - $${result.metadata.totalAmount.toFixed(2)}`
        : result.subtitle
    case 'review':
      return result.metadata?.rating 
        ? `${result.subtitle} (${result.metadata.rating}★)`
        : result.subtitle
    default:
      return result.subtitle
  }
}

export function getStatusBadgeVariant(status: string, type: SearchResult['type']) {
  switch (type) {
    case 'order':
      return {
        pending: 'secondary',
        processing: 'default',
        shipped: 'default',
        delivered: 'default',
        cancelled: 'destructive'
      }[status.toLowerCase()] || 'secondary'
    
    case 'user':
      return {
        active: 'default',
        inactive: 'secondary',
        suspended: 'destructive'
      }[status.toLowerCase()] || 'secondary'
    
    case 'review':
      return {
        true: 'default',
        false: 'secondary'
      }[status.toString()] || 'secondary'
    
    default:
      return 'secondary'
  }
}

export function highlightSearchTerm(text: string | null | undefined, searchTerm: string): string {
  if (!text || !searchTerm.trim()) return text || ''
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900 rounded px-0.5">$1</mark>')
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export const SEARCH_SHORTCUTS = {
  open: ['cmd+k', 'ctrl+k'],
  close: ['escape'],
  navigate: ['arrowdown', 'arrowup'],
  select: ['enter']
} as const