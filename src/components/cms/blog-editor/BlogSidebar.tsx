'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tag, User, Image, Settings, Lock, ExternalLink } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CMSContent, BLOG_CATEGORIES } from '@/types/cms'
import { MediaInput } from '@/components/cms/media-library/MediaInput'
import { cn } from '@/lib/utils'

interface BlogSidebarProps {
  content: CMSContent
  onUpdate: (updates: Partial<CMSContent>) => void
  className?: string
}

export function BlogSidebar({
  content,
  onUpdate,
  className
}: BlogSidebarProps) {
  // Local state for text inputs to prevent glitching
  // Initialize once from content, then keep as source of truth
  const [localAuthor, setLocalAuthor] = useState(content.blogAuthor || '')
  const [localTags, setLocalTags] = useState(content.blogTags?.join(', ') || '')
  const [localExcerpt, setLocalExcerpt] = useState(content.blogExcerpt || '')
  const [localSeoTitle, setLocalSeoTitle] = useState(content.seo?.title || '')
  const [localSeoDescription, setLocalSeoDescription] = useState(content.seo?.description || '')

  // Debounced update function
  const debouncedUpdate = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (updates: Partial<CMSContent>, delay: number = 500) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          onUpdate(updates)
        }, delay)
      }
    })(),
    [onUpdate]
  )

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleTitleChange = (newTitle: string) => {
    const updates: any = { title: newTitle }
    
    // Auto-generate slug only if content has never been published
    if (!content.publishedAt) {
      updates.slug = generateSlug(newTitle)
    }
    
    onUpdate(updates)
  }

  const handleSlugChange = (newSlug: string) => {
    // Only allow slug changes if content has never been published
    if (!content.publishedAt) {
      onUpdate({ slug: newSlug })
    }
  }

  const isSlugFrozen = Boolean(content.publishedAt)

  const handleCoverImageChange = (value: { url: string; assetId?: string; filename?: string; dimensions?: { width: number; height: number } } | undefined) => {
    onUpdate({ blogFeaturedImage: value?.url || '' })
  }

  const handleAuthorChange = (newAuthor: string) => {
    setLocalAuthor(newAuthor)
    debouncedUpdate({ blogAuthor: newAuthor })
  }

  const handleTagsChange = (tagsString: string) => {
    setLocalTags(tagsString)
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(Boolean)
    debouncedUpdate({ 
      blogTags: tags,
      seo: {
        ...content.seo,
        keywords: tags
      }
    })
  }

  const handleExcerptChange = (excerpt: string) => {
    setLocalExcerpt(excerpt)
    debouncedUpdate({ 
      blogExcerpt: excerpt,
      seo: {
        ...content.seo,
        description: excerpt
      }
    })
  }

  const handleSeoTitleChange = (title: string) => {
    setLocalSeoTitle(title)
    debouncedUpdate({
      seo: {
        ...content.seo,
        title: title
      }
    })
  }

  const handleSeoDescriptionChange = (description: string) => {
    setLocalSeoDescription(description)
    debouncedUpdate({
      seo: {
        ...content.seo,
        description: description
      }
    })
  }


  const selectedCategory = BLOG_CATEGORIES.find(cat => cat.slug === content.blogCategory)

  return (
    <div className={cn(
      'w-80 h-full bg-muted/5 overflow-y-auto',
      className
    )}>
      <div className="p-4 space-y-6">
        {/* Title and URL */}
        <div className="bg-background rounded-lg p-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Title</Label>
            <Input
              value={content.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter blog post title..."
              className="h-8"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium">URL Slug</Label>
              {isSlugFrozen && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  <span>Frozen after publish</span>
                </div>
              )}
            </div>
            <div className="relative">
              <Input
                value={content.slug || ''}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="auto-generated-from-title"
                disabled={isSlugFrozen}
                className={cn(
                  "h-8",
                  isSlugFrozen && "bg-muted cursor-not-allowed opacity-60"
                )}
              />
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ExternalLink className="w-3 h-3" />
              <span>/blog/{content.slug || 'post-slug'}</span>
            </div>
            {isSlugFrozen && (
              <p className="text-xs text-muted-foreground">
                URL cannot be changed after first publication to preserve links.
              </p>
            )}
          </div>
        </div>

        <div className="bg-background rounded-lg p-4 space-y-4">
            {/* Category */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Category</Label>
              <Select
                value={content.blogCategory || ''}
                onValueChange={(value) => onUpdate({ blogCategory: value })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {BLOG_CATEGORIES.map((category) => (
                    <SelectItem key={category.slug} value={category.slug}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm">{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCategory && (
                <p className="text-xs text-muted-foreground">
                  {selectedCategory.description}
                </p>
              )}
            </div>

            {/* Author */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Author</Label>
              <Input
                placeholder="Author name"
                value={localAuthor}
                onChange={(e) => handleAuthorChange(e.target.value)}
                className="h-8"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Tags</Label>
              <Input
                placeholder="health, organic, wellness"
                value={localTags}
                onChange={(e) => handleTagsChange(e.target.value)}
                className="h-8"
              />
              {content.blogTags && content.blogTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {content.blogTags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
        </div>

        {/* Cover Image */}
        <div className="bg-background rounded-lg p-4 space-y-3">
          <MediaInput
            label="Cover Image"
            value={content.blogFeaturedImage || ''}
            onChange={handleCoverImageChange}
            accept="image"
            placeholder="Select cover image from library..."
            required={false}
            allowClear={true}
            previewSize="lg"
          />
        </div>

        {/* Excerpt */}
        <div className="bg-background rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-medium">Excerpt</h3>
            <Textarea
              placeholder="Brief description for preview cards and SEO"
              rows={3}
              value={localExcerpt}
              onChange={(e) => handleExcerptChange(e.target.value)}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Used in preview cards and search results
            </p>
        </div>

        {/* SEO */}
        <div className="bg-background rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Settings className="w-4 h-4" />
            SEO
          </h3>
            <div className="space-y-2">
              <Label className="text-xs font-medium">SEO Title</Label>
              <Input
                placeholder="SEO optimized title"
                value={localSeoTitle}
                onChange={(e) => handleSeoTitleChange(e.target.value)}
                className="h-8"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Meta Description</Label>
              <Textarea
                placeholder="Description for search engines"
                rows={2}
                value={localSeoDescription}
                onChange={(e) => handleSeoDescriptionChange(e.target.value)}
                className="resize-none"
              />
              <div className="text-xs text-muted-foreground">
                {localSeoDescription?.length || 0}/160 characters
              </div>
            </div>
        </div>
      </div>
    </div>
  )
}