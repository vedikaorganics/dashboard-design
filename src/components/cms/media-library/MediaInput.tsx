'use client'

import { useState } from 'react'
import { Image as ImageIcon, Video, X, ExternalLink, Edit, MousePointer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MediaAsset } from '@/types/cms'
import { MediaPicker } from './MediaPicker'
import { MediaDropZone } from './MediaDropZone'
import { createMediaRef, getMediaUrl, getMediaAssetId, getMediaFilename } from '@/types/cms'
import { cn } from '@/lib/utils'

interface MediaInputProps {
  label: string
  value: string | { url: string; assetId?: string; filename?: string; dimensions?: { width: number; height: number } } | undefined
  onChange: (value: { url: string; assetId?: string; filename?: string; dimensions?: { width: number; height: number } } | undefined) => void
  accept?: 'image' | 'video' | 'all'
  placeholder?: string
  required?: boolean
  className?: string
  showUrlInput?: boolean
  allowClear?: boolean
  allowDragDrop?: boolean
  previewSize?: 'sm' | 'md' | 'lg'
}

export function MediaInput({
  label,
  value,
  onChange,
  accept = 'all',
  placeholder = 'Select media from library...',
  required = false,
  className,
  showUrlInput = false,
  allowClear = true,
  allowDragDrop = true,
  previewSize = 'sm'
}: MediaInputProps) {
  const [showPicker, setShowPicker] = useState(false)

  const currentUrl = value ? getMediaUrl(value) : ''
  const currentAssetId = value ? getMediaAssetId(value) : undefined
  const currentFilename = value ? getMediaFilename(value) : undefined

  const handleMediaSelect = (assets: MediaAsset[]) => {
    if (assets.length > 0) {
      const asset = assets[0]
      onChange({
        url: asset.url,
        assetId: asset._id,
        filename: asset.filename,
        dimensions: asset.dimensions
      })
    }
  }

  const handleDropZoneUpload = (assets: MediaAsset[]) => {
    if (assets.length > 0) {
      const asset = assets[0]
      onChange({
        url: asset.url,
        assetId: asset._id,
        filename: asset.filename,
        dimensions: asset.dimensions
      })
    }
  }



  const handleClear = () => {
    onChange(undefined)
  }

  const getMediaType = (url: string): 'image' | 'video' | 'unknown' => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    
    // Check for Cloudflare Images URLs
    if (url.includes('imagedelivery.net')) return 'image'
    
    // Check for other known image/video services
    if (url.includes('youtube.com') || url.includes('vimeo.com')) return 'video'
    if (url.includes('images.') || url.includes('cdn.') || url.includes('imgur.com')) return 'image'
    
    // Check file extensions
    const extension = url.toLowerCase().substring(url.lastIndexOf('.'))
    if (videoExtensions.includes(extension)) return 'video'
    if (imageExtensions.includes(extension)) return 'image'
    
    // For MediaInput with accept="image", assume it's an image
    if (accept === 'image') return 'image'
    if (accept === 'video') return 'video'
    
    return 'unknown'
  }

  const getPreviewDimensions = () => {
    switch (previewSize) {
      case 'sm':
        return 'w-16 h-16'
      case 'md':
        return 'w-24 h-24'
      case 'lg':
        return 'w-full h-48' // Fixed height for large preview
      default:
        return 'w-16 h-16'
    }
  }

  const renderPreview = () => {
    if (!currentUrl) return null

    const mediaType = getMediaType(currentUrl)
    const dimensions = getPreviewDimensions()
    
    return (
      <div className={cn("relative rounded-md overflow-hidden bg-muted border", dimensions)}>
        {mediaType === 'image' ? (
          <>
            <img
              src={currentUrl}
              alt="Preview"
              className="w-full h-full object-cover"
              onLoad={(e) => {
                // Hide fallback when image loads successfully
                const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon')
                if (fallback) {
                  fallback.classList.add('hidden')
                }
              }}
              onError={(e) => {
                // Show fallback when image fails to load
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const fallback = target.parentElement?.querySelector('.fallback-icon')
                if (fallback) {
                  fallback.classList.remove('hidden')
                }
              }}
            />
            {/* Fallback icon for images */}
            <div className="fallback-icon absolute inset-0 flex items-center justify-center bg-muted">
              <ImageIcon className={cn(
                "text-muted-foreground",
                previewSize === 'lg' ? "w-12 h-12" : "w-6 h-6"
              )} />
            </div>
          </>
        ) : mediaType === 'video' ? (
          <>
            <video
              src={currentUrl}
              className="w-full h-full object-cover"
              muted
              onLoadedData={(e) => {
                // Hide fallback when video loads successfully
                const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon')
                if (fallback) {
                  fallback.classList.add('hidden')
                }
              }}
              onError={(e) => {
                // Show fallback when video fails to load
                const target = e.target as HTMLVideoElement
                target.style.display = 'none'
                const fallback = target.parentElement?.querySelector('.fallback-icon')
                if (fallback) {
                  fallback.classList.remove('hidden')
                }
              }}
            />
            {/* Fallback icon for videos */}
            <div className="fallback-icon absolute inset-0 flex items-center justify-center bg-muted">
              <Video className={cn(
                "text-muted-foreground",
                previewSize === 'lg' ? "w-12 h-12" : "w-6 h-6"
              )} />
            </div>
          </>
        ) : (
          /* Unknown media type fallback */
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <ImageIcon className={cn(
              "text-muted-foreground",
              previewSize === 'lg' ? "w-12 h-12" : "w-6 h-6"
            )} />
          </div>
        )}

        {/* Overlay with actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center space-x-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className={cn(
                  "p-0",
                  previewSize === 'lg' ? "h-8 w-8" : "h-6 w-6"
                )}
                onClick={() => setShowPicker(true)}
              >
                <Edit className={previewSize === 'lg' ? "w-4 h-4" : "w-3 h-3"} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Change media</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className={cn(
                  "p-0",
                  previewSize === 'lg' ? "h-8 w-8" : "h-6 w-6"
                )}
                onClick={() => window.open(currentUrl, '_blank')}
              >
                <ExternalLink className={previewSize === 'lg' ? "w-4 h-4" : "w-3 h-3"} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open in new tab</TooltipContent>
          </Tooltip>

          {allowClear && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  className={cn(
                    "p-0",
                    previewSize === 'lg' ? "h-8 w-8" : "h-6 w-6"
                  )}
                  onClick={handleClear}
                >
                  <X className={previewSize === 'lg' ? "w-4 h-4" : "w-3 h-3"} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {currentAssetId && (
          <Badge variant="secondary" className="text-xs">
            From Library
          </Badge>
        )}
      </div>

      {currentUrl ? (
        <div className={cn(
          previewSize === 'lg' ? "space-y-3" : "flex items-center space-x-3"
        )}>
          {renderPreview()}
          <div className={cn(
            previewSize === 'lg' ? "" : "flex-1 min-w-0"
          )}>
            <p className="text-sm font-medium truncate">{currentFilename || currentUrl}</p>
            <div className="flex items-center space-x-2 mt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPicker(true)}
                className="h-8 text-xs"
              >
                <MousePointer className="w-3 h-3 mr-1" />
                Pick
              </Button>
              {allowClear && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClear}
                  className="h-8 text-xs text-destructive"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {allowDragDrop ? (
            <MediaDropZone
              accept={accept}
              maxFiles={1}
              onUpload={handleDropZoneUpload}
              className="py-6"
            >
              <div className="text-center space-y-3">
                <div className="text-sm text-muted-foreground mb-2">
                  Drop {accept === 'all' ? 'files' : accept + 's'} here or pick from library
                </div>
                <div className="flex space-x-2 justify-center">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowPicker(true)
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <MousePointer className="w-4 h-4 mr-2" />
                    Pick
                  </Button>
                </div>
              </div>
            </MediaDropZone>
          ) : (
            <div className="flex space-x-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowPicker(true)
                }}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <MousePointer className="w-4 h-4 mr-2" />
                Pick
              </Button>
            </div>
          )}

        </div>
      )}

      {/* Media Picker Modal */}
      <MediaPicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleMediaSelect}
        multiple={false}
        accept={accept}
        title={`Select ${accept === 'all' ? 'Media' : accept.charAt(0).toUpperCase() + accept.slice(1)}`}
      />

    </div>
  )
}