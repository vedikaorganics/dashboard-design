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
    <DashboardLayout title="Product content">
      <div className="space-y-6">

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="w-full md:w-80">
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
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {filteredProducts.length} products
          </div>
        </div>

        {/* Content */}
        <div>
          
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product: any) => (
                <Link key={product.id} href={`/cms/products/${product.id}`}>
                  <div className="group border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                    {/* Product Info */}
                    <div className="space-y-2 mb-3">
                      <h3 className="font-medium line-clamp-2 leading-tight text-sm">
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
                    <div className="flex items-center justify-end">
                      <Link href={`/shop/products/${product.id}`} onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}