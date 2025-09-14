'use client'

import { use, useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Eye, Globe, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { BlogEditor, BlogEditorRef } from '@/components/cms/blog-editor/BlogEditor'
import { useCMSContentItem } from '@/hooks/cms/use-cms-content'
import { CMSContent } from '@/types/cms'
import { toast } from 'sonner'

interface BlogEditorPageProps {
  params: Promise<{
    slug: string
  }>
}

export default function BlogEditorPage({ params }: BlogEditorPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { content: blogPost, isLoading, error, updateContent } = useCMSContentItem(resolvedParams.slug)
  
  // Local state to track content changes before saving
  const [localContent, setLocalContent] = useState<CMSContent | null>(null)
  const blogEditorRef = useRef<BlogEditorRef>(null)
  
  // Update local content when blogPost changes (initial load, refresh, etc.)
  useEffect(() => {
    if (blogPost) {
      setLocalContent(blogPost)
    }
  }, [blogPost])

  // Local update handler - updates local state without API call
  const handleLocalUpdate = useCallback((updates: Partial<CMSContent>) => {
    setLocalContent(prev => {
      if (!prev) return prev
      return { ...prev, ...updates }
    })
  }, [])

  const handleSave = async (status: 'draft' | 'published' = 'draft') => {
    if (!localContent) return

    try {
      // Get the absolute latest content from the editor
      const currentEditorContent = blogEditorRef.current?.getCurrentContent() || ''
      
      // Create updated blocks with the latest editor content
      const updatedBlocks = [{
        id: localContent.blocks?.[0]?.id || 'text-1',
        type: 'text' as const,
        order: 0,
        content: {
          text: currentEditorContent,
          alignment: 'left' as const
        }
      }]

      const updateData = {
        // Include all current content
        title: localContent.title,
        blocks: updatedBlocks, // Use the latest editor content
        blogCategory: localContent.blogCategory,
        blogTags: localContent.blogTags,
        blogAuthor: localContent.blogAuthor, // Keep for backward compatibility
        authorSlug: localContent.authorSlug, // New field for author references
        blogFeaturedImage: localContent.blogFeaturedImage,
        blogExcerpt: localContent.blogExcerpt,
        seo: localContent.seo,
        slug: localContent.slug,
        // Add status-specific fields
        status,
        ...(status === 'published' && { publishedAt: new Date() })
      }

      await updateContent(updateData)
      toast.success(`Blog post ${status === 'published' ? 'published' : 'saved as draft'} successfully`)
    } catch (error) {
      toast.error(`Failed to ${status === 'published' ? 'publish' : 'save'} blog post`)
    }
  }


  const getStatusBadge = () => {
    if (!localContent) return null
    
    switch (localContent.status) {
      case 'published':
        return <Badge variant="default">Published</Badge>
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      case 'archived':
        return <Badge variant="outline">Archived</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getAuthorDisplayName = () => {
    if (!localContent) return 'Unknown'
    // Prefer authorSlug (new system) over blogAuthor (legacy)
    // For now, we'll show the slug if available, otherwise fall back to blogAuthor
    return localContent.authorSlug || localContent.blogAuthor || 'Unknown'
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading blog post...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !blogPost) {
    return (
      <DashboardLayout title="Blog Post Not Found">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-2">Blog post not found</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => router.push('/cms/blog')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog Posts
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs px-2 py-1"
          onClick={() => router.push('/cms/blog')}
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          Back to Blog Posts
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold">{localContent?.title || 'Untitled Blog Post'}</h1>
                {getStatusBadge()}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <span>By {getAuthorDisplayName()}</span>
                {localContent?.blogCategory && (
                  <>
                    <span>•</span>
                    <span>{localContent.blogCategory}</span>
                  </>
                )}
                {localContent?.blogReadTime && (
                  <>
                    <span>•</span>
                    <span>{localContent.blogReadTime} min read</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs px-3 py-2"
            >
              <Eye className="w-3 h-3 mr-1" />
              Preview
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs px-3 py-2"
              onClick={() => handleSave('draft')}
            >
              <Save className="w-3 h-3 mr-1" />
              Save Draft
            </Button>
            {blogPost.status !== 'published' && (
              <Button
                size="sm"
                className="text-xs px-3 py-2"
                onClick={() => handleSave('published')}
              >
                <Globe className="w-3 h-3 mr-1" />
                Publish
              </Button>
            )}
          </div>
        </div>

        {/* Blog Editor */}
        {localContent && (
          <BlogEditor
            ref={blogEditorRef}
            content={localContent}
            onUpdate={handleLocalUpdate}
            onSave={async () => {
              await handleSave('draft')
            }}
            onPublish={async (publishAt) => {
              await handleSave('published')
            }}
            isLoading={isLoading}
          />
        )}
      </div>
    </DashboardLayout>
  )
}