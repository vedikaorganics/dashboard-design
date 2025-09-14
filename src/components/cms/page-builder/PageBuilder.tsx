'use client'

import { useState, useCallback, useRef } from 'react'
import { Save, Settings, Plus, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { CMSContent, ContentBlock } from '@/types/cms'
import { createBlock } from '@/lib/cms/blocks'
import { BlockEditor, BlockEditorRef } from '../block-editor/BlockEditor'
import { PageSettings } from './PageSettings'
import { getPreviewUrl } from '@/lib/env'
import { toast } from 'sonner'

interface PageBuilderProps {
  content: CMSContent
  onUpdate: (updates: Partial<CMSContent>) => void
  onSave: () => Promise<void>
  onPublish?: (publishAt?: Date) => Promise<void>
  isLoading?: boolean
  className?: string
  restrictToPageType?: boolean // When true, restrict content type options to pages only
}

export function PageBuilder({
  content,
  onUpdate,
  onSave,
  onPublish,
  isLoading = false,
  className,
  restrictToPageType = false
}: PageBuilderProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const blockEditorRef = useRef<BlockEditorRef>(null)

  // Handle block changes
  const handleBlocksChange = useCallback((blocks: ContentBlock[]) => {
    onUpdate({ blocks })
    setHasUnsavedChanges(true)
  }, [onUpdate])


  // Handle save
  const handleSave = useCallback(async () => {
    try {
      await onSave()
      setHasUnsavedChanges(false)
      toast.success('Changes saved successfully')
    } catch (error) {
      toast.error('Failed to save changes')
      console.error('Save error:', error)
    }
  }, [onSave])

  // Auto-save functionality (could be enhanced with debouncing)
  const handleAutoSave = useCallback(async () => {
    if (hasUnsavedChanges) {
      try {
        await onSave()
        setHasUnsavedChanges(false)
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }
  }, [hasUnsavedChanges, onSave])

  // Handle publish
  const handlePublish = useCallback(async (publishAt?: Date) => {
    if (onPublish) {
      try {
        await onPublish(publishAt)
        toast.success(publishAt ? 'Content scheduled for publishing' : 'Content published successfully')
      } catch (error) {
        toast.error('Failed to publish content')
        console.error('Publish error:', error)
      }
    }
  }, [onPublish])


  const getStatusBadgeVariant = () => {
    switch (content.status) {
      case 'published':
        return 'default'
      case 'draft':
        return 'secondary'
      case 'archived':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return (
    <div className={`flex flex-col h-full ${className || ''}`}>
      {/* Clean unified toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-background">
        {/* Left side - Status info */}
        <div className="flex items-center space-x-3 text-sm text-muted-foreground">
          <Badge variant={getStatusBadgeVariant()} className="text-xs capitalize">
            {content.status}
          </Badge>
          <span>•</span>
          <span>{content.blocks.length} {content.blocks.length === 1 ? 'block' : 'blocks'}</span>
          {hasUnsavedChanges && (
            <>
              <span>•</span>
              <span className="text-amber-600 font-medium">Unsaved changes</span>
            </>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">
          {/* Add Block */}
          <Button
            onClick={() => blockEditorRef.current?.openAddBlockDialog()}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Block
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="px-3"
          >
            <Settings className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Preview */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(getPreviewUrl(content.slug), '_blank')}
            className="px-3"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={isLoading || !hasUnsavedChanges}
            size="sm"
            variant="outline"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>

          {/* Publish */}
          {content.status !== 'published' && (
            <Button
              onClick={() => handlePublish()}
              disabled={isLoading || hasUnsavedChanges}
              size="sm"
            >
              Publish
            </Button>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="flex-1">
          <BlockEditor
            ref={blockEditorRef}
            blocks={content.blocks}
            onChange={handleBlocksChange}
            showToolbar={false}
          />
        </div>

        {/* Settings sidebar */}
        {showSettings && (
          <div className="w-80 border-l bg-background">
            <PageSettings
              content={content}
              onUpdate={onUpdate}
              onClose={() => setShowSettings(false)}
              restrictToPageType={restrictToPageType}
            />
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <div className="flex items-center justify-between p-2 border-t bg-muted/50 text-xs text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>Last saved: {new Date(content.updatedAt).toLocaleString()}</span>
          <span>Version: {content.version}</span>
        </div>
        <div className="flex items-center space-x-4">
          {content.publishedAt && (
            <span>Published: {new Date(content.publishedAt).toLocaleString()}</span>
          )}
          {content.scheduledPublishAt && (
            <span>Scheduled: {new Date(content.scheduledPublishAt).toLocaleString()}</span>
          )}
          <span>Type: {content.type}</span>
        </div>
      </div>

    </div>
  )
}