'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Search, Upload, FolderPlus, Grid, List, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MediaAsset, MediaFolder } from '@/types/cms'
import { useMedia } from '@/hooks/cms/use-media'
import { MediaGrid } from './MediaGrid'
import { MediaUploader } from './MediaUploader'
import { MediaFolders } from './MediaFolders'
import { toast } from 'sonner'

interface MediaLibraryProps {
  isOpen: boolean
  onClose: () => void
  onSelect?: (asset: MediaAsset) => void
  multiple?: boolean
  selectedAssets?: MediaAsset[]
  accept?: 'image' | 'video' | 'document' | 'all'
}

export function MediaLibrary({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  selectedAssets = [],
  accept = 'all'
}: MediaLibraryProps) {
  const [currentFolderPath, setCurrentFolderPath] = useState<string>('/')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showUploader, setShowUploader] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const {
    assets,
    folders,
    pagination,
    isLoading,
    error,
    refresh,
    uploadMedia,
    createFolder,
    deleteAsset,
    updateAsset
  } = useMedia({
    folderPath: currentFolderPath !== '/' ? currentFolderPath : undefined,
    search: search || undefined,
    type: typeFilter === 'all' ? undefined : typeFilter,
    page: currentPage,
    limit: 24
  })

  // Handle file upload
  const handleUpload = useCallback(async (files: File[]) => {
    const uploadPromises = files.map(async (file) => {
      // In a real implementation, you'd upload to your storage service
      // For now, we'll create a placeholder URL
      const mockUrl = URL.createObjectURL(file)
      
      return uploadMedia({
        url: mockUrl,
        filename: file.name,
        type: file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('video/') ? 'video' : 'document',
        size: file.size,
        folderId: currentFolderPath !== '/' ? folders.find(f => f.path === currentFolderPath)?._id : undefined,
        alt: file.name.split('.')[0] // Remove extension for alt text
      })
    })

    try {
      await Promise.all(uploadPromises)
      toast.success(`${files.length} file(s) uploaded successfully`)
      setShowUploader(false)
    } catch (error) {
      toast.error('Failed to upload files')
      console.error('Upload error:', error)
    }
  }, [uploadMedia, currentFolderPath, folders])

  // Handle folder creation
  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return

    const currentFolder = currentFolderPath !== '/' ? folders.find(f => f.path === currentFolderPath) : null
    const folder = await createFolder(newFolderName.trim(), currentFolder?._id)
    if (folder) {
      toast.success('Folder created successfully')
      setNewFolderName('')
      setShowNewFolder(false)
    }
  }, [newFolderName, createFolder, currentFolderPath, folders])

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  // Reset page when filters change
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }, [])

  const handleTypeFilterChange = useCallback((value: string) => {
    setTypeFilter(value)
    setCurrentPage(1)
  }, [])

  const handleFolderChange = useCallback((folderPath: string) => {
    setCurrentFolderPath(folderPath)
    setCurrentPage(1)
  }, [])

  // Handle asset selection
  const handleAssetSelect = useCallback((asset: MediaAsset) => {
    if (onSelect) {
      onSelect(asset)
    }
  }, [onSelect])

  // Handle asset delete
  const handleAssetDelete = useCallback(async (assetId: string) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      const success = await deleteAsset(assetId)
      if (success) {
        toast.success('Asset deleted successfully')
      }
    }
  }, [deleteAsset])

  // Filter assets by accepted types
  const filteredAssets = assets.filter(asset => {
    if (accept === 'all') return true
    return asset.type === accept
  })

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Media Library
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[70vh]">
          {/* Toolbar */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search assets..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
              >
                {view === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </Button>

              <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FolderPlus className="w-4 h-4 mr-2" />
                    New Folder
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Folder name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateFolder()
                        }
                      }}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowNewFolder(false)
                          setNewFolderName('')
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreateFolder}>
                        Create Folder
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showUploader} onOpenChange={setShowUploader}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload Media</DialogTitle>
                  </DialogHeader>
                  <MediaUploader onUpload={handleUpload} accept={accept === 'document' ? 'all' : accept} />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Folders sidebar */}
            <div className="w-64 border-r bg-muted/20">
              <MediaFolders
                folders={folders}
                currentFolderPath={currentFolderPath}
                onFolderSelect={handleFolderChange}
              />
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>{error}</p>
                </div>
              ) : (
                <MediaGrid
                  assets={filteredAssets}
                  view={view}
                  selectedAssets={selectedAssets}
                  onAssetSelect={handleAssetSelect}
                  onAssetDelete={handleAssetDelete}
                  onAssetUpdate={updateAsset}
                />
              )}
            </div>
          </div>

          {/* Footer with pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="p-4 border-t flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {pagination.total} assets, page {pagination.page} of {pagination.pages}
              </span>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                {/* Page numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(pagination.pages - 4, pagination.page - 2)) + i
                    if (pageNum > pagination.pages) return null
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}