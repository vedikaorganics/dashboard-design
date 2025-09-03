'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { 
  X,
  ChevronLeft, 
  ChevronRight,
  Download,
  ExternalLink,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Info,
  Share2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from '@/components/ui/dialog'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MediaAsset } from '@/types/cms'
import { cn } from '@/lib/utils'
import { getVideoMp4Url, getImageVariant, getVideoEmbedUrl } from '@/lib/cloudflare'

interface MediaGalleryProps {
  assets: MediaAsset[]
  isOpen: boolean
  onClose: () => void
  initialIndex?: number
  onAssetChange?: (asset: MediaAsset, index: number) => void
}

export function MediaGallery({
  assets,
  isOpen,
  onClose,
  initialIndex = 0,
  onAssetChange
}: MediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState([50])
  const [zoom, setZoom] = useState(1)
  const [showInfo, setShowInfo] = useState(false)

  const currentAsset = assets[currentIndex]
  
  // Update initial index when it changes
  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  // Update parent when asset changes
  useEffect(() => {
    if (currentAsset && onAssetChange) {
      onAssetChange(currentAsset, currentIndex)
    }
  }, [currentAsset, currentIndex, onAssetChange])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          goToPrevious()
          break
        case 'ArrowRight':
          goToNext()
          break
        case ' ':
          e.preventDefault()
          if (currentAsset?.type === 'video') {
            togglePlayPause()
          }
          break
        case 'i':
        case 'I':
          setShowInfo(!showInfo)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex, assets.length, isPlaying, showInfo])


  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : assets.length - 1)
    setZoom(1)
  }, [assets.length])

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => prev < assets.length - 1 ? prev + 1 : 0)
    setZoom(1)
  }, [assets.length])

  const togglePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.5, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.5, 0.5))
  }, [])

  const resetZoom = useCallback(() => {
    setZoom(1)
  }, [])


  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  if (!isOpen || !currentAsset) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/90" />
      <DialogContent 
        className="max-w-none w-screen h-screen p-0 border-none bg-transparent shadow-none rounded-none outline-none focus:outline-none focus:ring-0"
        showCloseButton={false}
      >
        <VisuallyHidden.Root>
          <DialogTitle>Media Gallery</DialogTitle>
        </VisuallyHidden.Root>
        {/* Main Content - Full screen centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {currentAsset.type === 'image' ? (
              <div 
                className="relative transition-transform duration-200"
                style={{ transform: `scale(${zoom})` }}
              >
                <Image
                  src={currentAsset.type === 'image' && currentAsset.metadata?.variants ? 
                    currentAsset.metadata.variants.find(v => v.includes('/public')) || currentAsset.metadata.variants[0] : 
                    currentAsset.url}
                  alt={currentAsset.alt || currentAsset.filename}
                  width={currentAsset.dimensions?.width || 800}
                  height={currentAsset.dimensions?.height || 600}
                  className="object-contain max-w-[90vw] max-h-[90vh]"
                  priority
                  unoptimized
                />
              </div>
            ) : currentAsset.type === 'video' ? (
              <iframe
                key={currentAsset._id}
                src={getVideoEmbedUrl(currentAsset.metadata?.cloudflareId || currentAsset.url)}
                className="max-w-[90vw] max-h-[90vh] w-full h-[70vh] border-0"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
              />
            ) : null}
          </div>
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-medium truncate max-w-md">
                {currentAsset.filename}
              </h2>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {currentIndex + 1} of {assets.length}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInfo(!showInfo)}
                    className="text-white hover:bg-white/20 h-9 w-9 p-0"
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle Info ({showInfo ? 'Hide' : 'Show'})</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(currentAsset.url, '_blank')}
                    className="text-white hover:bg-white/20 h-9 w-9 p-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Open in New Tab</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 h-9 w-9 p-0"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download</p>
                </TooltipContent>
              </Tooltip>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 h-9 w-9 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        {assets.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="lg"
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-40 text-white hover:bg-white/20 rounded-full h-12 w-12 p-0"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-40 text-white hover:bg-white/20 rounded-full h-12 w-12 p-0"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </>
        )}

        {/* Image Controls */}
        {currentAsset.type === 'image' && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-40 flex items-center space-x-2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Zoom Out</p>
              </TooltipContent>
            </Tooltip>
            
            <span className="text-white text-sm min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Zoom In</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetZoom}
                  className="text-white hover:bg-white/20 h-8 px-2"
                >
                  Reset
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset Zoom</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Info Panel */}
        {showInfo && (
          <div className="absolute top-20 right-4 bottom-4 w-80 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white overflow-y-auto">
            <h3 className="font-semibold mb-3">Asset Information</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-300">Name:</span>
                <p className="break-all">{currentAsset.filename}</p>
              </div>
              
              <div>
                <span className="text-gray-300">Type:</span>
                <p>{currentAsset.type.toUpperCase()}</p>
              </div>
              
              <div>
                <span className="text-gray-300">Size:</span>
                <p>{formatFileSize(currentAsset.size)}</p>
              </div>
              
              {currentAsset.dimensions && (
                <div>
                  <span className="text-gray-300">Dimensions:</span>
                  <p>{currentAsset.dimensions.width} × {currentAsset.dimensions.height}</p>
                </div>
              )}
              
              {currentAsset.alt && (
                <div>
                  <span className="text-gray-300">Alt Text:</span>
                  <p>{currentAsset.alt}</p>
                </div>
              )}
              
              {currentAsset.caption && (
                <div>
                  <span className="text-gray-300">Caption:</span>
                  <p>{currentAsset.caption}</p>
                </div>
              )}
              
              {currentAsset.tags && currentAsset.tags.length > 0 && (
                <div>
                  <span className="text-gray-300">Tags:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentAsset.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-white/20 text-white border-white/30">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filmstrip Navigation */}
        {assets.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-40">
            <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-2 max-w-md overflow-x-auto">
              {assets.slice(Math.max(0, currentIndex - 3), currentIndex + 4).map((asset, index) => {
                const actualIndex = Math.max(0, currentIndex - 3) + index
                return (
                  <button
                    key={asset._id}
                    onClick={() => setCurrentIndex(actualIndex)}
                    className={cn(
                      "flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all",
                      actualIndex === currentIndex ? "border-white shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <Image
                      src={asset.thumbnailUrl}
                      alt={asset.alt || asset.filename}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}