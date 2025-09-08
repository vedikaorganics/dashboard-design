'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Eye, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { BlockEditor } from '@/components/cms/block-editor/BlockEditor'
import { useCMSContent } from '@/hooks/cms/use-cms-content'
import { useProducts } from '@/hooks/use-data'
import { CMSContent, ContentBlock, SEOMetadata } from '@/types/cms'
import { toast } from 'sonner'
import Link from 'next/link'

export default function ProductContentPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string

  // Get product details
  const { data: productsData, isLoading: productsLoading } = useProducts()
  const products = (productsData as any)?.products || []
  const product = products.find((p: any) => p.id === productId)

  // Get existing CMS content for this product
  const { content: allContent, isLoading: contentLoading, createContent, updateContent, publishContent, unpublishContent, refresh } = useCMSContent({
    type: 'product'
  })
  
  const existingContent = allContent?.find(c => c.productId === productId)
  
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [seoSettings, setSeoSettings] = useState<SEOMetadata>({
    title: '',
    description: '',
    keywords: []
  })
  const [isSaving, setIsSaving] = useState(false)

  // Initialize content when data loads
  useEffect(() => {
    if (existingContent) {
      setBlocks(existingContent.blocks || [])
      setSeoSettings(existingContent.seo || seoSettings)
    } else if (product) {
      // Initialize with product data
      setSeoSettings({
        title: product.title,
        description: product.description || '',
        keywords: product.tags || []
      })
    }
  }, [existingContent, product])

  const handleSave = async (status: 'draft' | 'published' = 'draft') => {
    if (!product) return

    setIsSaving(true)
    try {
      let result = null
      
      if (existingContent) {
        // Always save content changes first (drafts update in-place)
        result = await updateContent(existingContent.slug, {
          blocks,
          seo: seoSettings
        })
        
        // If user wants to publish, use dedicated publish endpoint
        if (status === 'published') {
          result = await publishContent(existingContent.slug)
        }
      } else {
        // For new content, create with the desired status
        const contentData = {
          slug: product.slug || `product-${product.id}`,
          type: 'product' as const,
          productId: product.id,
          title: product.title,
          blocks,
          seo: seoSettings,
          status
        }
        result = await createContent(contentData)
      }

      if (result) {
        toast.success(`Content ${status === 'published' ? 'published' : 'saved'} successfully`)
        // Refresh the content list to show updated status
        refresh()
      }
    } catch (error) {
      toast.error('Failed to save content')
    } finally {
      setIsSaving(false)
    }
  }

  const isLoading = productsLoading || contentLoading

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="h-96 bg-muted rounded animate-pulse" />
        </div>
      </DashboardLayout>
    )
  }

  if (!product) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
          <Link href="/cms/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const getStatusBadge = () => {
    if (!existingContent) return <Badge variant="outline">No Content</Badge>
    
    switch (existingContent.status) {
      case 'published':
        return <Badge variant="default">Published</Badge>
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Back Button */}
        <Link href="/cms/products">
          <Button variant="ghost" size="sm" className="text-xs px-2 py-1">
            <ArrowLeft className="w-3 h-3 mr-1" />
            Back
          </Button>
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mt-8">
          <div className="flex items-start space-x-4">
            {(() => {
              const mainVariant = product.variants?.find((v: any) => v.id === product.mainVariant) || product.variants?.[0]
              return mainVariant?.coverImage ? (
                <img
                  src={mainVariant.coverImage}
                  alt={product.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">No Image</span>
                </div>
              )
            })()}
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold">{product.title}</h1>
                {getStatusBadge()}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {product.description}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link href={`${process.env.NEXT_PUBLIC_PAYMENT_SERVER_URL || ''}/draft/shop/${product.id}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="text-xs px-3 py-2">
                <Eye className="w-3 h-3 mr-1" />
                Preview
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs px-3 py-2"
              onClick={() => handleSave('draft')}
              disabled={isSaving}
            >
              <Save className="w-3 h-3 mr-1" />
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button 
              size="sm"
              className="text-xs px-3 py-2"
              onClick={() => handleSave('published')}
              disabled={isSaving}
            >
              <Globe className="w-3 h-3 mr-1" />
              Publish
            </Button>
          </div>
        </div>

        {/* Content Editor */}
        <Tabs defaultValue="content" className="space-y-4">
          <TabsList>
            <TabsTrigger value="content">Content Blocks</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <BlockEditor
              blocks={blocks}
              onChange={setBlocks}
            />
          </TabsContent>


          <TabsContent value="seo" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Meta Title</label>
                <input
                  type="text"
                  value={seoSettings.title || ''}
                  onChange={(e) => setSeoSettings({ ...seoSettings, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                  placeholder="Product page title for search engines"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Meta Description</label>
                <textarea
                  value={seoSettings.description || ''}
                  onChange={(e) => setSeoSettings({ ...seoSettings, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                  rows={3}
                  placeholder="Brief description for search engines (150-160 characters)"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Keywords</label>
                <input
                  type="text"
                  value={(seoSettings.keywords || []).join(', ')}
                  onChange={(e) => setSeoSettings({ 
                    ...seoSettings, 
                    keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                  })}
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}