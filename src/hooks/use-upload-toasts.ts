'use client'

import { useState, useCallback } from 'react'

interface UploadProgress {
  id: string
  filename: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
  type: 'image' | 'video'
  errorMessage?: string
}

export function useUploadToasts() {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map())

  const createUploadToast = useCallback((file: File): string => {
    const uploadId = `${file.name}-${file.size}-${Date.now()}`
    const fileType = file.type.startsWith('image/') ? 'image' : 'video'
    
    const uploadProgress: UploadProgress = {
      id: uploadId,
      filename: file.name,
      progress: 0,
      status: 'uploading',
      type: fileType
    }

    // Add to state
    setUploads(prev => new Map(prev.set(uploadId, uploadProgress)))
    return uploadId
  }, [])

  const updateUploadProgress = useCallback((uploadId: string, progress: number) => {
    setUploads(prev => {
      const existing = prev.get(uploadId)
      if (!existing) return prev
      
      const updated = { ...existing, progress: Math.round(progress) }
      const newMap = new Map(prev)
      newMap.set(uploadId, updated)
      return newMap
    })
  }, [])

  const completeUpload = useCallback((uploadId: string) => {
    setUploads(prev => {
      const existing = prev.get(uploadId)
      if (!existing) return prev
      
      const completed = { ...existing, progress: 100, status: 'completed' as const }
      const newMap = new Map(prev)
      newMap.set(uploadId, completed)
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        setUploads(current => {
          const updated = new Map(current)
          updated.delete(uploadId)
          return updated
        })
      }, 5000)
      
      return newMap
    })
  }, [])

  const errorUpload = useCallback((uploadId: string, errorMessage?: string) => {
    setUploads(prev => {
      const existing = prev.get(uploadId)
      if (!existing) return prev
      
      const errored = { ...existing, status: 'error' as const, errorMessage }
      const newMap = new Map(prev)
      newMap.set(uploadId, errored)
      
      return newMap
    })
  }, [])

  const dismissUpload = useCallback((uploadId: string) => {
    setUploads(prev => {
      const newMap = new Map(prev)
      newMap.delete(uploadId)
      return newMap
    })
  }, [])

  return {
    uploads,
    createUploadToast,
    updateUploadProgress,
    completeUpload,
    errorUpload,
    dismissUpload
  }
}