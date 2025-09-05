'use client'

import { useState } from 'react'
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
  RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MediaAsset } from '@/types/cms'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface MediaGridProps {
  assets: MediaAsset[]
  view: 'grid' | 'list'
  selectedAssets: MediaAsset[]
  onAssetSelect: (asset: MediaAsset) => void
  onAssetDelete: (assetId: string) => void
  onAssetRestore?: (assetId: string) => void
  onAssetUpdate: (assetId: string, data: {
    alt?: string
    caption?: string
    tags?: string[]
  }) => Promise<MediaAsset | null>
  isTrashView?: boolean
}

export function MediaGrid({
  assets,
  view,
  selectedAssets,
  onAssetSelect,
  onAssetDelete,
  onAssetRestore,
  onAssetUpdate,
  isTrashView = false
}: MediaGridProps) {
  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null)
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null)
  const [editForm, setEditForm] = useState({
    alt: '',
    caption: '',
    tags: ''
  })

  const handleEditAsset = (asset: MediaAsset) => {
    setEditingAsset(asset)
    setEditForm({
      alt: asset.alt || '',
      caption: asset.caption || '',
      tags: asset.tags?.join(', ') || ''
    })
  }

  const handleSaveEdit = async () => {
    if (!editingAsset) return

    const updated = await onAssetUpdate(editingAsset._id, {
      alt: editForm.alt,
      caption: editForm.caption,
      tags: editForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    })

    if (updated) {
      toast.success('Asset updated successfully')
      setEditingAsset(null)
    }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('URL copied to clipboard')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date))
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const formatRelativeDate = (date: Date) => {
    const now = new Date()
    const targetDate = new Date(date)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())

    if (targetDay.getTime() === today.getTime()) {
      return 'Today'
    } else if (targetDay.getTime() === yesterday.getTime()) {
      return 'Yesterday'
    } else if (now.getTime() - targetDay.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(targetDate)
    } else {
      return formatDate(targetDate)
    }
  }

  const isSelected = (asset: MediaAsset) => {
    return selectedAssets.some(selected => selected._id === asset._id)
  }

  const renderAssetThumbnail = (asset: MediaAsset, className?: string) => {
    if (asset.type === 'image') {
      return (
        <Image
          src={asset.thumbnailUrl}
          alt={asset.alt || asset.filename}
          fill
          className={cn("object-cover", className)}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />
      )
    } else if (asset.type === 'video') {
      return (
        <div className="relative h-full bg-muted">
          {asset.thumbnailUrl ? (
            <Image
              src={asset.thumbnailUrl}
              alt={`Video thumbnail: ${asset.alt || asset.filename}`}
              fill
              className={cn("object-cover", className)}
              onError={(e) => {
                // Fallback to video icon if thumbnail fails to load
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
              onLoad={() => {
                // Hide the fallback icon when thumbnail loads successfully
                const fallbackIcon = (document.querySelector(`[data-video-fallback="${asset._id}"]`) as HTMLElement)
                if (fallbackIcon) fallbackIcon.style.display = 'none'
              }}
            />
          ) : null}
          <div 
            className="flex items-center justify-center h-full bg-muted"
            data-video-fallback={asset._id}
            style={asset.thumbnailUrl ? { position: 'absolute', inset: 0 } : {}}
          >
            <FileVideo className="w-12 h-12 text-muted-foreground" />
          </div>
          {/* Video play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 border-l-4 border-l-black border-y-2 border-y-transparent ml-1"></div>
            </div>
          </div>
        </div>
      )
    } else {
      return (
        <div className="flex items-center justify-center h-full bg-muted">
          <FileText className="w-12 h-12 text-muted-foreground" />
        </div>
      )
    }
  }

  if (view === 'list') {
    return (
      <>
        {assets.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-sm text-muted-foreground text-center py-4 italic">
              Empty
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {assets.map((asset) => (
            <div
              key={asset._id}
              className={cn(
                "flex items-center space-x-4 p-4 hover:bg-muted/50 cursor-pointer",
                isSelected(asset) && "bg-primary/10 border-l-4 border-l-primary"
              )}
              onClick={() => onAssetSelect(asset)}
            >
              {/* Thumbnail */}
              <div className="relative w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                {renderAssetThumbnail(asset)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{asset.filename}</p>
                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    {asset.type === 'image' ? (
                      <svg className="w-4 h-4 text-info" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    ) : asset.type === 'video' ? (
                      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832L12 11.202a1 1 0 000-1.664L9.555 7.168z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span>{formatFileSize(asset.size)}</span>
                  {asset.dimensions && (
                    <span>{asset.dimensions.width} × {asset.dimensions.height}</span>
                  )}
                </div>
              </div>

              {/* Time and Date - Right side */}
              <div className="flex-shrink-0 text-sm text-muted-foreground mr-4 text-right">
                <div>{formatTime(asset.createdAt)}</div>
                <div className="text-xs">{formatRelativeDate(asset.createdAt)}</div>
              </div>

              {/* Tags */}
              {asset.tags && asset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {asset.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {asset.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{asset.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setPreviewAsset(asset)}>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEditAsset(asset)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCopyUrl(asset.url)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy URL
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={asset.url} download={asset.filename}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  </DropdownMenuItem>
                  {isTrashView ? (
                    <>
                      <DropdownMenuItem 
                        onClick={() => onAssetRestore?.(asset._id)}
                        className="text-green-600"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Restore
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onAssetDelete(asset._id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Permanently
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem 
                      onClick={() => onAssetDelete(asset._id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Move to Trash
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingAsset} onOpenChange={() => setEditingAsset(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Asset</DialogTitle>
            </DialogHeader>
            {editingAsset && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="alt">Alt Text</Label>
                  <Input
                    id="alt"
                    value={editForm.alt}
                    onChange={(e) => setEditForm(prev => ({ ...prev, alt: e.target.value }))}
                    placeholder="Describe this image..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="caption">Caption</Label>
                  <Textarea
                    id="caption"
                    value={editForm.caption}
                    onChange={(e) => setEditForm(prev => ({ ...prev, caption: e.target.value }))}
                    placeholder="Optional caption..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={editForm.tags}
                    onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="Comma-separated tags..."
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setEditingAsset(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdit}>
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={!!previewAsset} onOpenChange={() => setPreviewAsset(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{previewAsset?.filename}</DialogTitle>
            </DialogHeader>
            {previewAsset && (
              <div className="space-y-4">
                <div className="relative w-full h-96 bg-muted rounded overflow-hidden">
                  {previewAsset.type === 'image' ? (
                    <Image
                      src={previewAsset.url}
                      alt={previewAsset.alt || previewAsset.filename}
                      fill
                      className="object-contain"
                    />
                  ) : previewAsset.type === 'video' ? (
                    <video controls className="w-full h-full">
                      <source src={previewAsset.url} />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Preview not available for this file type
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Size:</strong> {formatFileSize(previewAsset.size)}</p>
                    <p><strong>Type:</strong> {previewAsset.type}</p>
                    {previewAsset.dimensions && (
                      <p><strong>Dimensions:</strong> {previewAsset.dimensions.width} × {previewAsset.dimensions.height}</p>
                    )}
                  </div>
                  <div>
                    <p><strong>Created:</strong> {formatDate(previewAsset.createdAt)}</p>
                    <p><strong>Updated:</strong> {formatDate(previewAsset.updatedAt)}</p>
                  </div>
                </div>
                {previewAsset.caption && (
                  <div>
                    <p><strong>Caption:</strong> {previewAsset.caption}</p>
                  </div>
                )}
                {previewAsset.tags && previewAsset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {previewAsset.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Grid view
  return (
    <div className="p-4">
      {assets.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-muted-foreground text-center py-4 italic">
            Empty
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {assets.map((asset) => (
        <div
          key={asset._id}
          className={cn(
            "relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
            isSelected(asset) ? "border-primary shadow-md" : "border-transparent hover:border-muted-foreground/20"
          )}
          onClick={() => onAssetSelect(asset)}
        >
          {/* Thumbnail */}
          <div className="relative aspect-square bg-muted">
            {renderAssetThumbnail(asset)}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="secondary" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setPreviewAsset(asset)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditAsset(asset)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCopyUrl(asset.url)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy URL
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={asset.url} download={asset.filename}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </a>
                    </DropdownMenuItem>
                    {isTrashView ? (
                      <>
                        <DropdownMenuItem 
                          onClick={() => onAssetRestore?.(asset._id)}
                          className="text-green-600"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Restore
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onAssetDelete(asset._id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Permanently
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem 
                        onClick={() => onAssetDelete(asset._id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Move to Trash
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Type badge */}
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="text-xs capitalize">
                {asset.type}
              </Badge>
            </div>
          </div>

          {/* Info */}
          <div className="p-2">
            <p className="text-sm font-medium truncate" title={asset.filename}>
              {asset.filename}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(asset.size)}
            </p>
          </div>
        </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingAsset} onOpenChange={() => setEditingAsset(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
          </DialogHeader>
          {editingAsset && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="alt">Alt Text</Label>
                <Input
                  id="alt"
                  value={editForm.alt}
                  onChange={(e) => setEditForm(prev => ({ ...prev, alt: e.target.value }))}
                  placeholder="Describe this image..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  value={editForm.caption}
                  onChange={(e) => setEditForm(prev => ({ ...prev, caption: e.target.value }))}
                  placeholder="Optional caption..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={editForm.tags}
                  onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="Comma-separated tags..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingAsset(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewAsset} onOpenChange={() => setPreviewAsset(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewAsset?.filename}</DialogTitle>
          </DialogHeader>
          {previewAsset && (
            <div className="space-y-4">
              <div className="relative w-full h-96 bg-muted rounded overflow-hidden">
                {previewAsset.type === 'image' ? (
                  <Image
                    src={previewAsset.url}
                    alt={previewAsset.alt || previewAsset.filename}
                    fill
                    className="object-contain"
                  />
                ) : previewAsset.type === 'video' ? (
                  <video controls className="w-full h-full">
                    <source src={previewAsset.url} />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Preview not available for this file type
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Size:</strong> {formatFileSize(previewAsset.size)}</p>
                  <p><strong>Type:</strong> {previewAsset.type}</p>
                  {previewAsset.dimensions && (
                    <p><strong>Dimensions:</strong> {previewAsset.dimensions.width} × {previewAsset.dimensions.height}</p>
                  )}
                </div>
                <div>
                  <p><strong>Created:</strong> {formatDate(previewAsset.createdAt)}</p>
                  <p><strong>Updated:</strong> {formatDate(previewAsset.updatedAt)}</p>
                </div>
              </div>
              {previewAsset.caption && (
                <div>
                  <p><strong>Caption:</strong> {previewAsset.caption}</p>
                </div>
              )}
              {previewAsset.tags && previewAsset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {previewAsset.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}