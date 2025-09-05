'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react'
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
import { CMSContent, PREDEFINED_PAGES } from '@/types/cms'
import { toast } from 'sonner'

export default function CMSPagesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pageTypeFilter, setPageTypeFilter] = useState('all')

  const {
    content: pages,
    pagination,
    isLoading,
    error,
    deleteContent,
    publishContent,
    unpublishContent
  } = useCMSContent({
    search: search || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    type: 'page', // Only show pages in this interface
    pageType: pageTypeFilter === 'all' ? undefined : pageTypeFilter
  })

  const handleDelete = async (slug: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return
    }

    const success = await deleteContent(slug)
    if (success) {
      toast.success('Page deleted successfully')
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

  // Get predefined pages that haven't been created yet
  const existingSlugs = pages?.map(page => page.slug) || []
  const missingPredefinedPages = PREDEFINED_PAGES.filter(
    predefinedPage => !existingSlugs.includes(predefinedPage.slug)
  )

  const getStatusBadge = (page: CMSContent) => {
    const variant = page.status === 'published' ? 'default' : 
                   page.status === 'draft' ? 'secondary' : 'outline'
    
    return (
      <Badge variant={variant} className="capitalize">
        {page.status}
        {page.scheduledPublishAt && ' (Scheduled)'}
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
      <DashboardLayout title="Pages">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-2">Failed to load pages</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Pages">
      <div className="space-y-6">
        {/* Filters and Actions */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-80">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search pages..."
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
            <Select value={pageTypeFilter} onValueChange={setPageTypeFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="All page types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All page types</SelectItem>
                <SelectItem value="predefined">Predefined Pages</SelectItem>
                <SelectItem value="custom">Custom Pages</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Link href="/cms/pages/new">
            <Button className="w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              New Page
            </Button>
          </Link>
        </div>

        {/* Missing predefined pages */}
        {missingPredefinedPages.length > 0 && (
          <div className="bg-muted/30 border border-dashed rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Missing essential pages
                </p>
                <p className="text-xs text-muted-foreground">
                  {missingPredefinedPages.length} predefined page{missingPredefinedPages.length !== 1 ? 's' : ''} haven't been created yet
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {missingPredefinedPages.map((predefinedPage) => (
                  <Link key={predefinedPage.slug} href={`/cms/pages/new?predefined=${predefinedPage.slug}`}>
                    <Button size="sm" variant="outline" className="text-xs">
                      {predefinedPage.title}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {pagination?.total || 0} pages
            </h2>
          </div>
          
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No pages found</h3>
              <p className="text-muted-foreground mb-4">
                {search || (statusFilter !== 'all') || (pageTypeFilter !== 'all') 
                  ? 'Try adjusting your filters to find what you\'re looking for.'
                  : 'Get started by creating your first page.'}
              </p>
              <Link href="/cms/pages/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Page
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Page Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Blocks</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((page) => (
                    <TableRow key={page._id}>
                      <TableCell>
                        <div>
                          <Link 
                            href={`/cms/pages/${page.slug}`}
                            className="font-medium hover:underline"
                          >
                            {page.title}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            /{page.slug}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {page.pageType || 'custom'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(page)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {page.blocks.length}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(page.updatedAt)}
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
                              <Link href={`/cms/pages/${page.slug}`}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => window.open(`/preview/${page.slug}`, '_blank')}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            {page.status !== 'published' ? (
                              <DropdownMenuItem
                                onClick={() => handlePublish(page.slug, page.title)}
                              >
                                Publish
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleUnpublish(page.slug, page.title)}
                              >
                                Unpublish
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDelete(page.slug, page.title)}
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