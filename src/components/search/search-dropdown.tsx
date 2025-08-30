"use client"

import { useRouter } from "next/navigation"
import { 
  Users, 
  ShoppingCart, 
  MessageSquare,
  ArrowRight,
  Search
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  SearchResult,
  SearchResponse,
  SEARCH_CATEGORIES,
  getSearchResultUrl,
  getStatusBadgeVariant,
  highlightSearchTerm
} from "@/lib/search-utils"

interface SearchDropdownProps {
  results: SearchResponse | null
  isLoading: boolean
  isOpen: boolean
  onResultClick: (result: SearchResult) => void
  onViewAll: (category: keyof SearchResponse['categories']) => void
}

const categoryIcons = {
  users: Users,
  orders: ShoppingCart,
  reviews: MessageSquare
}

export function SearchDropdown({ 
  results, 
  isLoading, 
  isOpen,
  onResultClick, 
  onViewAll 
}: SearchDropdownProps) {
  if (!isOpen) return null

  if (isLoading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-md shadow-lg z-50 w-full max-w-4xl">
        <div className="py-6">
          <div className="flex items-center justify-center space-x-2">
            <Search className="h-4 w-4 animate-pulse" />
            <span className="text-sm text-muted-foreground">Searching...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-md shadow-lg z-50 w-full max-w-4xl">
        <div className="py-6">
          <div className="text-center text-sm text-muted-foreground px-4">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Start typing to search across users, orders, and reviews...
          </div>
        </div>
      </div>
    )
  }

  if (results.totalResults === 0) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-md shadow-lg z-50 w-full max-w-4xl">
        <div className="py-6">
          <div className="text-center text-sm text-muted-foreground px-4">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <span className="block truncate">No results found for "{results.query}"</span>
          </div>
        </div>
      </div>
    )
  }

  const hasResults = (category: keyof SearchResponse['categories']) => 
    results.categories[category].length > 0

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-md shadow-lg z-50 w-full max-w-4xl">
      <div className="max-h-[70vh] overflow-y-auto scrollbar-thin">
        <div className="py-2 min-w-0">
          {/* Results Summary */}
          <div className="px-4 py-2 border-b min-w-0">
            <span className="text-sm font-medium truncate block">
              {results.totalResults} result{results.totalResults !== 1 ? 's' : ''} for "{results.query}"
            </span>
          </div>

          {/* Categories */}
          {Object.entries(SEARCH_CATEGORIES).map(([key, config]) => {
            const categoryKey = key as keyof SearchResponse['categories']
            const categoryResults = results.categories[categoryKey]
            
            if (categoryResults.length === 0) return null

            const Icon = categoryIcons[categoryKey]

            return (
              <div key={categoryKey}>
                <div className="px-4 py-3 min-w-0">
                  <div className="flex items-center justify-between mb-2 min-w-0">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium truncate">{config.label}</span>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {categoryResults.length}
                      </Badge>
                    </div>
                    {categoryResults.length >= 5 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-xs flex-shrink-0"
                        onClick={() => onViewAll(categoryKey)}
                      >
                        View All
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1">
                    {categoryResults.map((result, index) => (
                      <SearchResultItem
                        key={`${result.type}-${result.id}-${index}`}
                        result={result}
                        query={results.query}
                        onClick={() => onResultClick(result)}
                      />
                    ))}
                  </div>
                </div>
                {categoryKey !== 'reviews' && hasResults(categoryKey) && (
                  <Separator />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface SearchResultItemProps {
  result: SearchResult
  query: string
  onClick: () => void
}

function SearchResultItem({ result, query, onClick }: SearchResultItemProps) {
  return (
    <button
      className="w-full text-left p-2 rounded-md hover:bg-muted/50 focus:bg-muted/50 focus:outline-none transition-colors min-w-0 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between min-w-0 gap-2">
        <div className="min-w-0 flex-1">
          <div 
            className="font-medium text-sm truncate"
            dangerouslySetInnerHTML={{ 
              __html: highlightSearchTerm(result.title, query) 
            }}
          />
          <div 
            className="text-xs text-muted-foreground truncate mt-0.5"
            dangerouslySetInnerHTML={{ 
              __html: highlightSearchTerm(result.subtitle, query) 
            }}
          />
        </div>
        
        <div className="flex items-center space-x-2 flex-shrink-0">
          {result.metadata?.status && (
            <Badge 
              variant={getStatusBadgeVariant(result.metadata.status, result.type) as any}
              className="text-xs"
            >
              {result.metadata.status}
            </Badge>
          )}
          {result.metadata?.rating && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              ★{result.metadata.rating}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}