'use client'

import { useState, useCallback, useEffect, Suspense, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import * as UpChunk from '@mux/upchunk'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { MediaAsset } from '@/types/cms'
import { useMedia } from '@/hooks/cms/use-media'
import { MediaLibraryLayout, useMediaDetails } from '@/components/cms/media-library/MediaLibraryLayout'
import { MediaHeader, ViewMode, SortBy, SortOrder } from '@/components/cms/media-library/MediaHeader'
import { MediaCard } from '@/components/cms/media-library/MediaCard'
import { MediaDetails } from '@/components/cms/media-library/MediaDetails'
import { MediaFolders } from '@/components/cms/media-library/MediaFolders'
import { MediaBreadcrumb } from '@/components/cms/media-library/MediaBreadcrumb'
import { MediaGallery } from '@/components/cms/media-library/MediaGallery'
import { TooltipProvider } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { useUploadToasts } from '@/hooks/use-upload-toasts'
import { UploadProgressToast } from '@/components/ui/upload-progress-toast'
import { 
  analyzeFolderUrl, 
  encodeFolderPath, 
  resolveFolderIdToPath, 
  resolvePathToFolderId,
  normalizeFolderPath,
  extractFolderPathFromParams,
  buildMediaUrl
} from '@/lib/media-path-utils'

interface CMSMediaPageProps {
  params: Promise<{
    path?: string[]
  }>
}

function CMSMediaPageContent({ params }: { params: Promise<{ path?: string[] }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resolvedParams = use(params)
  
  // Extract folder path from URL segments first (new path-based routing)
  const urlFolderPath = extractFolderPathFromParams(resolvedParams)
  
  // Check for legacy query parameters for backward compatibility
  const urlInfo = analyzeFolderUrl(searchParams)
  
  // Determine initial folder path: prioritize URL path, then query params, then default to root
  const initialFolderPath = urlFolderPath !== '/' ? urlFolderPath : (urlInfo.currentPath || '/')
  const hasLegacyParams = urlInfo.isLegacyUrl || (urlInfo.currentPath && urlFolderPath === '/')
  
  const [currentFolderPath, setCurrentFolderPath] = useState<string>(initialFolderPath)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(urlInfo.currentFolderId)
  const [needsLegacyMigration, setNeedsLegacyMigration] = useState(hasLegacyParams)
  
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
  
  // Upload toast system
  const { uploads, createUploadToast, updateUploadProgress, completeUpload, errorUpload, dismissUpload } = useUploadToasts()

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
    // Use path-based querying if we have a path, otherwise fall back to folder ID
    folderPath: currentFolderPath !== '/' ? currentFolderPath : undefined,
    folderId: currentFolderPath === '/' && currentFolderId ? currentFolderId : undefined,
    search: search || undefined,
    type: typeFilter === 'all' ? undefined : typeFilter,
    page: currentPage,
    limit: 24,
    sortBy: sortBy,
    sortOrder: sortOrder
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

  // Upload image to server (existing flow)
  const uploadImageToServer = async (file: File, toastId: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('alt', file.name.split('.')[0])
    formData.append('caption', '')
    formData.append('tags', '')
    
    // Handle folder assignment for upload
    if (currentFolderPath !== '/') {
      // First try to resolve path to ID if folders are loaded
      let folderId: string | null = null
      
      if (folders && folders.length > 0) {
        folderId = resolvePathToFolderId(currentFolderPath, folders)
        console.log(`Upload Debug: Path "${currentFolderPath}" resolved to folderId "${folderId}" (${folders.length} folders available)`)
      } else {
        console.log('Upload Debug: Folders not loaded yet, will use folderPath fallback')
      }
      
      if (folderId) {
        formData.append('folderId', folderId)
        console.log('Upload Debug: Added folderId to FormData')
      } else {
        // Fallback: send the current folder path directly for server-side resolution
        console.log(`Upload Debug: Could not resolve folderId, sending folderPath "${currentFolderPath}"`)
        formData.append('folderPath', currentFolderPath)
      }
    }

    // Track upload progress using XMLHttpRequest for progress events
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100
          updateUploadProgress(toastId, progress)
        }
      }
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } catch (error) {
            reject(new Error('Invalid response format'))
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText)
            reject(new Error(error.error || 'Image upload failed'))
          } catch {
            reject(new Error('Image upload failed'))
          }
        }
      }
      
      xhr.onerror = () => {
        reject(new Error('Network error during upload'))
      }
      
      xhr.open('POST', '/api/cms/media')
      xhr.send(formData)
    })
  }

  // Upload video to Mux (direct upload flow)
  const uploadVideoToMux = async (file: File, toastId: string) => {
    // Step 1: Get upload URL from our API
    const uploadUrlResponse = await fetch('/api/cms/media/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        folderId: currentFolderPath !== '/' ? currentFolderPath : null,
        alt: file.name.split('.')[0],
        caption: '',
        tags: [],
        fileSize: file.size // Pass original file size
      })
    })

    if (!uploadUrlResponse.ok) {
      throw new Error('Failed to get upload URL')
    }

    const { data } = await uploadUrlResponse.json()
    const { uploadUrl, uploadId } = data

    // Step 2: Upload directly to Mux using UpChunk
    return new Promise((resolve, reject) => {
      const upload = UpChunk.createUpload({
        endpoint: uploadUrl,
        file,
        chunkSize: 5120 // 5MB chunks
      })

      upload.on('progress', (progress) => {
        const progressPercent = Math.round(progress.detail)
        updateUploadProgress(toastId, progressPercent)
      })

      upload.on('success', async () => {
        try {
          // Step 3: Notify our server that upload is complete
          const completeResponse = await fetch('/api/cms/media/complete-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uploadId })
          })

          if (!completeResponse.ok) {
            throw new Error('Failed to complete upload')
          }

          const result = await completeResponse.json()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      upload.on('error', (error) => {
        reject(new Error(`Upload failed: ${error.detail}`))  
      })
    })
  }

  // Handle file upload - split by type
  const handleUpload = useCallback(async (files: File[]) => {
    // Validate all files first
    for (const file of files) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        throw new Error(`Unsupported file type: ${file.name}. Only images and videos are allowed.`)
      }
    }

    // Create toast for each file
    const fileToastMap = new Map<string, string>()
    files.forEach(file => {
      const fileKey = `${file.name}-${file.size}`
      const toastId = createUploadToast(file)
      fileToastMap.set(fileKey, toastId)
    })

    // Separate images and videos
    const images = files.filter(f => f.type.startsWith('image/'))
    const videos = files.filter(f => f.type.startsWith('video/'))

    const uploadPromises: Promise<any>[] = []

    // Upload images via FormData (existing flow)
    if (images.length > 0) {
      uploadPromises.push(
        ...images.map(async (file) => {
          const fileKey = `${file.name}-${file.size}`
          const toastId = fileToastMap.get(fileKey)!
          try {
            const result = await uploadImageToServer(file, toastId)
            completeUpload(toastId)
            return result
          } catch (error) {
            errorUpload(toastId, error instanceof Error ? error.message : 'Upload failed')
            throw error
          }
        })
      )
    }

    // Upload videos directly to Mux
    if (videos.length > 0) {
      uploadPromises.push(
        ...videos.map(async (file) => {
          const fileKey = `${file.name}-${file.size}`
          const toastId = fileToastMap.get(fileKey)!
          try {
            const result = await uploadVideoToMux(file, toastId)
            completeUpload(toastId)
            return result
          } catch (error) {
            errorUpload(toastId, error instanceof Error ? error.message : 'Upload failed')
            throw error
          }
        })
      )
    }

    try {
      const results = await Promise.allSettled(uploadPromises)
      
      const successes = results.filter(result => result.status === 'fulfilled').length
      const failures = results.filter(result => result.status === 'rejected').length
      
      if (successes > 0 && failures === 0) {
        // All succeeded - don't show additional toast as individual toasts will show success
      } else if (successes > 0 && failures > 0) {
        toast.warning(`${successes} file(s) uploaded, ${failures} failed`)
      } else if (failures > 0) {
        toast.error(`${failures} upload(s) failed`)
      }
      
      refresh()
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload process failed')
    }
  }, [currentFolderPath, folders, refresh, createUploadToast, completeUpload, errorUpload])

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

  // Handle legacy URL migration and sync with URL changes
  useEffect(() => {
    // Handle legacy query parameter URLs by redirecting to new path-based URLs
    if (needsLegacyMigration) {
      let targetPath = '/'
      
      // Handle legacy folderId parameter
      if (urlInfo.isLegacyUrl && urlInfo.currentFolderId && folders.length > 0) {
        const resolvedPath = resolveFolderIdToPath(urlInfo.currentFolderId, folders)
        if (resolvedPath) {
          targetPath = resolvedPath
        }
      }
      // Handle legacy path parameter
      else if (urlInfo.currentPath && urlFolderPath === '/') {
        targetPath = urlInfo.currentPath
      }
      
      // Build new path-based URL
      const mediaUrl = buildMediaUrl(targetPath)
      
      // Preserve other query parameters
      const params = new URLSearchParams(searchParams.toString())
      params.delete('path')
      params.delete('folderId')
      
      const queryString = params.toString()
      const newUrl = queryString ? `${mediaUrl}?${queryString}` : mediaUrl
      
      router.replace(newUrl)
      setCurrentFolderPath(targetPath)
      setCurrentFolderId(null)
      setNeedsLegacyMigration(false)
      return
    }
    
    // Sync state with URL path changes (browser back/forward navigation)
    const currentUrlPath = extractFolderPathFromParams(resolvedParams)
    if (currentUrlPath !== currentFolderPath) {
      setCurrentFolderPath(currentUrlPath)
      setCurrentFolderId(null)
      setCurrentPage(1) // Reset page when folder changes via browser navigation
    }
  }, [needsLegacyMigration, urlInfo, urlFolderPath, folders, router, searchParams, resolvedParams, currentFolderPath])

  // Handle folder creation
  const handleCreateFolder = useCallback(async (name: string) => {
    // For path-based creation, we need to resolve current path to folder ID
    let parentFolderId: string | undefined
    
    if (currentFolderPath !== '/') {
      // Use the enhanced path resolution for consistency
      const resolvedId = resolvePathToFolderId(currentFolderPath, folders)
      parentFolderId = resolvedId || undefined
    }
    
    const folder = await createFolder(name, parentFolderId)
    if (folder) {
      toast.success('Folder created successfully')
    }
  }, [createFolder, currentFolderPath, folders])

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

  const handleFolderChange = useCallback((folderPath: string) => {
    const normalizedPath = normalizeFolderPath(folderPath)
    
    // Build new path-based URL
    const mediaUrl = buildMediaUrl(normalizedPath)
    
    // Preserve other query parameters (search, filters, etc.) if any
    const params = new URLSearchParams(searchParams.toString())
    // Remove legacy path and folderId parameters
    params.delete('path')
    params.delete('folderId')
    
    const queryString = params.toString()
    const newUrl = queryString ? `${mediaUrl}?${queryString}` : mediaUrl
    
    router.push(newUrl)
    setCurrentFolderPath(normalizedPath)
    setCurrentFolderId(null)
    setCurrentPage(1)
  }, [router, searchParams])

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
    
    if (assets.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-muted-foreground text-center py-4 italic">
            Empty
          </p>
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
    <>
      <UploadProgressToast uploads={uploads} onDismiss={dismissUpload} />
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
          breadcrumb={currentFolderPath !== '/' ? (
            <MediaBreadcrumb
              currentPath={currentFolderPath}
              folders={folders}
              onNavigate={handleFolderChange}
              className="px-6 py-3 border-b bg-background/95"
              maxItems={5}
            />
          ) : undefined}
          sidebar={
            <MediaFolders
              folders={folders}
              currentFolderPath={currentFolderPath}
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
    </>
  )
}

function MediaLibraryFallback() {
  return (
    <DashboardLayout title="Media Library">
      <div className="-m-4 -mt-6 md:-m-8 h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function CMSMediaPage({ params }: CMSMediaPageProps) {
  return (
    <Suspense fallback={<MediaLibraryFallback />}>
      <CMSMediaPageContent params={params} />
    </Suspense>
  )
}