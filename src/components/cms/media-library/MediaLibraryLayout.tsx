'use client'

import React, { useState, useRef, useCallback, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { GripVertical } from 'lucide-react'

interface MediaLibraryLayoutProps {
  sidebar: ReactNode
  header: ReactNode
  breadcrumb?: ReactNode
  content: ReactNode
  details?: ReactNode
  statusBar?: ReactNode
}

export function MediaLibraryLayout({
  sidebar,
  header,
  breadcrumb,
  content,
  details,
  statusBar
}: MediaLibraryLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [detailsWidth, setDetailsWidth] = useState(320)
  const [isDragging, setIsDragging] = useState<'sidebar' | 'details' | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const sidebarResizerRef = useRef<HTMLDivElement>(null)
  const detailsResizerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((type: 'sidebar' | 'details') => (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(type)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    
    if (isDragging === 'sidebar') {
      const newWidth = Math.max(200, Math.min(400, e.clientX - containerRect.left))
      setSidebarWidth(newWidth)
    } else if (isDragging === 'details') {
      const newWidth = Math.max(280, Math.min(500, containerRect.right - e.clientX))
      setDetailsWidth(newWidth)
    }
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(null)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  // Add global mouse event listeners
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {header}
      </div>

      {/* Breadcrumb */}
      {breadcrumb && (
        <div className="flex-shrink-0">
          {breadcrumb}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div 
          className="flex-shrink-0 bg-muted/20 relative"
          style={{ width: sidebarWidth }}
        >
          <div className="h-full overflow-auto">
            {sidebar}
          </div>
          
          {/* Sidebar Resizer */}
          <div
            ref={sidebarResizerRef}
            className={cn(
              "absolute top-0 right-0 w-1 h-full cursor-col-resize group",
              "hover:bg-primary/20 transition-colors",
              isDragging === 'sidebar' && "bg-primary/30"
            )}
            onMouseDown={handleMouseDown('sidebar')}
          >
            <div className="absolute inset-y-0 right-0 w-px bg-border" />
            <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="w-3 h-3 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div 
          className="flex-1 flex flex-col overflow-hidden"
          style={{
            width: showDetails 
              ? `calc(100% - ${sidebarWidth}px - ${detailsWidth}px)` 
              : `calc(100% - ${sidebarWidth}px)`
          }}
        >
          <div className="flex-1 overflow-auto">
            {content}
          </div>
        </div>

        {/* Details Panel */}
        {showDetails && details && (
          <div 
            className="flex-shrink-0 bg-muted/10 relative"
            style={{ width: detailsWidth }}
          >
            {/* Details Resizer */}
            <div
              ref={detailsResizerRef}
              className={cn(
                "absolute top-0 left-0 w-1 h-full cursor-col-resize group",
                "hover:bg-primary/20 transition-colors",
                isDragging === 'details' && "bg-primary/30"
              )}
              onMouseDown={handleMouseDown('details')}
            >
              <div className="absolute inset-y-0 left-0 w-px bg-border" />
              <div className="absolute top-1/2 left-0 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-3 h-3 text-muted-foreground" />
              </div>
            </div>
            
            <div className="h-full overflow-auto pl-2">
              {details}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      {statusBar && (
        <div className="flex-shrink-0 border-t bg-muted/30">
          {statusBar}
        </div>
      )}
    </div>
  )
}

// Export hook for controlling details panel
export function useMediaDetails() {
  const [showDetails, setShowDetails] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)

  const openDetails = useCallback((asset: any) => {
    setSelectedAsset(asset)
    setShowDetails(true)
  }, [])

  const closeDetails = useCallback(() => {
    setShowDetails(false)
    setSelectedAsset(null)
  }, [])

  return {
    showDetails,
    selectedAsset,
    openDetails,
    closeDetails,
    setShowDetails
  }
}