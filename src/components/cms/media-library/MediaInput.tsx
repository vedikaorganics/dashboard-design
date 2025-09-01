'use client'

import { useState } from 'react'
import { Image as ImageIcon, Video, X, ExternalLink, Edit, MousePointer, Link } from 'lucide-react'
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
  value: string | { url: string; assetId?: string; filename?: string } | undefined
  onChange: (value: { url: string; assetId?: string; filename?: string } | undefined) => void
  accept?: 'image' | 'video' | 'all'
  placeholder?: string
  required?: boolean
  className?: string
  showUrlInput?: boolean
  allowClear?: boolean
  allowDragDrop?: boolean
}

export function MediaInput({
  label,
  value,
  onChange,
  accept = 'all',
  placeholder = 'Select or enter URL...',
  required = false,
  className,
  showUrlInput = true,
  allowClear = true,
  allowDragDrop = true
}: MediaInputProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [isUrlInputVisible, setIsUrlInputVisible] = useState(false)
  const [urlValue, setUrlValue] = useState('')

  const currentUrl = value ? getMediaUrl(value) : ''
  const currentAssetId = value ? getMediaAssetId(value) : undefined
  const currentFilename = value ? getMediaFilename(value) : undefined

  const handleMediaSelect = (assets: MediaAsset[]) => {
    if (assets.length > 0) {
      const asset = assets[0]
      onChange(createMediaRef(asset.url, asset._id, asset.filename))
    }
  }

  const handleDropZoneUpload = (assets: MediaAsset[]) => {
    if (assets.length > 0) {
      const asset = assets[0]
      onChange(createMediaRef(asset.url, asset._id, asset.filename))
    }
  }


  const handleUrlSubmit = () => {
    if (urlValue.trim()) {
      onChange(createMediaRef(urlValue.trim()))
      setUrlValue('')
      setIsUrlInputVisible(false)
    }
  }

  const handleClear = () => {
    onChange(undefined)
  }

  const getMediaType = (url: string): 'image' | 'video' | 'unknown' => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    
    const extension = url.toLowerCase().substring(url.lastIndexOf('.'))
    
    if (videoExtensions.includes(extension)) return 'video'
    if (imageExtensions.includes(extension)) return 'image'
    if (url.includes('youtube.com') || url.includes('vimeo.com')) return 'video'
    
    return 'unknown'
  }

  const renderPreview = () => {
    if (!currentUrl) return null

    const mediaType = getMediaType(currentUrl)
    
    return (
      <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted border">
        {mediaType === 'image' ? (
          <img
            src={currentUrl}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              target.nextElementSibling!.classList.remove('hidden')
            }}
          />
        ) : mediaType === 'video' ? (
          <video
            src={currentUrl}
            className="w-full h-full object-cover"
            muted
            onError={(e) => {
              const target = e.target as HTMLVideoElement
              target.style.display = 'none'
              target.nextElementSibling!.classList.remove('hidden')
            }}
          />
        ) : null}
        
        {/* Fallback icon */}
        <div className="absolute inset-0 flex items-center justify-center bg-muted hidden">
          {mediaType === 'video' ? (
            <Video className="w-6 h-6 text-muted-foreground" />
          ) : (
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
          )}
        </div>

        {/* Overlay with actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center space-x-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="h-6 w-6 p-0"
                onClick={() => setShowPicker(true)}
              >
                <Edit className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Change media</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="h-6 w-6 p-0"
                onClick={() => window.open(currentUrl, '_blank')}
              >
                <ExternalLink className="w-3 h-3" />
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
                  className="h-6 w-6 p-0"
                  onClick={handleClear}
                >
                  <X className="w-3 h-3" />
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
        <div className="flex items-center space-x-3">
          {renderPreview()}
          <div className="flex-1 min-w-0">
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
              {showUrlInput && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsUrlInputVisible(true)}
                  className="h-8 text-xs"
                >
                  <Link className="w-3 h-3 mr-1" />
                  Enter URL
                </Button>
              )}
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
                  {showUrlInput && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsUrlInputVisible(!isUrlInputVisible)
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Link className="w-4 h-4 mr-2" />
                      Enter URL
                    </Button>
                  )}
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
              {showUrlInput && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsUrlInputVisible(!isUrlInputVisible)
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Link className="w-4 h-4 mr-2" />
                  Enter URL
                </Button>
              )}
            </div>
          )}

          {isUrlInputVisible && (
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  className="text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUrlSubmit()
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleUrlSubmit}
                  disabled={!urlValue.trim()}
                >
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{placeholder}</p>
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