'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Eye, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useCMSContent } from '@/hooks/cms/use-cms-content'
import { BLOG_CATEGORIES, CreateContentRequest } from '@/types/cms'
import { toast } from 'sonner'

export default function NewBlogPostPage() {
  const router = useRouter()
  const { createContent } = useCMSContent()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState<Partial<CreateContentRequest>>({
    title: '',
    slug: '',
    type: 'blog',
    blogCategory: '',
    blogTags: [],
    blogAuthor: '',
    blogExcerpt: '',
    blogFeaturedImage: '',
    status: 'draft',
    seo: {
      title: '',
      description: '',
      keywords: []
    }
  })

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title),
      seo: {
        ...prev.seo,
        title: title || ''
      }
    }))
  }

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(Boolean)
    setFormData(prev => ({
      ...prev,
      blogTags: tags,
      seo: {
        ...prev.seo,
        keywords: tags
      }
    }))
  }

  const handleExcerptChange = (excerpt: string) => {
    setFormData(prev => ({
      ...prev,
      blogExcerpt: excerpt,
      seo: {
        ...prev.seo,
        description: excerpt || ''
      }
    }))
  }

  const handleSave = async (status: 'draft' | 'published') => {
    if (!formData.title || !formData.slug || !formData.blogCategory) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      const blogPost = await createContent({
        ...formData,
        status,
        blocks: []
      } as CreateContentRequest)

      if (blogPost) {
        toast.success(`Blog post ${status === 'draft' ? 'saved as draft' : 'published'} successfully`)
        router.push(`/cms/blog/${blogPost.slug}`)
      }
    } catch (error) {
      toast.error('Failed to create blog post')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedCategory = BLOG_CATEGORIES.find(cat => cat.slug === formData.blogCategory)

  return (
    <DashboardLayout title="New Blog Post">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog Posts
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleSave('draft')}
              disabled={isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSave('published')}
              disabled={isLoading}
            >
              <Globe className="w-4 h-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Post Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter blog post title"
                    value={formData.title || ''}
                    onChange={(e) => handleTitleChange(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    placeholder="url-friendly-slug"
                    value={formData.slug || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      slug: e.target.value
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    URL: /blog/{formData.slug || 'your-slug-here'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    placeholder="Brief description of the blog post"
                    rows={3}
                    value={formData.blogExcerpt || ''}
                    onChange={(e) => handleExcerptChange(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be used for previews and SEO description
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Content blocks will be added after creating the blog post. You can add rich text, images, videos, and more using the block editor.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Publication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.blogCategory || ''}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      blogCategory: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOG_CATEGORIES.map((category) => (
                        <SelectItem key={category.slug} value={category.slug}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
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

                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    placeholder="Author name"
                    value={formData.blogAuthor || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      blogAuthor: e.target.value
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    placeholder="organic, healthy, recipes (comma separated)"
                    value={formData.blogTags?.join(', ') || ''}
                    onChange={(e) => handleTagsChange(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate tags with commas
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Featured Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="featured-image">Image URL</Label>
                  <Input
                    id="featured-image"
                    placeholder="https://example.com/image.jpg"
                    value={formData.blogFeaturedImage || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      blogFeaturedImage: e.target.value
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    You can upload images using the Media Library
                  </p>
                </div>
                
                {formData.blogFeaturedImage && (
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src={formData.blogFeaturedImage}
                      alt="Featured image preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seo-title">SEO Title</Label>
                  <Input
                    id="seo-title"
                    placeholder="SEO optimized title"
                    value={formData.seo?.title || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      seo: {
                        ...prev.seo,
                        title: e.target.value
                      }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seo-description">Meta Description</Label>
                  <Textarea
                    id="seo-description"
                    placeholder="Brief description for search engines"
                    rows={2}
                    value={formData.seo?.description || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      seo: {
                        ...prev.seo,
                        description: e.target.value
                      }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}