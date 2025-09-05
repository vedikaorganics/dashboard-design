'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  CMSContent, 
  CMSContentListResponse, 
  CMSContentResponse,
  CreateContentRequest,
  UpdateContentRequest
} from '@/types/cms'

interface UseCMSContentParams {
  page?: number
  limit?: number
  type?: string
  pageType?: string
  productId?: string
  status?: string
  search?: string
  publicView?: boolean // For public users to only see published content
}

interface UseCMSContentReturn {
  content: CMSContent[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  } | null
  isLoading: boolean
  error: string | null
  refresh: () => void
  createContent: (data: CreateContentRequest) => Promise<CMSContent | null>
  updateContent: (slug: string, data: UpdateContentRequest) => Promise<CMSContent | null>
  deleteContent: (slug: string) => Promise<boolean>
  publishContent: (slug: string, publishAt?: Date) => Promise<CMSContent | null>
  unpublishContent: (slug: string) => Promise<CMSContent | null>
}

export function useCMSContent(params: UseCMSContentParams = {}): UseCMSContentReturn {
  const [content, setContent] = useState<CMSContent[]>([])
  const [pagination, setPagination] = useState<UseCMSContentReturn['pagination']>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContent = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (params.page) searchParams.set('page', params.page.toString())
      if (params.limit) searchParams.set('limit', params.limit.toString())
      if (params.type) searchParams.set('type', params.type)
      if (params.pageType) searchParams.set('pageType', params.pageType)
      if (params.productId) searchParams.set('productId', params.productId)
      if (params.status) searchParams.set('status', params.status)
      if (params.search) searchParams.set('search', params.search)
      if (params.publicView) searchParams.set('publicView', 'true')

      const response = await fetch(`/api/cms/content?${searchParams}`)
      const result: CMSContentListResponse = await response.json()

      if (result.success && result.data) {
        setContent(result.data.content)
        setPagination(result.data.pagination)
      } else {
        setError(result.error || 'Failed to fetch content')
      }
    } catch (err) {
      setError('Failed to fetch content')
      console.error('Error fetching CMS content:', err)
    } finally {
      setIsLoading(false)
    }
  }, [params.page, params.limit, params.type, params.pageType, params.productId, params.status, params.search, params.publicView])

  const createContent = useCallback(async (data: CreateContentRequest): Promise<CMSContent | null> => {
    try {
      const response = await fetch('/api/cms/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result: CMSContentResponse = await response.json()

      if (result.success && result.data) {
        // Refresh the list
        fetchContent()
        return result.data
      } else {
        setError(result.error || 'Failed to create content')
        return null
      }
    } catch (err) {
      setError('Failed to create content')
      console.error('Error creating content:', err)
      return null
    }
  }, [fetchContent])

  const updateContent = useCallback(async (slug: string, data: UpdateContentRequest): Promise<CMSContent | null> => {
    try {
      const response = await fetch(`/api/cms/content/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result: CMSContentResponse = await response.json()

      if (result.success && result.data) {
        // Update the content in local state
        setContent(prevContent => 
          prevContent.map(item => 
            item.slug === slug ? result.data! : item
          )
        )
        return result.data
      } else {
        setError(result.error || 'Failed to update content')
        return null
      }
    } catch (err) {
      setError('Failed to update content')
      console.error('Error updating content:', err)
      return null
    }
  }, [])

  const deleteContent = useCallback(async (slug: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/cms/content/${slug}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        // Remove from local state
        setContent(prevContent => prevContent.filter(item => item.slug !== slug))
        return true
      } else {
        setError(result.error || 'Failed to delete content')
        return false
      }
    } catch (err) {
      setError('Failed to delete content')
      console.error('Error deleting content:', err)
      return false
    }
  }, [])

  const publishContent = useCallback(async (slug: string, publishAt?: Date): Promise<CMSContent | null> => {
    try {
      const response = await fetch(`/api/cms/content/${slug}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishAt })
      })

      const result: CMSContentResponse = await response.json()

      if (result.success && result.data) {
        // Update the content in local state
        setContent(prevContent => 
          prevContent.map(item => 
            item.slug === slug ? result.data! : item
          )
        )
        return result.data
      } else {
        setError(result.error || 'Failed to publish content')
        return null
      }
    } catch (err) {
      setError('Failed to publish content')
      console.error('Error publishing content:', err)
      return null
    }
  }, [])

  const unpublishContent = useCallback(async (slug: string): Promise<CMSContent | null> => {
    try {
      const response = await fetch(`/api/cms/content/${slug}/publish`, {
        method: 'DELETE'
      })

      const result: CMSContentResponse = await response.json()

      if (result.success && result.data) {
        // Update the content in local state
        setContent(prevContent => 
          prevContent.map(item => 
            item.slug === slug ? result.data! : item
          )
        )
        return result.data
      } else {
        setError(result.error || 'Failed to unpublish content')
        return null
      }
    } catch (err) {
      setError('Failed to unpublish content')
      console.error('Error unpublishing content:', err)
      return null
    }
  }, [])

  const refresh = useCallback(() => {
    fetchContent()
  }, [fetchContent])

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  return {
    content,
    pagination,
    isLoading,
    error,
    refresh,
    createContent,
    updateContent,
    deleteContent,
    publishContent,
    unpublishContent
  }
}

// Hook for single content item
export function useCMSContentItem(slug: string) {
  const [content, setContent] = useState<CMSContent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContent = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/cms/content/${slug}`)
      const result: CMSContentResponse = await response.json()

      if (result.success && result.data) {
        setContent(result.data)
      } else {
        setError(result.error || 'Failed to fetch content')
      }
    } catch (err) {
      setError('Failed to fetch content')
      console.error('Error fetching CMS content:', err)
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  const updateContent = useCallback(async (data: UpdateContentRequest): Promise<CMSContent | null> => {
    try {
      const response = await fetch(`/api/cms/content/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result: CMSContentResponse = await response.json()

      if (result.success && result.data) {
        setContent(result.data)
        return result.data
      } else {
        setError(result.error || 'Failed to update content')
        return null
      }
    } catch (err) {
      setError('Failed to update content')
      console.error('Error updating content:', err)
      return null
    }
  }, [slug])

  useEffect(() => {
    if (slug) {
      fetchContent()
    }
  }, [slug, fetchContent])

  return {
    content,
    isLoading,
    error,
    refresh: fetchContent,
    updateContent
  }
}