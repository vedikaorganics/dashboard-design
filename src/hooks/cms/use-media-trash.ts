'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  MediaAsset, 
  MediaAssetListResponse,
  MediaAssetResponse
} from '@/types/cms'

interface UseMediaTrashParams {
  page?: number
  limit?: number
  type?: string
  search?: string
  sortBy?: string
  sortOrder?: string
}

interface UseMediaTrashReturn {
  assets: MediaAsset[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  } | null
  isLoading: boolean
  error: string | null
  refresh: () => void
  restoreAsset: (id: string) => Promise<MediaAsset | null>
  permanentlyDeleteAssets: (ids: string[]) => Promise<boolean>
}

export function useMediaTrash(params: UseMediaTrashParams = {}): UseMediaTrashReturn {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [pagination, setPagination] = useState<UseMediaTrashReturn['pagination']>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTrashMedia = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (params.page) searchParams.set('page', params.page.toString())
      if (params.limit) searchParams.set('limit', params.limit.toString())
      if (params.type) searchParams.set('type', params.type)
      if (params.search) searchParams.set('search', params.search)
      if (params.sortBy) searchParams.set('sortBy', params.sortBy)
      if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

      const response = await fetch(`/api/cms/media/trash?${searchParams}`)
      const result: MediaAssetListResponse = await response.json()

      if (result.success && result.data) {
        setAssets(result.data.assets)
        setPagination(result.data.pagination)
      } else {
        setError(result.error || 'Failed to fetch trash media')
      }
    } catch (err) {
      setError('Failed to fetch trash media')
      console.error('Error fetching trash media:', err)
    } finally {
      setIsLoading(false)
    }
  }, [params.page, params.limit, params.type, params.search, params.sortBy, params.sortOrder])

  const restoreAsset = useCallback(async (id: string): Promise<MediaAsset | null> => {
    try {
      const response = await fetch(`/api/cms/media/${id}/restore`, {
        method: 'POST'
      })

      const result: MediaAssetResponse = await response.json()

      if (result.success && result.data) {
        // Remove from trash list
        setAssets(prevAssets => prevAssets.filter(asset => asset._id !== id))
        return result.data
      } else {
        setError(result.error || 'Failed to restore asset')
        return null
      }
    } catch (err) {
      setError('Failed to restore asset')
      console.error('Error restoring asset:', err)
      return null
    }
  }, [])

  const permanentlyDeleteAssets = useCallback(async (ids: string[]): Promise<boolean> => {
    try {
      const response = await fetch(`/api/cms/media/trash?ids=${ids.join(',')}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        // Remove from local state
        setAssets(prevAssets => prevAssets.filter(asset => !ids.includes(asset._id)))
        return true
      } else {
        setError(result.error || 'Failed to permanently delete assets')
        return false
      }
    } catch (err) {
      setError('Failed to permanently delete assets')
      console.error('Error permanently deleting assets:', err)
      return false
    }
  }, [])

  const refresh = useCallback(() => {
    fetchTrashMedia()
  }, [fetchTrashMedia])

  useEffect(() => {
    fetchTrashMedia()
  }, [fetchTrashMedia])

  return {
    assets,
    pagination,
    isLoading,
    error,
    refresh,
    restoreAsset,
    permanentlyDeleteAssets
  }
}