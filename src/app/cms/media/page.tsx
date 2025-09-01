'use client'

import { useState, useCallback } from 'react'
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
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
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
        <div className="divide-y">
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
                <p className="text-sm text-muted-foreground">
                  {asset.type.toUpperCase()} • {Math.round(asset.size / 1024)} KB
                </p>
              </div>
            </div>
          ))}
        </div>
      )
    } else {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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