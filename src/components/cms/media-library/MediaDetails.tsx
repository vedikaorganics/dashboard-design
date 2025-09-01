'use client'

import React, { useState, useCallback } from 'react'
import Image from 'next/image'
import { 
  X, 
  Download, 
  ExternalLink, 
  Copy, 
  Edit,
  Eye,
  Calendar,
  HardDrive,
  Tag,
  User,
  FileVideo,
  FileText,
  Play,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MediaAsset } from '@/types/cms'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface MediaDetailsProps {
  asset: MediaAsset | null
  onClose: () => void
  onUpdate: (assetId: string, data: {
    alt?: string
    caption?: string
    tags?: string[]
  }) => Promise<MediaAsset | null>
  onDelete: (assetId: string) => void
}

export function MediaDetails({ asset, onClose, onUpdate, onDelete }: MediaDetailsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showFullPreview, setShowFullPreview] = useState(false)
  const [previewZoom, setPreviewZoom] = useState(1)
  const [editForm, setEditForm] = useState({
    alt: '',
    caption: '',
    tags: ''
  })

  // Initialize form when asset changes
  React.useEffect(() => {
    if (asset) {
      setEditForm({
        alt: asset.alt || '',
        caption: asset.caption || '',
        tags: asset.tags?.join(', ') || ''
      })
      setIsEditing(false)
      setPreviewZoom(1)
    }
  }, [asset])

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }, [])

  const handleSave = useCallback(async () => {
    if (!asset) return

    const updated = await onUpdate(asset._id, {
      alt: editForm.alt,
      caption: editForm.caption,
      tags: editForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    })

    if (updated) {
      toast.success('Asset updated successfully')
      setIsEditing(false)
    }
  }, [asset, editForm, onUpdate])

  const handleCancel = useCallback(() => {
    if (asset) {
      setEditForm({
        alt: asset.alt || '',
        caption: asset.caption || '',
        tags: asset.tags?.join(', ') || ''
      })
    }
    setIsEditing(false)
  }, [asset])

  const handleCopyUrl = useCallback(() => {
    if (asset) {
      navigator.clipboard.writeText(asset.url)
      toast.success('URL copied to clipboard')
    }
  }, [asset])

  const handleDelete = useCallback(() => {
    if (asset && window.confirm('Are you sure you want to delete this asset?')) {
      onDelete(asset._id)
      onClose()
    }
  }, [asset, onDelete, onClose])

  if (!asset) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Select an asset to view details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg truncate mr-3">Asset Details</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Preview</Label>
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFullPreview(true)}
                  className="h-7 px-2"
                >
                  <Maximize2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(asset.url, '_blank')}
                  className="h-7 px-2"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
              {asset.type === 'image' ? (
                <Image
                  src={asset.thumbnailUrl}
                  alt={asset.alt || asset.filename}
                  fill
                  className="object-contain"
                />
              ) : asset.type === 'video' ? (
                <div className="relative w-full h-full">
                  {asset.thumbnailUrl ? (
                    <Image
                      src={asset.thumbnailUrl}
                      alt={`Video thumbnail: ${asset.alt || asset.filename}`}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <FileVideo className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="rounded-full w-16 h-16 p-0"
                      onClick={() => window.open(asset.url, '_blank')}
                    >
                      <Play className="w-6 h-6 ml-1" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <FileText className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* File Info */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">File Information</Label>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <p className="font-medium break-all">{asset.filename}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>
                <p className="font-medium">{asset.type.toUpperCase()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Size:</span>
                <p className="font-medium">{formatFileSize(asset.size)}</p>
              </div>
              {asset.dimensions && (
                <div>
                  <span className="text-muted-foreground">Dimensions:</span>
                  <p className="font-medium">{asset.dimensions.width}×{asset.dimensions.height}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p className="font-medium">{formatDate(asset.createdAt)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Modified:</span>
                <p className="font-medium">{formatDate(asset.updatedAt)}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Metadata Form */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Metadata</Label>
              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="h-7"
              >
                <Edit className="w-3 h-3 mr-1" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="alt" className="text-xs">Alt Text</Label>
                {isEditing ? (
                  <Input
                    id="alt"
                    value={editForm.alt}
                    onChange={(e) => setEditForm(prev => ({ ...prev, alt: e.target.value }))}
                    placeholder="Describe this image/video..."
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {asset.alt || 'No alt text'}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="caption" className="text-xs">Caption</Label>
                {isEditing ? (
                  <Textarea
                    id="caption"
                    value={editForm.caption}
                    onChange={(e) => setEditForm(prev => ({ ...prev, caption: e.target.value }))}
                    placeholder="Add a caption..."
                    className="mt-1 min-h-[60px]"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {asset.caption || 'No caption'}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="tags" className="text-xs">Tags</Label>
                {isEditing ? (
                  <Input
                    id="tags"
                    value={editForm.tags}
                    onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="tag1, tag2, tag3..."
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1">
                    {asset.tags && asset.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {asset.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No tags</p>
                    )}
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="flex space-x-2 pt-2">
                  <Button onClick={handleSave} size="sm" className="h-8">
                    Save Changes
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm" className="h-8">
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Technical Details */}
          {asset.metadata && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Technical Details</Label>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MIME Type:</span>
                  <span className="font-medium">{asset.metadata.mimeType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cloudflare ID:</span>
                  <span className="font-mono text-xs">{asset.metadata.cloudflareId}</span>
                </div>
                {asset.metadata.uploadedBy && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uploaded by:</span>
                    <span className="font-medium">{asset.metadata.uploadedBy}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Actions</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                <Copy className="w-3 h-3 mr-2" />
                Copy URL
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open(asset.url, '_blank')}>
                <Download className="w-3 h-3 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowFullPreview(true)}>
                <Eye className="w-3 h-3 mr-2" />
                Full Preview
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDelete}
                className="text-destructive hover:text-destructive"
              >
                <X className="w-3 h-3 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Full Preview Dialog */}
      <Dialog open={showFullPreview} onOpenChange={setShowFullPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{asset.filename}</DialogTitle>
          </DialogHeader>
          <div className="relative bg-muted rounded-lg overflow-hidden">
            {asset.type === 'image' ? (
              <div 
                className="relative w-full"
                style={{ 
                  aspectRatio: asset.dimensions ? 
                    `${asset.dimensions.width}/${asset.dimensions.height}` : 
                    '16/9',
                  maxHeight: '70vh'
                }}
              >
                <Image
                  src={asset.url}
                  alt={asset.alt || asset.filename}
                  fill
                  className="object-contain"
                />
              </div>
            ) : asset.type === 'video' ? (
              <video 
                controls 
                className="w-full max-h-[70vh]"
                src={asset.url}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}