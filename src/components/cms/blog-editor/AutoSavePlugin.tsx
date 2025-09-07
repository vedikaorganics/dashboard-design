'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect, useRef, useState } from 'react'
import { $generateHtmlFromNodes } from '@lexical/html'

interface AutoSavePluginProps {
  onSave: (content: string) => Promise<void>
  delay?: number
  hasUnsavedChanges?: boolean
  onUnsavedChanges?: (hasChanges: boolean) => void
  initialContent?: string
}

export function AutoSavePlugin({ 
  onSave, 
  delay = 30000, // 30 seconds
  hasUnsavedChanges = false,
  onUnsavedChanges,
  initialContent = ''
}: AutoSavePluginProps) {
  const [editor] = useLexicalComposerContext()
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastContentRef = useRef<string>(initialContent)
  const isAutoSaveEnabledRef = useRef(true)

  const performAutoSave = async (content: string) => {
    if (!content || content === lastContentRef.current || isSaving || !isAutoSaveEnabledRef.current) {
      return
    }

    try {
      setIsSaving(true)
      await onSave(content)
      setLastSaved(new Date())
      lastContentRef.current = content
      onUnsavedChanges?.(false)
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const scheduleAutoSave = (content: string) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Check if content has changed
    if (content !== lastContentRef.current) {
      onUnsavedChanges?.(true)
      
      // Schedule new auto-save
      if (isAutoSaveEnabledRef.current) {
        timeoutRef.current = setTimeout(() => {
          performAutoSave(content)
        }, delay)
      }
    }
  }

  const saveNow = async () => {
    // Temporarily disable auto-save to avoid conflicts
    isAutoSaveEnabledRef.current = false
    
    try {
      const content = editor.getEditorState().read(() => {
        return $generateHtmlFromNodes(editor)
      })
      await performAutoSave(content)
    } finally {
      // Re-enable auto-save after manual save
      setTimeout(() => {
        isAutoSaveEnabledRef.current = true
      }, 1000)
    }
  }

  // Keyboard shortcut for manual save
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        saveNow()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Auto-save on page unload
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault()
        return (event.returnValue = 'You have unsaved changes. Are you sure you want to leave?')
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Listen to editor changes
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const content = $generateHtmlFromNodes(editor)
        scheduleAutoSave(content)
      })
    })
  }, [editor, delay])

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Export save function for external use
  useEffect(() => {
    // Attach saveNow to the editor instance for external access
    ;(editor as any)._autoSave = { saveNow }
  }, [editor])

  return null // This plugin doesn't render anything
}

// Hook to access auto-save functionality
export function useAutoSave(editor: any) {
  const saveNow = () => {
    if (editor?._autoSave?.saveNow) {
      return editor._autoSave.saveNow()
    }
    return Promise.resolve()
  }

  return { saveNow }
}