'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CMSContent } from '@/types/cms'
import { TextBlock } from '../blocks/TextBlock'
import { ImageBlock } from '../blocks/ImageBlock'
import { GalleryBlock } from '../blocks/GalleryBlock'
import { cn } from '@/lib/utils'

interface PagePreviewProps {
  content: CMSContent
  device: 'desktop' | 'tablet' | 'mobile'
  onDeviceChange: (device: 'desktop' | 'tablet' | 'mobile') => void
  onClose: () => void
  className?: string
}

export function PagePreview({ 
  content, 
  device, 
  onDeviceChange, 
  onClose, 
  className 
}: PagePreviewProps) {
  const [refreshKey, setRefreshKey] = useState(0)
  const previewRef = useRef<HTMLDivElement>(null)

  // Refresh preview
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  // Get device-specific styles
  const getDeviceStyles = () => {
    switch (device) {
      case 'mobile':
        return {
          width: '375px',
          height: '812px',
          maxWidth: '100%',
          maxHeight: '100%'
        }
      case 'tablet':
        return {
          width: '768px',
          height: '1024px',
          maxWidth: '100%',
          maxHeight: '100%'
        }
      case 'desktop':
      default:
        return {
          width: '100%',
          height: '100%'
        }
    }
  }

  // Render block based on type
  const renderBlock = (block: any, index: number) => {
    // Block styling will be handled by individual block components
    const blockStyle = {}

    const blockClassName = cn(
      'block-preview'
    )

    const commonProps = {
      key: `${block.id}-${refreshKey}`,
      style: blockStyle,
      className: blockClassName
    }

    // Render different block types
    switch (block.type) {
      case 'text':
        return (
          <div {...commonProps}>
            <TextBlock content={block.content} isEditing={false} />
          </div>
        )
      
      case 'image':
        return (
          <div {...commonProps}>
            <ImageBlock content={block.content} isEditing={false} />
          </div>
        )
      
      case 'gallery':
        return (
          <div {...commonProps}>
            <GalleryBlock content={block.content} isEditing={false} />
          </div>
        )
      
      case 'spacer':
        const spacerHeight = block.content?.height?.[device] || block.content?.height?.desktop || 50
        return (
          <div 
            {...commonProps}
            style={{
              ...blockStyle,
              height: `${spacerHeight}px`
            }}
          />
        )
      
      case 'custom-html':
        return (
          <div 
            {...commonProps}
            dangerouslySetInnerHTML={{ __html: block.content?.html || '' }}
          />
        )
      
      default:
        return (
          <div {...commonProps}>
            <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-lg">
              <p className="font-medium mb-2">{block.type.replace('-', ' ').toUpperCase()} Block</p>
              <p className="text-sm">Preview for this block type is coming soon...</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Preview header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold">Preview</h3>
          <span className="text-sm text-muted-foreground capitalize">
            {device} view
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Open preview in new tab (would need a preview endpoint)
              const previewUrl = `/preview/${content.slug}?device=${device}`
              window.open(previewUrl, '_blank')
            }}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className="flex justify-center">
          <div 
            ref={previewRef}
            className={cn(
              'bg-white shadow-lg overflow-hidden',
              device === 'mobile' && 'rounded-3xl',
              device === 'tablet' && 'rounded-xl',
              device === 'desktop' && 'rounded-lg w-full'
            )}
            style={getDeviceStyles()}
          >
            {/* Page content */}
            <div className="h-full overflow-auto">
              {/* SEO meta preview (only for desktop) */}
              {device === 'desktop' && content.seo && (
                <div className="p-4 bg-blue-50 border-b text-xs">
                  <div className="font-medium text-blue-900 truncate">
                    {content.seo.title || content.title}
                  </div>
                  <div className="text-green-700 truncate">
                    https://yoursite.com/{content.slug}
                  </div>
                  <div className="text-gray-600 mt-1 line-clamp-2">
                    {content.seo.description || 'No meta description provided'}
                  </div>
                </div>
              )}

              {/* Page header */}
              <div className="p-4 bg-white border-b">
                <div className="text-sm font-medium">Site Header</div>
                <div className="text-xs text-muted-foreground">
                  Navigation, logo, etc. would appear here
                </div>
              </div>

              {/* Blocks */}
              <div className="min-h-screen">
                {content.blocks.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center text-muted-foreground">
                      <p className="text-lg font-medium mb-2">No content</p>
                      <p className="text-sm">Add blocks to see them here</p>
                    </div>
                  </div>
                ) : (
                  content.blocks
                    .sort((a, b) => a.order - b.order)
                    .map(renderBlock)
                )}
              </div>

              {/* Page footer */}
              <div className="p-4 bg-gray-50 border-t mt-auto">
                <div className="text-sm font-medium">Site Footer</div>
                <div className="text-xs text-muted-foreground">
                  Footer content would appear here
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview footer */}
      <div className="p-2 border-t bg-muted/50 text-xs text-muted-foreground">
        <div className="flex justify-between items-center">
          <span>
            {device === 'mobile' && '375 × 812px (iPhone 12)'}
            {device === 'tablet' && '768 × 1024px (iPad)'}
            {device === 'desktop' && 'Responsive desktop view'}
          </span>
          <span>{content.blocks.length} blocks</span>
        </div>
      </div>
    </div>
  )
}