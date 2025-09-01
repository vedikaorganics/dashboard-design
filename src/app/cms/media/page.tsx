'use client'

import { useState, useCallback, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { MediaAsset } from '@/types/cms'
import { useMedia } from '@/hooks/cms/use-media'
import { MediaLibraryLayout, useMediaDetails } from '@/components/cms/media-library/MediaLibraryLayout'
import { MediaHeader, ViewMode, SortBy, SortOrder } from '@/components/cms/media-library/MediaHeader'
import { MediaCard } from '@/components/cms/media-library/MediaCard'
import { MediaDetails } from '@/components/cms/media-library/MediaDetails'
import { MediaFolders } from '@/components/cms/media-library/MediaFolders'
import { MediaGallery } from '@/components/cms/media-library/MediaGallery'
import { TooltipProvider } from '@/components/ui/tooltip'
import { toast } from 'sonner'

export default function CMSMediaPage() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortBy>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedAssets, setSelectedAssets] = useState<MediaAsset[]>([])
  const [showGallery, setShowGallery] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [assetDimensions, setAssetDimensions] = useState<Record<string, { width: number; height: number }>>({})
  
  const { showDetails, selectedAsset, openDetails, closeDetails, setShowDetails } = useMediaDetails()

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
    folderId: currentFolderId || 'root',
    search: search || undefined,
    type: typeFilter === 'all' ? undefined : typeFilter,
    page: currentPage,
    limit: viewMode === 'gallery' ? 48 : 24
  })

  // Formatting functions
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

  // Handle file upload
  const handleUpload = useCallback(async (files: File[]) => {
    const uploadPromises = files.map(async (file) => {
      // Validate file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        throw new Error(`Unsupported file type: ${file.name}. Only images and videos are allowed.`)
      }
      
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('alt', file.name.split('.')[0]) // Remove extension for alt text
      formData.append('caption', '')
      formData.append('tags', '')
      if (currentFolderId) {
        formData.append('folderId', currentFolderId)
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
      await Promise.all(uploadPromises)
      toast.success(`${files.length} file(s) uploaded successfully to Cloudflare`)
      refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload files')
      console.error('Upload error:', error)
    }
  }, [currentFolderId, refresh])

  // Fetch dimensions for assets that don't have them
  useEffect(() => {
    const fetchMissingDimensions = async () => {
      for (const asset of assets) {
        if (!asset.dimensions && asset.metadata?.cloudflareId && !assetDimensions[asset._id]) {
          try {
            const response = await fetch(`/api/cms/media/dimensions?cloudflareId=${asset.metadata.cloudflareId}&type=${asset.type}`)
            const result = await response.json()
            
            if (result.success && result.data.dimensions) {
              setAssetDimensions(prev => ({
                ...prev,
                [asset._id]: result.data.dimensions
              }))
            }
          } catch (error) {
            console.warn('Failed to fetch dimensions for asset:', asset._id, error)
          }
        }
      }
    }

    if (assets.length > 0) {
      fetchMissingDimensions()
    }
  }, [assets, assetDimensions])

  // Handle folder creation
  const handleCreateFolder = useCallback(async (name: string) => {
    const folder = await createFolder(name, currentFolderId || undefined)
    if (folder) {
      toast.success('Folder created successfully')
    }
  }, [createFolder, currentFolderId])

  // Selection management
  const handleAssetSelect = useCallback((asset: MediaAsset) => {
    setSelectedAssets(prev => {
      const isSelected = prev.some(a => a._id === asset._id)
      if (isSelected) {
        return prev.filter(a => a._id !== asset._id)
      } else {
        return [...prev, asset]
      }
    })
  }, [])
  
  const handleSelectAll = useCallback(() => {
    setSelectedAssets(assets)
  }, [assets])
  
  const handleClearSelection = useCallback(() => {
    setSelectedAssets([])
  }, [])
  
  // Asset actions
  const handleAssetPreview = useCallback((asset: MediaAsset) => {
    const index = assets.findIndex(a => a._id === asset._id)
    setGalleryIndex(index)
    setShowGallery(true)
  }, [assets])
  
  const handleAssetEdit = useCallback((asset: MediaAsset) => {
    openDetails(asset)
  }, [openDetails])
  
  const handleCopyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('URL copied to clipboard')
  }, [])
  
  // Bulk actions
  const handleBulkDelete = useCallback(async () => {
    if (selectedAssets.length === 0) return
    
    if (window.confirm(`Are you sure you want to delete ${selectedAssets.length} asset(s)?`)) {
      const promises = selectedAssets.map(asset => deleteAsset(asset._id))
      await Promise.all(promises)
      setSelectedAssets([])
      toast.success(`${selectedAssets.length} asset(s) deleted successfully`)
    }
  }, [selectedAssets, deleteAsset])
  
  const handleBulkDownload = useCallback(() => {
    selectedAssets.forEach(asset => {
      window.open(asset.url, '_blank')
    })
  }, [selectedAssets])
  
  const handleBulkMove = useCallback(() => {
    // TODO: Implement bulk move
    toast.info('Bulk move functionality coming soon')
  }, [])
  
  const handleBulkTag = useCallback(() => {
    // TODO: Implement bulk tagging
    toast.info('Bulk tagging functionality coming soon')
  }, [])
  
  // Filter and pagination handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }, [])

  const handleTypeFilterChange = useCallback((value: string) => {
    setTypeFilter(value)
    setCurrentPage(1)
  }, [])

  const handleFolderChange = useCallback((folderId: string | null) => {
    setCurrentFolderId(folderId)
    setCurrentPage(1)
  }, [])

  // Handle asset delete
  const handleAssetDelete = useCallback(async (assetId: string) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      const success = await deleteAsset(assetId)
      if (success) {
        toast.success('Asset deleted successfully')
        // Close details panel if deleted asset was selected
        if (selectedAsset?._id === assetId) {
          closeDetails()
        }
      }
    }
  }, [deleteAsset, selectedAsset, closeDetails])

  // Render content based on view mode
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )
    }
    
    if (error) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>{error}</p>
        </div>
      )
    }
    
    if (viewMode === 'grid') {
      return (
        <div className="grid gap-3 pl-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          {assets.map((asset) => (
            <MediaCard
              key={asset._id}
              asset={asset}
              isSelected={selectedAssets.some(a => a._id === asset._id)}
              onSelect={handleAssetSelect}
              onPreview={handleAssetPreview}
              onEdit={handleAssetEdit}
              onDelete={handleAssetDelete}
              onCopyUrl={handleCopyUrl}
              size="sm"
            />
          ))}
        </div>
      )
    } else if (viewMode === 'list') {
      return (
        <div className="space-y-2 pl-4">
          {assets.map((asset) => (
            <div key={asset._id} className="flex items-center space-x-4 hover:bg-muted/50">
              <div className="w-16 h-16 flex-shrink-0">
                <MediaCard
                  asset={asset}
                  isSelected={selectedAssets.some(a => a._id === asset._id)}
                  onSelect={handleAssetSelect}
                  onPreview={handleAssetPreview}
                  onEdit={handleAssetEdit}
                  onDelete={handleAssetDelete}
                  onCopyUrl={handleCopyUrl}
                  size="sm"
                  className="w-16 h-16"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{asset.filename}</p>
                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    {asset.type === 'image' ? (
                      <svg className="w-4 h-4 text-info" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    ) : asset.type === 'video' ? (
                      <svg className="w-4 h-4 text-warning" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832L12 11.202a1 1 0 000-1.664L9.555 7.168z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span>{formatFileSize(asset.size)}</span>
                  {(asset.dimensions || assetDimensions[asset._id]) && (
                    <span>{(asset.dimensions || assetDimensions[asset._id]).width}×{(asset.dimensions || assetDimensions[asset._id]).height}</span>
                  )}
                </div>
              </div>

              {/* Time and Date - Right side */}
              <div className="flex-shrink-0 text-sm text-muted-foreground mr-4 text-right">
                <div>{formatTime(asset.createdAt)}</div>
                <div className="text-xs">{formatRelativeDate(asset.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      )
    } else {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pl-4">
          {assets.map((asset) => (
            <MediaCard
              key={asset._id}
              asset={asset}
              isSelected={selectedAssets.some(a => a._id === asset._id)}
              onSelect={handleAssetSelect}
              onPreview={handleAssetPreview}
              onEdit={handleAssetEdit}
              onDelete={handleAssetDelete}
              onCopyUrl={handleCopyUrl}
              size="lg"
            />
          ))}
        </div>
      )
    }
  }

  return (
    <DashboardLayout title="Media Library">
      <div className="-m-4 -mt-6 md:-m-8 h-[calc(100vh-4rem)]">
        <TooltipProvider>
        <MediaLibraryLayout
          header={
            <MediaHeader
              search={search}
              onSearchChange={handleSearchChange}
              typeFilter={typeFilter}
              onTypeFilterChange={handleTypeFilterChange}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
              selectedCount={selectedAssets.length}
              totalCount={assets.length}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onBulkDelete={handleBulkDelete}
              onBulkDownload={handleBulkDownload}
              onBulkMove={handleBulkMove}
              onBulkTag={handleBulkTag}
              onUpload={handleUpload}
              onCreateFolder={handleCreateFolder}
            />
          }
          sidebar={
            <MediaFolders
              folders={folders}
              currentFolderId={currentFolderId}
              onFolderSelect={handleFolderChange}
            />
          }
          content={renderContent()}
          details={
            showDetails ? (
              <MediaDetails
                asset={selectedAsset}
                onClose={closeDetails}
                onUpdate={updateAsset}
                onDelete={handleAssetDelete}
              />
            ) : null
          }
        />
        
        {/* Gallery Modal */}
        <MediaGallery
          assets={assets}
          isOpen={showGallery}
          onClose={() => setShowGallery(false)}
          initialIndex={galleryIndex}
        />
        </TooltipProvider>
      </div>
    </DashboardLayout>
  )
}