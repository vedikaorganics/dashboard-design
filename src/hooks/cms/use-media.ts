'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  MediaAsset, 
  MediaFolder, 
  MediaAssetListResponse,
  MediaAssetResponse
} from '@/types/cms'

interface UseMediaParams {
  page?: number
  limit?: number
  folderId?: string
  folderPath?: string
  type?: string
  search?: string
  tags?: string
  sortBy?: string
  sortOrder?: string
}

interface UseMediaReturn {
  assets: MediaAsset[]
  folders: MediaFolder[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  } | null
  isLoading: boolean
  error: string | null
  refresh: () => void
  uploadMedia: (data: {
    url: string
    filename: string
    type: string
    size?: number
    dimensions?: { width: number; height: number }
    alt?: string
    caption?: string
    tags?: string[]
    folderId?: string
  }) => Promise<MediaAsset | null>
  createFolder: (name: string, parentId?: string) => Promise<MediaFolder | null>
  deleteAsset: (id: string) => Promise<boolean>
  updateAsset: (id: string, data: {
    alt?: string
    caption?: string
    tags?: string[]
  }) => Promise<MediaAsset | null>
}

export function useMedia(params: UseMediaParams = {}): UseMediaReturn {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [pagination, setPagination] = useState<UseMediaReturn['pagination']>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMedia = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (params.page) searchParams.set('page', params.page.toString())
      if (params.limit) searchParams.set('limit', params.limit.toString())
      
      // Prefer folderPath over folderId if both are provided
      if (params.folderPath) {
        searchParams.set('path', params.folderPath)
      } else if (params.folderId) {
        searchParams.set('folderId', params.folderId)
      }
      
      if (params.type) searchParams.set('type', params.type)
      if (params.search) searchParams.set('search', params.search)
      if (params.tags) searchParams.set('tags', params.tags)
      if (params.sortBy) searchParams.set('sortBy', params.sortBy)
      if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

      const response = await fetch(`/api/cms/media?${searchParams}`)
      const result: MediaAssetListResponse = await response.json()

      if (result.success && result.data) {
        setAssets(result.data.assets)
        setFolders(result.data.folders)
        setPagination(result.data.pagination)
      } else {
        setError(result.error || 'Failed to fetch media')
      }
    } catch (err) {
      setError('Failed to fetch media')
      console.error('Error fetching media:', err)
    } finally {
      setIsLoading(false)
    }
  }, [params.page, params.limit, params.folderId, params.folderPath, params.type, params.search, params.tags, params.sortBy, params.sortOrder])

  const uploadMedia = useCallback(async (data: {
    url: string
    filename: string
    type: string
    size?: number
    dimensions?: { width: number; height: number }
    alt?: string
    caption?: string
    tags?: string[]
    folderId?: string
  }): Promise<MediaAsset | null> => {
    try {
      const response = await fetch('/api/cms/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result: MediaAssetResponse = await response.json()

      if (result.success && result.data) {
        // Add to local state
        setAssets(prevAssets => [result.data!, ...prevAssets])
        return result.data
      } else {
        setError(result.error || 'Failed to upload media')
        return null
      }
    } catch (err) {
      setError('Failed to upload media')
      console.error('Error uploading media:', err)
      return null
    }
  }, [])

  const createFolder = useCallback(async (name: string, parentId?: string): Promise<MediaFolder | null> => {
    try {
      const response = await fetch('/api/cms/media/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId })
      })

      const result = await response.json()

      if (result.success && result.data) {
        // Add to local state
        setFolders(prevFolders => [...prevFolders, result.data])
        return result.data
      } else {
        setError(result.error || 'Failed to create folder')
        return null
      }
    } catch (err) {
      setError('Failed to create folder')
      console.error('Error creating folder:', err)
      return null
    }
  }, [])

  const deleteAsset = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/cms/media/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        // Remove from local state
        setAssets(prevAssets => prevAssets.filter(asset => asset._id !== id))
        return true
      } else {
        setError(result.error || 'Failed to delete asset')
        return false
      }
    } catch (err) {
      setError('Failed to delete asset')
      console.error('Error deleting asset:', err)
      return false
    }
  }, [])

  const updateAsset = useCallback(async (id: string, data: {
    alt?: string
    caption?: string
    tags?: string[]
  }): Promise<MediaAsset | null> => {
    try {
      const response = await fetch(`/api/cms/media/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result: MediaAssetResponse = await response.json()

      if (result.success && result.data) {
        // Update local state
        setAssets(prevAssets => 
          prevAssets.map(asset => 
            asset._id === id ? result.data! : asset
          )
        )
        return result.data
      } else {
        setError(result.error || 'Failed to update asset')
        return null
      }
    } catch (err) {
      setError('Failed to update asset')
      console.error('Error updating asset:', err)
      return null
    }
  }, [])

  const refresh = useCallback(() => {
    fetchMedia()
  }, [fetchMedia])

  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  return {
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
  }
}