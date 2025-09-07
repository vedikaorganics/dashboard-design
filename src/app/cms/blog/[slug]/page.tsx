'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Eye, Globe, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { BlogEditor } from '@/components/cms/blog-editor/BlogEditor'
import { useCMSContentItem } from '@/hooks/cms/use-cms-content'
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

  const handleSave = async (status: 'draft' | 'published' = 'draft') => {
    if (!blogPost) return

    try {
      if (status === 'published') {
        await updateContent({
          status: 'published',
          publishedAt: new Date()
        })
        toast.success('Blog post published successfully')
      } else {
        await updateContent({ status: 'draft' })
        toast.success('Blog post saved as draft')
      }
    } catch (error) {
      toast.error(`Failed to ${status === 'published' ? 'publish' : 'save'} blog post`)
    }
  }

  const handleUnpublish = async () => {
    if (!blogPost) return

    try {
      await updateContent({
        status: 'draft',
        publishedAt: undefined,
        scheduledPublishAt: undefined
      })
      toast.success('Blog post unpublished successfully')
    } catch (error) {
      toast.error('Failed to unpublish blog post')
    }
  }

  const getStatusBadge = () => {
    if (!blogPost) return null
    
    switch (blogPost.status) {
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
                <h1 className="text-xl font-bold">{blogPost.title || 'Untitled Blog Post'}</h1>
                {getStatusBadge()}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <span>By {blogPost.blogAuthor || 'Unknown'}</span>
                {blogPost.blogCategory && (
                  <>
                    <span>•</span>
                    <span>{blogPost.blogCategory}</span>
                  </>
                )}
                {blogPost.blogReadTime && (
                  <>
                    <span>•</span>
                    <span>{blogPost.blogReadTime} min read</span>
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
            {blogPost.status === 'published' ? (
              <Button 
                variant="outline"
                size="sm"
                className="text-xs px-3 py-2"
                onClick={handleUnpublish}
              >
                Unpublish
              </Button>
            ) : (
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
        <BlogEditor
          content={blogPost}
          onUpdate={updateContent}
          onSave={async () => {
            await handleSave('draft')
          }}
          onPublish={async (publishAt) => {
            await updateContent({
              status: 'published',
              publishedAt: publishAt || new Date(),
              ...(publishAt && { scheduledPublishAt: publishAt })
            })
          }}
          onUnpublish={handleUnpublish}
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  )
}