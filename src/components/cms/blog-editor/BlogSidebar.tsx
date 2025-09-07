'use client'

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

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(Boolean)
    onUpdate({ 
      blogTags: tags,
      seo: {
        ...content.seo,
        keywords: tags
      }
    })
  }

  const handleExcerptChange = (excerpt: string) => {
    onUpdate({ 
      blogExcerpt: excerpt,
      seo: {
        ...content.seo,
        description: excerpt
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
                value={content.blogAuthor || ''}
                onChange={(e) => onUpdate({ blogAuthor: e.target.value })}
                className="h-8"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Tags</Label>
              <Input
                placeholder="health, organic, wellness"
                value={content.blogTags?.join(', ') || ''}
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
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Image className="w-4 h-4" />
            Cover Image
          </h3>
            <Input
              placeholder="Image URL or upload"
              value={content.blogFeaturedImage || ''}
              onChange={(e) => onUpdate({ blogFeaturedImage: e.target.value })}
              className="h-8"
            />
            
            {content.blogFeaturedImage && (
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={content.blogFeaturedImage}
                  alt="Featured image preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              </div>
            )}
        </div>

        {/* Excerpt */}
        <div className="bg-background rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-medium">Excerpt</h3>
            <Textarea
              placeholder="Brief description for preview cards and SEO"
              rows={3}
              value={content.blogExcerpt || ''}
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
                value={content.seo?.title || ''}
                onChange={(e) => onUpdate({
                  seo: {
                    ...content.seo,
                    title: e.target.value
                  }
                })}
                className="h-8"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Meta Description</Label>
              <Textarea
                placeholder="Description for search engines"
                rows={2}
                value={content.seo?.description || ''}
                onChange={(e) => onUpdate({
                  seo: {
                    ...content.seo,
                    description: e.target.value
                  }
                })}
                className="resize-none"
              />
              <div className="text-xs text-muted-foreground">
                {content.seo?.description?.length || 0}/160 characters
              </div>
            </div>
        </div>
      </div>
    </div>
  )
}