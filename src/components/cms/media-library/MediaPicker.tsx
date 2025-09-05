'use client'

import { useState, useCallback, useEffect } from 'react'
import { Search, Upload, FolderPlus, Grid, List, Check, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MediaAsset, MediaFolder } from '@/types/cms'
import { useMedia } from '@/hooks/cms/use-media'
import { MediaCard } from './MediaCard'
import { MediaFolders } from './MediaFolders'
import { MediaUploader } from './MediaUploader'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface MediaPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (assets: MediaAsset[]) => void
  multiple?: boolean
  selectedAssets?: MediaAsset[]
  accept?: 'image' | 'video' | 'document' | 'all'
  title?: string
}

export function MediaPicker({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  selectedAssets = [],
  accept = 'all',
  title = 'Select Media'
}: MediaPickerProps) {
  const [currentFolderPath, setCurrentFolderPath] = useState<string>('/')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>(accept === 'all' ? 'all' : accept)
  const [showUploader, setShowUploader] = useState(false)
  const [internalSelection, setInternalSelection] = useState<MediaAsset[]>(selectedAssets)
  const [currentPage, setCurrentPage] = useState(1)

  const {
    assets,
    folders,
    pagination,
    isLoading,
    error,
    refresh,
    createFolder
  } = useMedia({
    folderPath: currentFolderPath !== '/' ? currentFolderPath : undefined,
    search: search || undefined,
    type: typeFilter === 'all' ? undefined : typeFilter,
    page: currentPage,
    limit: 24
  })

  // Reset internal selection when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setInternalSelection(selectedAssets)
    }
  }, [isOpen]) // Removed selectedAssets dependency to prevent infinite loop

  // Handle asset selection
  const handleAssetSelect = useCallback((asset: MediaAsset) => {
    if (!multiple) {
      setInternalSelection([asset])
      return
    }

    setInternalSelection(prev => {
      const isSelected = prev.some(a => a._id === asset._id)
      if (isSelected) {
        return prev.filter(a => a._id !== asset._id)
      } else {
        return [...prev, asset]
      }
    })
  }, [multiple])

  // Handle confirm selection
  const handleConfirm = useCallback(() => {
    // For video assets, use the HLS streaming URL from metadata if available, otherwise fallback to url
    const transformedSelection = internalSelection.map(asset => {
      if (asset.type === 'video') {
        // Use the HLS streaming URL that was pre-generated on the server during upload
        const hlsUrl = asset.metadata?.streamUrl || asset.url
        return {
          ...asset,
          url: hlsUrl
        }
      }
      return asset
    })
    
    onSelect(transformedSelection)
    onClose()
  }, [internalSelection, onSelect, onClose])

  // Handle file upload
  const handleUpload = useCallback(async (files: File[]) => {
    const uploadPromises = files.map(async (file) => {
      // Validate file type based on accept prop
      if (accept !== 'all') {
        if (accept === 'image' && !file.type.startsWith('image/')) {
          throw new Error(`Only images are allowed. ${file.name} is not an image.`)
        }
        if (accept === 'video' && !file.type.startsWith('video/')) {
          throw new Error(`Only videos are allowed. ${file.name} is not a video.`)
        }
      }
      
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('alt', file.name.split('.')[0]) // Remove extension for alt text
      formData.append('caption', '')
      formData.append('tags', '')
      const currentFolder = currentFolderPath !== '/' ? folders.find(f => f.path === currentFolderPath) : null
      if (currentFolder) {
        formData.append('folderId', currentFolder._id)
      }
      
      // Upload directly to API
      const response = await fetch('/api/cms/media', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }
      
      return response.json()
    })

    try {
      const uploadedAssets = await Promise.all(uploadPromises)
      toast.success(`${files.length} file(s) uploaded successfully`)
      refresh()
      
      // Auto-select uploaded assets if in single mode
      if (!multiple && uploadedAssets.length === 1) {
        setInternalSelection([uploadedAssets[0].data])
      } else if (multiple) {
        setInternalSelection(prev => [...prev, ...uploadedAssets.map(u => u.data)])
      }
      
      setShowUploader(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload files')
      console.error('Upload error:', error)
    }
  }, [currentFolderPath, folders, refresh, multiple, accept])

  // Handle folder creation
  const handleCreateFolder = useCallback(async (name: string) => {
    const currentFolder = currentFolderPath !== '/' ? folders.find(f => f.path === currentFolderPath) : null
    const folder = await createFolder(name, currentFolder?._id)
    if (folder) {
      toast.success('Folder created successfully')
    }
  }, [createFolder, currentFolderPath, folders])

  // Filter folders and assets based on accept type
  const filteredAssets = assets.filter(asset => {
    if (accept === 'all') return true
    return asset.type === accept
  })

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )
    }
    
    if (error) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <p>{error}</p>
        </div>
      )
    }

    if (filteredAssets.length === 0 && !search) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No media in this folder</h3>
          <p className="text-muted-foreground mb-4">
            Upload your first {accept === 'all' ? 'files' : accept + 's'} to get started.
          </p>
          <Button onClick={() => setShowUploader(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload {accept === 'all' ? 'Files' : accept.charAt(0).toUpperCase() + accept.slice(1) + 's'}
          </Button>
        </div>
      )
    }
    
    return (
      <div className="grid grid-cols-4 gap-4">
        {filteredAssets.map((asset) => (
          <div key={asset._id} className="relative">
            <MediaCard
              asset={asset}
              isSelected={internalSelection.some(a => a._id === asset._id)}
              onSelect={handleAssetSelect}
              size="lg"
              showActions={false}
              showCheckbox={false}
              className={cn(
                'cursor-pointer transition-all',
                internalSelection.some(a => a._id === asset._id) && 'ring-2 ring-primary'
              )}
            />
            {internalSelection.some(a => a._id === asset._id) && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogPortal>
          <DialogOverlay className="z-[60]" />
          <DialogContent className="max-w-[90vw] w-[1200px] max-h-[95vh] overflow-hidden z-[60] sm:max-w-[90vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {title}
              {internalSelection.length > 0 && (
                <Badge variant="secondary">
                  {internalSelection.length} selected
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-1 min-h-0">
            {/* Sidebar */}
            <div className="w-64 border-r pr-4">
              <div className="space-y-4">
                {/* Upload Button */}
                <Button 
                  onClick={() => setShowUploader(true)} 
                  className="w-full"
                  size="sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
                
                {/* Filters */}
                <div className="space-y-2">
                  <Input
                    placeholder={`Search ${accept === 'all' ? 'media' : accept + 's'}...`}
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="h-9"
                  />
                  
                  {accept === 'all' && (
                    <Select value={typeFilter} onValueChange={(value) => {
                      setTypeFilter(value)
                      setCurrentPage(1)
                    }}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="image">Images</SelectItem>
                        <SelectItem value="video">Videos</SelectItem>
                        <SelectItem value="document">Documents</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                {/* Folders */}
                <ScrollArea className="h-64">
                  <MediaFolders
                    folders={folders}
                    currentFolderPath={currentFolderPath}
                    onFolderSelect={setCurrentFolderPath}
                    compact={true}
                  />
                </ScrollArea>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 pl-4">
              <ScrollArea className="h-[600px]">
                <div className="pt-2">
                  {renderContent()}
                </div>
              </ScrollArea>
              
              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => setCurrentPage(pagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => setCurrentPage(pagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {internalSelection.length === 0 
                ? `Select ${multiple ? 'up to multiple' : 'one'} ${accept === 'all' ? 'file' : accept}`
                : `${internalSelection.length} ${accept === 'all' ? 'file' : accept}${internalSelection.length > 1 ? 's' : ''} selected`
              }
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirm} 
                disabled={internalSelection.length === 0}
              >
                Select {internalSelection.length > 0 && `(${internalSelection.length})`}
              </Button>
            </div>
          </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUploader} onOpenChange={setShowUploader}>
        <DialogPortal>
          <DialogOverlay className="z-[70]" />
          <DialogContent className="z-[70]">
          <DialogHeader>
            <DialogTitle>Upload Media</DialogTitle>
          </DialogHeader>
          <MediaUploader
            onUpload={handleUpload}
            accept={accept === 'document' ? 'all' : accept}
            multiple={true}
          />
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  )
}