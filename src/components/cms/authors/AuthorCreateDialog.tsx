'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AuthorForm } from './AuthorForm'
import type { Author } from '@/types/authors'

interface AuthorCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAuthorCreated?: (author: Author) => void
}

export function AuthorCreateDialog({
  open,
  onOpenChange,
  onAuthorCreated
}: AuthorCreateDialogProps) {
  const handleSave = (author: Author) => {
    onAuthorCreated?.(author)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl sm:max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Author</DialogTitle>
          <DialogDescription>
            Add a new author profile to the system
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6">
          <AuthorForm 
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}