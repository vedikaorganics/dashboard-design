'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Edit, Eye, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useProducts } from '@/hooks/use-data'
import { useCMSContent } from '@/hooks/cms/use-cms-content'
import { toast } from 'sonner'

export default function CMSProductsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Get products from the database
  const { data: productsData, isLoading: productsLoading } = useProducts()
  const products = (productsData as any)?.products || []

  // Get existing CMS content for products
  const { content: productContent, isLoading: contentLoading } = useCMSContent({
    type: 'product'
  })

  const isLoading = productsLoading || contentLoading

  // Filter products based on search and content status
  const filteredProducts = products.filter((product: any) => {
    const matchesSearch = !search || 
      product.title.toLowerCase().includes(search.toLowerCase()) ||
      product.slug?.toLowerCase().includes(search.toLowerCase())

    if (statusFilter === 'all') return matchesSearch

    const hasContent = productContent?.some(content => content.productId === product.id)
    const contentStatus = productContent?.find(content => content.productId === product.id)?.status

    if (statusFilter === 'no-content') return matchesSearch && !hasContent
    if (statusFilter === 'draft') return matchesSearch && contentStatus === 'draft'
    if (statusFilter === 'published') return matchesSearch && contentStatus === 'published'

    return matchesSearch
  })

  const getContentStatus = (productId: string) => {
    const content = productContent?.find(c => c.productId === productId)
    if (!content) return 'no-content'
    return content.status
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default">Published</Badge>
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      case 'no-content':
        return <Badge variant="outline">No Content</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }


  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Product Content</h1>
          <p className="text-muted-foreground">
            Manage content for product detail pages using the block editor.
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Content status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All products</SelectItem>
                  <SelectItem value="published">Published content</SelectItem>
                  <SelectItem value="draft">Draft content</SelectItem>
                  <SelectItem value="no-content">No content yet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {filteredProducts.length} products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  {search || statusFilter !== 'all'
                    ? 'Try adjusting your filters to find what you\'re looking for.'
                    : 'No products available in the database.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product: any) => (
                  <Card key={product.id} className="group hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      {/* Product Info */}
                      <div className="space-y-3 mb-4">
                        <h3 className="font-medium line-clamp-2 leading-tight">
                          {product.title}
                        </h3>
                        <div className="text-xs text-muted-foreground">
                          /{product.slug || product.id}
                        </div>
                        <div>
                          {getStatusBadge(getContentStatus(product.id))}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <Link href={`/cms/products/${product.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Content
                          </Button>
                        </Link>
                        <Link href={`/shop/products/${product.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}