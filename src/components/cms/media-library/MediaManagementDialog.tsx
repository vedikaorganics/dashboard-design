'use client'

import { useState } from 'react'
import { AlertTriangle, Replace, Trash2, ExternalLink, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MediaAsset, ContentBlock } from '@/types/cms'
import { MediaPicker } from './MediaPicker'
import { useMediaManagement } from '@/hooks/cms/use-media-management'
import { toast } from 'sonner'

interface MediaManagementDialogProps {
  isOpen: boolean
  onClose: () => void
  asset: MediaAsset | null
  blocks: ContentBlock[]
  onBlocksUpdate: (blocks: ContentBlock[]) => void
}

export function MediaManagementDialog({
  isOpen,
  onClose,
  asset,
  blocks,
  onBlocksUpdate
}: MediaManagementDialogProps) {
  const [showReplacePicker, setShowReplacePicker] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const { findMediaUsage, replaceMediaAsset, removeMediaAsset } = useMediaManagement()

  if (!asset) return null

  const usage = findMediaUsage(blocks, asset._id)

  const handleReplace = async (newAssets: MediaAsset[]) => {
    if (newAssets.length === 0) return
    
    setIsProcessing(true)
    try {
      const newAsset = newAssets[0]
      const updatedBlocks = replaceMediaAsset(blocks, asset._id, newAsset)
      onBlocksUpdate(updatedBlocks)
      toast.success(`Replaced ${usage.length} instances of ${asset.filename} with ${newAsset.filename}`)
      onClose()
    } catch (error) {
      toast.error('Failed to replace media')
      console.error('Replace error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm(`Are you sure you want to remove this media from ${usage.length} block(s)? This action cannot be undone.`)) {
      return
    }

    setIsProcessing(true)
    try {
      const updatedBlocks = removeMediaAsset(blocks, asset._id)
      onBlocksUpdate(updatedBlocks)
      toast.success(`Removed ${asset.filename} from ${usage.length} block(s)`)
      onClose()
    } catch (error) {
      toast.error('Failed to remove media')
      console.error('Remove error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={asset.url}
                  alt={asset.alt || asset.filename}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold truncate">{asset.filename}</h2>
                <p className="text-sm text-muted-foreground">
                  Used in {usage.length} block{usage.length !== 1 ? 's' : ''}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="usage" className="flex-1 min-h-0">
            <TabsList>
              <TabsTrigger value="usage">
                Usage ({usage.length})
              </TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="usage" className="flex-1">
              <ScrollArea className="h-96">
                {usage.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">This media is not currently used in any blocks.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {usage.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-sm">{item.blockTitle}</h4>
                            <Badge variant="outline" className="text-xs">
                              {item.blockType.replace('-', ' ')}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Field: {item.fieldPath}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Could implement block navigation here
                              toast.info('Block navigation coming soon')
                            }}
                            className="text-xs"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="details">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="font-medium">Filename:</label>
                    <p className="text-muted-foreground">{asset.filename}</p>
                  </div>
                  <div>
                    <label className="font-medium">Size:</label>
                    <p className="text-muted-foreground">
                      {(asset.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div>
                    <label className="font-medium">Type:</label>
                    <p className="text-muted-foreground capitalize">{asset.type}</p>
                  </div>
                  {asset.dimensions && (
                    <div>
                      <label className="font-medium">Dimensions:</label>
                      <p className="text-muted-foreground">
                        {asset.dimensions.width} × {asset.dimensions.height}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="font-medium">Alt Text:</label>
                    <p className="text-muted-foreground">{asset.alt || 'None'}</p>
                  </div>
                  <div>
                    <label className="font-medium">Caption:</label>
                    <p className="text-muted-foreground">{asset.caption || 'None'}</p>
                  </div>
                </div>
                
                {asset.tags && asset.tags.length > 0 && (
                  <div>
                    <label className="font-medium text-sm">Tags:</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {asset.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(asset.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Original
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="actions">
              <div className="space-y-6">
                {usage.length > 0 && (
                  <>
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        This media is currently used in {usage.length} block{usage.length !== 1 ? 's' : ''}.
                        Replacing or removing it will affect all instances.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-2">Replace Media</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Replace this media with another file across all {usage.length} block{usage.length !== 1 ? 's' : ''}.
                        </p>
                        <Button
                          onClick={() => setShowReplacePicker(true)}
                          disabled={isProcessing}
                          className="w-full"
                        >
                          <Replace className="w-4 h-4 mr-2" />
                          Choose Replacement Media
                        </Button>
                      </div>

                      <div>
                        <h3 className="font-medium mb-2">Remove Media</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Remove this media from all {usage.length} block{usage.length !== 1 ? 's' : ''}.
                          This will clear the media fields but keep the blocks.
                        </p>
                        <Button
                          variant="destructive"
                          onClick={handleRemove}
                          disabled={isProcessing}
                          className="w-full"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove from All Blocks
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {usage.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      This media is not currently used in any blocks, so no content management actions are available.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You can manage this media through the main media library.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Replace Media Picker */}
      <MediaPicker
        isOpen={showReplacePicker}
        onClose={() => setShowReplacePicker(false)}
        onSelect={handleReplace}
        accept={asset.type}
        title="Choose Replacement Media"
      />
    </>
  )
}