'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AuthorForm } from './AuthorForm'
import type { Author } from '@/types/authors'

interface AuthorEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  authorSlug?: string
  onAuthorUpdated?: (author: Author) => void
}

export function AuthorEditDialog({
  open,
  onOpenChange,
  authorSlug,
  onAuthorUpdated
}: AuthorEditDialogProps) {
  const [author, setAuthor] = useState<Author | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAuthor = async () => {
      if (!authorSlug || !open) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/cms/authors/${authorSlug}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Author not found')
          }
          throw new Error('Failed to fetch author')
        }
        
        const authorData = await response.json()
        setAuthor(authorData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load author')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAuthor()
  }, [authorSlug, open])

  const handleSave = (savedAuthor: Author) => {
    setAuthor(savedAuthor)
    onAuthorUpdated?.(savedAuthor)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl sm:max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isLoading ? 'Loading...' : error ? 'Error' : `Edit ${author?.displayName || 'Author'}`}
          </DialogTitle>
          <DialogDescription>
            {error ? error : 'Update author profile information'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>Loading author...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
            </div>
          ) : author ? (
            <AuthorForm 
              author={author}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}