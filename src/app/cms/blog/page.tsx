'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, Eye, Edit, Trash2, MoreHorizontal, Calendar, User, Tag, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useCMSContent } from '@/hooks/cms/use-cms-content'
import { CMSContent, BLOG_CATEGORIES } from '@/types/cms'
import { toast } from 'sonner'

export default function CMSBlogPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const {
    content: blogPosts,
    pagination,
    isLoading,
    error,
    deleteContent,
    publishContent,
    unpublishContent
  } = useCMSContent({
    search: search || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    type: 'blog', // Only show blog posts in this interface
    pageType: categoryFilter === 'all' ? undefined : categoryFilter
  })

  const handleDelete = async (slug: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return
    }

    const success = await deleteContent(slug)
    if (success) {
      toast.success('Blog post deleted successfully')
    }
  }

  const handlePublish = async (slug: string, title: string) => {
    const success = await publishContent(slug)
    if (success) {
      toast.success(`"${title}" published successfully`)
    }
  }

  const handleUnpublish = async (slug: string, title: string) => {
    const success = await unpublishContent(slug)
    if (success) {
      toast.success(`"${title}" unpublished successfully`)
    }
  }

  const getStatusBadge = (post: CMSContent) => {
    const variant = post.status === 'published' ? 'default' : 
                   post.status === 'draft' ? 'secondary' : 'outline'
    
    return (
      <Badge variant={variant} className="capitalize">
        {post.status}
        {post.scheduledPublishAt && ' (Scheduled)'}
      </Badge>
    )
  }

  const getCategoryBadge = (categorySlug?: string) => {
    if (!categorySlug) return null
    
    const category = BLOG_CATEGORIES.find(cat => cat.slug === categorySlug)
    if (!category) return <Badge variant="outline">{categorySlug}</Badge>
    
    return (
      <Badge 
        variant="outline" 
        style={{ 
          borderColor: category.color, 
          color: category.color,
          backgroundColor: `${category.color}10`
        }}
      >
        {category.name}
      </Badge>
    )
  }

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  if (error) {
    return (
      <DashboardLayout title="Blog Posts">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-2">Failed to load blog posts</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Blog Posts">
      <div className="space-y-6">
        {/* Filters and Actions */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-80">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search blog posts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {BLOG_CATEGORIES.map((category) => (
                  <SelectItem key={category.slug} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Link href="/cms/blog/authors">
              <Button variant="outline" className="w-full md:w-auto">
                <User className="w-4 h-4 mr-2" />
                Manage Authors
              </Button>
            </Link>
            <Link href="/cms/blog/new">
              <Button className="w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                New Blog Post
              </Button>
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {pagination?.total || 0} blog posts
            </h2>
          </div>
          
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : blogPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No blog posts found</h3>
              <p className="text-muted-foreground mb-4">
                {search || (statusFilter !== 'all') || (categoryFilter !== 'all') 
                  ? 'Try adjusting your filters to find what you\'re looking for.'
                  : 'Get started by creating your first blog post.'}
              </p>
              <Link href="/cms/blog/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Blog Post
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Read Time</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blogPosts.map((post) => (
                    <TableRow key={post._id}>
                      <TableCell>
                        <div>
                          <Link 
                            href={`/cms/blog/${post.slug}`}
                            className="font-medium hover:underline"
                          >
                            {post.title}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            /{post.slug}
                          </div>
                          {post.blogExcerpt && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {post.blogExcerpt}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getCategoryBadge(post.blogCategory)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{post.blogAuthor || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(post)}
                      </TableCell>
                      <TableCell>
                        {post.blogReadTime && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {post.blogReadTime}min
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(post.updatedAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/cms/blog/${post.slug}`}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            {post.status !== 'published' ? (
                              <DropdownMenuItem
                                onClick={() => handlePublish(post.slug, post.title)}
                              >
                                Publish
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleUnpublish(post.slug, post.title)}
                              >
                                Unpublish
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDelete(post.slug, post.title)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}