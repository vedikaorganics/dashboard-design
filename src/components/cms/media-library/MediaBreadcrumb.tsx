'use client'

import { useMemo } from 'react'
import { Home, ChevronRight } from 'lucide-react'
import { 
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MediaFolder } from '@/types/cms'
import { normalizeFolderPath } from '@/lib/media-path-utils'
import { cn } from '@/lib/utils'

interface BreadcrumbSegment {
  label: string
  path: string
  isRoot: boolean
  isCurrent: boolean
}

interface MediaBreadcrumbProps {
  currentPath: string
  folders?: MediaFolder[]
  onNavigate: (path: string) => void
  maxItems?: number
  className?: string
}

export function MediaBreadcrumb({
  currentPath,
  folders = [],
  onNavigate,
  maxItems = 5,
  className
}: MediaBreadcrumbProps) {
  // Parse the current path into breadcrumb segments
  const breadcrumbs = useMemo((): BreadcrumbSegment[] => {
    const normalizedPath = normalizeFolderPath(currentPath)
    
    // Always start with root/home
    const segments: BreadcrumbSegment[] = [{
      label: 'All Media',
      path: '/',
      isRoot: true,
      isCurrent: normalizedPath === '/'
    }]
    
    // If we're not at root, add path segments
    if (normalizedPath !== '/') {
      const pathParts = normalizedPath.split('/').filter(Boolean)
      let currentSegmentPath = ''
      
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i]
        currentSegmentPath += '/' + part
        const isLast = i === pathParts.length - 1
        
        segments.push({
          label: part,
          path: currentSegmentPath,
          isRoot: false,
          isCurrent: isLast
        })
      }
    }
    
    return segments
  }, [currentPath])
  
  // Handle long paths by collapsing middle segments
  const displayBreadcrumbs = useMemo(() => {
    if (breadcrumbs.length <= maxItems) {
      return { segments: breadcrumbs, hasEllipsis: false, hiddenSegments: [] }
    }
    
    // Show first item, ellipsis, and last 2 items
    const first = breadcrumbs[0]
    const lastTwo = breadcrumbs.slice(-2)
    const hidden = breadcrumbs.slice(1, -2)
    
    return {
      segments: [first, ...lastTwo],
      hasEllipsis: true,
      hiddenSegments: hidden
    }
  }, [breadcrumbs, maxItems])
  
  const handleNavigation = (path: string) => {
    onNavigate(path)
  }
  
  return (
    <div className={cn("px-4 py-3 border-b bg-background/95", className)}>
      <Breadcrumb>
        <BreadcrumbList className="text-xs">
          {displayBreadcrumbs.segments.map((segment, index) => {
            const isLast = index === displayBreadcrumbs.segments.length - 1
            const showEllipsis = displayBreadcrumbs.hasEllipsis && index === 1
            
            return (
              <div key={segment.path} className="contents">
                {/* Show ellipsis after first item if path is collapsed */}
                {showEllipsis && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="flex items-center gap-1 hover:text-foreground"
                            aria-label="Show more breadcrumbs"
                          >
                            <BreadcrumbEllipsis />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {displayBreadcrumbs.hiddenSegments.map((hiddenSegment) => (
                            <DropdownMenuItem
                              key={hiddenSegment.path}
                              onClick={() => handleNavigation(hiddenSegment.path)}
                              className="cursor-pointer"
                            >
                              {hiddenSegment.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </>
                )}
                
                <BreadcrumbItem>
                  {segment.isCurrent ? (
                    <BreadcrumbPage className="max-w-24 truncate text-xs">
                      {segment.isRoot ? (
                        <Home className="w-3 h-3" />
                      ) : (
                        segment.label
                      )}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      onClick={() => handleNavigation(segment.path)}
                      className="max-w-24 truncate text-xs"
                    >
                      {segment.isRoot ? (
                        <Home className="w-3 h-3" />
                      ) : (
                        segment.label
                      )}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                
                {/* Separator after each item except the last */}
                {!isLast && !showEllipsis && <BreadcrumbSeparator />}
              </div>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}

export default MediaBreadcrumb