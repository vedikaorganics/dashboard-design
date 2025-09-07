'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface UseAutoSaveOptions {
  hasChanges: boolean
  onSave: () => Promise<void>
  delay?: number // milliseconds
}

export function useAutoSave({ hasChanges, onSave, delay = 30000 }: UseAutoSaveOptions) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isAutoSaveEnabledRef = useRef(true)

  const performAutoSave = useCallback(async () => {
    if (!hasChanges || isSaving || !isAutoSaveEnabledRef.current) return

    try {
      setIsSaving(true)
      await onSave()
      setLastSaved(new Date())
    } catch (error) {
      console.error('Auto-save failed:', error)
      // Don't throw error to avoid disrupting user experience
    } finally {
      setIsSaving(false)
    }
  }, [hasChanges, isSaving, onSave])

  const resetAutoSaveTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (hasChanges && isAutoSaveEnabledRef.current) {
      timeoutRef.current = setTimeout(performAutoSave, delay)
    }
  }, [hasChanges, delay, performAutoSave])

  const enableAutoSave = useCallback(() => {
    isAutoSaveEnabledRef.current = true
    resetAutoSaveTimer()
  }, [resetAutoSaveTimer])

  const disableAutoSave = useCallback(() => {
    isAutoSaveEnabledRef.current = false
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const saveNow = useCallback(async () => {
    // Temporarily disable auto-save to avoid conflicts
    disableAutoSave()
    
    try {
      await performAutoSave()
    } finally {
      // Re-enable auto-save after manual save
      setTimeout(enableAutoSave, 1000)
    }
  }, [performAutoSave, disableAutoSave, enableAutoSave])

  // Set up auto-save timer when hasChanges changes
  useEffect(() => {
    resetAutoSaveTimer()

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [resetAutoSaveTimer])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Auto-save on page unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasChanges) {
        event.preventDefault()
        return (event.returnValue = 'You have unsaved changes. Are you sure you want to leave?')
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  return {
    isSaving,
    lastSaved,
    saveNow,
    enableAutoSave,
    disableAutoSave
  }
}