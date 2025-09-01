'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProducts } from '@/hooks/use-data'
import { useCMSContent } from '@/hooks/cms/use-cms-content'
import { CMSContent } from '@/types/cms'
import Link from 'next/link'
import { useAuth } from '@/components/auth-provider'

// Import block components for rendering
import { TextBlock } from '@/components/cms/blocks/TextBlock'
import { ImageBlock } from '@/components/cms/blocks/ImageBlock'
import { GalleryBlock } from '@/components/cms/blocks/GalleryBlock'

export default function ProductContentPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string
  const { user } = useAuth()
  
  // Get product details
  const { data: productsData, isLoading: productsLoading } = useProducts()
  const products = (productsData as any)?.products || []
  const product = products.find((p: any) => p.id === productId)
  
  // Get CMS content for this product (public view - only published content)
  const { content: allContent, isLoading: contentLoading } = useCMSContent({
    type: 'product',
    publicView: true
  })
  
  const productContent = allContent?.find(c => c.productId === productId)
  const isLoading = productsLoading || contentLoading

  // Render a content block based on its type
  const renderBlock = (block: any) => {
    const commonProps = {
      content: block.content,
      isEditing: false
    }
    
    switch (block.type) {
      case 'text':
        return <TextBlock key={block.id} {...commonProps} />
      case 'image':
        return <ImageBlock key={block.id} {...commonProps} />
      case 'gallery':
        return <GalleryBlock key={block.id} {...commonProps} />
      default:
        return (
          <div key={block.id} className="p-4 border border-dashed border-muted-foreground/25 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              Block type "{block.type}" not yet implemented
            </p>
          </div>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        {/* Header skeleton */}
        <div className="border-b bg-background">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-muted rounded animate-pulse" />
                <div className="w-48 h-6 bg-muted rounded animate-pulse" />
              </div>
              <div className="w-20 h-8 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Content skeleton */}
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="w-full h-64 bg-muted rounded animate-pulse" />
            <div className="w-full h-32 bg-muted rounded animate-pulse" />
            <div className="w-full h-48 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  // If no CMS content exists, show a basic product view
  // Note: productContent will only be populated if published (due to publicView: true)
  if (!productContent) {
    return (
      <div className="min-h-screen">
        {/* Header */}
        <div className="border-b bg-background">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <h1 className="text-xl font-semibold">{product.title}</h1>
                <Badge variant="outline">No Content</Badge>
              </div>
              {(user?.role === 'admin' || user?.role === 'member') && (
                <Link href={`/cms/products/${productId}`}>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Content
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Basic product display */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Product Image */}
              <div>
                <img
                  src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                  alt={product.title}
                  className="w-full aspect-square object-cover rounded-lg"
                />
              </div>
              
              {/* Product Info */}
              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl font-bold">{product.title}</h1>
                  <p className="text-2xl font-semibold text-primary mt-2">
                    ${product.price}
                  </p>
                </div>
                
                {product.description && (
                  <div>
                    <h3 className="font-medium mb-2">Description</h3>
                    <p className="text-muted-foreground">{product.description}</p>
                  </div>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>SKU: {product.sku}</span>
                  <span>Stock: {product.stock}</span>
                </div>
                
                <div className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    This product doesn't have custom content configured yet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-semibold">{product.title}</h1>
              <Badge variant="default">Published</Badge>
            </div>
            {(user?.role === 'admin' || user?.role === 'member') && (
              <Link href={`/cms/products/${productId}`}>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Content
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Content Blocks */}
      <div className={`${productContent.settings?.layout === 'full-width' ? '' : 'container mx-auto px-4'} py-8`}>
        <div className="space-y-6">
          {productContent.blocks && productContent.blocks.length > 0 ? (
            productContent.blocks
              .sort((a, b) => a.order - b.order)
              .map(renderBlock)
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No content blocks configured for this product.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}