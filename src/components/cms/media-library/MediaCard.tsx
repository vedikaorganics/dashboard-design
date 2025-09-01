'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { 
  MoreHorizontal, 
  Download, 
  Edit, 
  Trash2, 
  Eye, 
  Copy,
  FileVideo,
  FileText,
  Play,
  Clock,
  HardDrive,
  Calendar,
  Tag,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MediaAsset } from '@/types/cms'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface MediaCardProps {
  asset: MediaAsset
  isSelected: boolean
  onSelect: (asset: MediaAsset) => void
  onPreview: (asset: MediaAsset) => void
  onEdit: (asset: MediaAsset) => void
  onDelete: (assetId: string) => void
  onCopyUrl: (url: string) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function MediaCard({
  asset,
  isSelected,
  onSelect,
  onPreview,
  onEdit,
  onDelete,
  onCopyUrl,
  className,
  size = 'md'
}: MediaCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)


  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date))
  }, [])

  const handleCopyUrl = useCallback(() => {
    onCopyUrl(asset.url)
    toast.success('URL copied to clipboard')
  }, [asset.url, onCopyUrl])

  const renderThumbnail = () => {
    if (asset.type === 'image') {
      return (
        <div className="relative w-full h-full bg-muted">
          {!imageError ? (
            <Image
              src={asset.thumbnailUrl}
              alt={asset.alt || asset.filename}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted">
              <FileText className="w-8 h-8 text-info" />
            </div>
          )}
        </div>
      )
    } else if (asset.type === 'video') {
      return (
        <div className="relative w-full h-full bg-muted">
          {asset.thumbnailUrl && !imageError ? (
            <Image
              src={asset.thumbnailUrl}
              alt={`Video thumbnail: ${asset.alt || asset.filename}`}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted">
              <FileVideo className="w-8 h-8 text-warning" />
            </div>
          )}
          
          {/* Video overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                <Play className="w-5 h-5 text-black ml-1" />
              </div>
            </div>
          </div>
          
          {/* Duration badge (if available) */}
          {asset.metadata?.duration && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
              {asset.metadata.duration}
            </div>
          )}
        </div>
      )
    } else {
      return (
        <div className="flex items-center justify-center h-full bg-muted">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
      )
    }
  }

  return (
    <div
      className={cn(
        "group relative bg-card border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer",
        "flex flex-col", // Ensure proper flex layout
        isSelected && "ring-2 ring-primary ring-offset-2",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPreview(asset)}
    >
      {/* Selection checkbox */}
      <div className={cn(
        "absolute top-2 left-2 z-10 transition-all duration-200",
        isSelected || isHovered ? "opacity-100 scale-100" : "opacity-0 scale-90"
      )}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(asset)}
          onClick={(e) => e.stopPropagation()}
          className="bg-white/90 border-2"
        />
      </div>

      {/* Quick actions */}
      <div className={cn(
        "absolute top-2 right-2 z-10 flex space-x-1 transition-all duration-200",
        isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(asset)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyUrl}>
              <Copy className="w-4 h-4 mr-2" />
              Copy URL
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(asset.url, '_blank')}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in new tab
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="w-4 h-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(asset._id)}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Thumbnail */}
      <div className={cn(
        "relative overflow-hidden",
        // When used in a fixed container (like list view), fill it completely
        className?.includes('w-16 h-16') ? "w-full h-full" : 
        // Otherwise, maintain aspect ratio based on size
        size === 'sm' ? "aspect-square w-full" :
        size === 'md' ? "aspect-square w-full" :
        "aspect-square w-full"
      )}>
        {renderThumbnail()}
        
        {/* Type badge */}
        <div className="absolute bottom-2 left-2">
          <div className="w-6 h-6 bg-black/70 rounded-full flex items-center justify-center">
            {asset.type === 'image' ? (
              <svg className="w-3 h-3 text-info" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            ) : asset.type === 'video' ? (
              <svg className="w-3 h-3 text-warning" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832L12 11.202a1 1 0 000-1.664L9.555 7.168z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-3 h-3 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Content - only show for normal sized cards, not tiny ones */}
      {!className?.includes('w-16 h-16') && (
        <div className={cn(
          "flex-1 min-h-0", // Use flex-1 to take remaining space
          size === 'sm' ? "p-1.5" : size === 'md' ? "p-2" : "p-3"
        )}>
          <div className={cn(
            "space-y-1", 
            size === 'sm' ? "space-y-1" : "space-y-2"
          )}>
            {/* Filename */}
            <h3 className={cn(
              "font-medium truncate", 
              size === 'sm' ? "text-[11px] leading-3" : size === 'md' ? "text-sm" : "text-base"
            )} title={asset.filename}>
              {asset.filename}
            </h3>

            {/* Metadata */}
            <div className={cn(
              "flex items-center justify-between text-muted-foreground",
              size === 'sm' ? "text-[9px]" : "text-xs"
            )}>
              <div className="flex items-center space-x-1">
                <HardDrive className={cn(size === 'sm' ? "w-2 h-2" : "w-3 h-3")} />
                <span>{formatFileSize(asset.size)}</span>
              </div>
              
              {asset.dimensions && size !== 'sm' && (
                <div className="flex items-center space-x-1">
                  <span>{asset.dimensions.width}×{asset.dimensions.height}</span>
                </div>
              )}
            </div>

            {/* Date - only for medium and large */}
            {size !== 'sm' && (
              <div className={cn(
                "flex items-center space-x-1 text-muted-foreground",
                size === 'md' ? "text-[10px]" : "text-xs"
              )}>
                <Calendar className={cn(size === 'md' ? "w-2.5 h-2.5" : "w-3 h-3")} />
                <span>{formatDate(asset.createdAt)}</span>
              </div>
            )}

            {/* Tags - only for large */}
            {size === 'lg' && asset.tags && asset.tags.length > 0 && (
              <div className="flex items-center space-x-1">
                <Tag className="w-3 h-3 text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                  {asset.tags.slice(0, 2).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                      {tag}
                    </Badge>
                  ))}
                  {asset.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      +{asset.tags.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}