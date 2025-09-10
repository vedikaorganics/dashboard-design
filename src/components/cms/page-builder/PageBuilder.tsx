'use client'

import { useState, useCallback } from 'react'
import { Save, Eye, EyeOff, Settings, Monitor, Tablet, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { CMSContent, ContentBlock } from '@/types/cms'
import { BlockEditor } from '../block-editor/BlockEditor'
import { PagePreview } from './PagePreview'
import { PageSettings } from './PageSettings'
import { PublishControls } from '../common/PublishControls'
import { toast } from 'sonner'

interface PageBuilderProps {
  content: CMSContent
  onUpdate: (updates: Partial<CMSContent>) => void
  onSave: () => Promise<void>
  onPublish?: (publishAt?: Date) => Promise<void>
  onUnpublish?: () => Promise<void>
  isLoading?: boolean
  className?: string
  restrictToPageType?: boolean // When true, restrict content type options to pages only
}

export function PageBuilder({
  content,
  onUpdate,
  onSave,
  onPublish,
  onUnpublish,
  isLoading = false,
  className,
  restrictToPageType = false
}: PageBuilderProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

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

  // Handle unpublish
  const handleUnpublish = useCallback(async () => {
    if (onUnpublish) {
      try {
        await onUnpublish()
        toast.success('Content unpublished successfully')
      } catch (error) {
        toast.error('Failed to unpublish content')
        console.error('Unpublish error:', error)
      }
    }
  }, [onUnpublish])

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
      {/* Top toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Left side - Content info */}
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-lg font-semibold truncate max-w-64">
              {content.title}
            </h1>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Badge variant={getStatusBadgeVariant()} className="text-xs capitalize">
                {content.status}
              </Badge>
              <span>•</span>
              <span>{content.blocks.length} blocks</span>
              {hasUnsavedChanges && (
                <>
                  <span>•</span>
                  <span className="text-amber-600">Unsaved changes</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">
          {/* Preview toggle */}
          <Button
            variant={showPreview ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            Preview
          </Button>

          {/* Device selector (only show when preview is active) */}
          {showPreview && (
            <div className="flex items-center border rounded-md">
              <Button
                variant={previewDevice === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewDevice('desktop')}
                className="rounded-r-none"
              >
                <Monitor className="w-4 h-4" />
              </Button>
              <Button
                variant={previewDevice === 'tablet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewDevice('tablet')}
                className="rounded-none border-x"
              >
                <Tablet className="w-4 h-4" />
              </Button>
              <Button
                variant={previewDevice === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewDevice('mobile')}
                className="rounded-l-none"
              >
                <Smartphone className="w-4 h-4" />
              </Button>
            </div>
          )}

          <Separator orientation="vertical" className="h-8" />

          {/* Settings */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={isLoading || !hasUnsavedChanges}
            size="sm"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>

          {/* Publish controls */}
          <PublishControls
            status={content.status}
            publishedAt={content.publishedAt}
            scheduledPublishAt={content.scheduledPublishAt}
            onPublish={handlePublish}
            onUnpublish={handleUnpublish}
            disabled={isLoading || hasUnsavedChanges}
          />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className={showPreview ? 'w-1/2 border-r' : 'flex-1'}>
          <BlockEditor
            blocks={content.blocks}
            onChange={handleBlocksChange}
            onPreview={() => setShowPreview(true)}
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="w-1/2 bg-muted/20">
            <PagePreview
              content={content}
              device={previewDevice}
              onDeviceChange={setPreviewDevice}
              onClose={() => setShowPreview(false)}
            />
          </div>
        )}

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