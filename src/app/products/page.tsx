"use client"

import { useState, Suspense } from "react"
import { useUrlSearchState } from "@/hooks/use-url-state"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Search, Package, Image as ImageIcon } from "lucide-react"
import { useProducts } from "@/hooks/use-data"
import type { Product, ProductVariant } from "@/types"
import Image from "next/image"
import { ProductGridLoadingSkeleton } from "@/components/ui/grid-loading-skeleton"




function ProductsPageContent() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useUrlSearchState("search", 300)
  
  const { data: productsData, isLoading } = useProducts()
  
  const products = (productsData as any)?.products || []
  
  const filteredProducts = products.filter((product: any) =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.id.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const getProductVariants = (productId: string) => {
    const product = products.find((p: any) => p.id === productId)
    return product?.variants || []
  }
  
  // Show loading skeleton if loading
  if (isLoading) {
    return (
      <DashboardLayout title="Products Catalog">
        <div className="flex-1 space-y-6">
          <div className="flex items-center space-x-2 py-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search products by name or ID..." 
                  className="pl-8" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          <ProductGridLoadingSkeleton count={15} />
        </div>
      </DashboardLayout>
    )
  }
  
  return (
    <DashboardLayout title="Products Catalog">
      <div className="flex-1 space-y-6">
        
        
        <div className="flex items-center space-x-2 py-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search products by name or ID..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
            
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredProducts.map((product: any) => {
            const variants = getProductVariants(product.id)
            const mainVariant = variants.find((v: any) => v.id === product.mainVariant) || variants[0]
            
            return (
              <Link href={`/products/${product.id}`} key={product._id}>
                <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="space-y-3">
                    {mainVariant?.coverImage && (
                      <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                        <Image 
                          src={mainVariant.coverImage} 
                          alt={product.title} 
                          width={160} 
                          height={160}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                    
                    <h3 className="font-medium text-sm leading-tight">{product.title}</h3>
                    
                    <div className="text-xs text-muted-foreground">
                      ID: <code className="text-xs">{product.id}</code>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {variants.map((variant: any) => (
                        <Badge key={variant.id} variant="outline" className="text-xs">
                          {variant.id}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
        
        <Dialog open={selectedProduct !== null} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProduct?.title}</DialogTitle>
              <DialogDescription>{selectedProduct?.description}</DialogDescription>
            </DialogHeader>
            
            {selectedProduct && (
              <Tabs defaultValue="details" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Product Details</TabsTrigger>
                  <TabsTrigger value="variants">Variants & Pricing</TabsTrigger>
                  <TabsTrigger value="content">Content & Images</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Basic Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div><strong>Product ID:</strong> {selectedProduct.id}</div>
                        <div><strong>Main Variant:</strong> {selectedProduct.mainVariant}</div>
                        <div className="flex items-center space-x-2">
                          <strong>Color:</strong>
                          <div 
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: selectedProduct.colorHex }}
                          ></div>
                          <code className="text-xs">{selectedProduct.colorHex}</code>
                        </div>
                        <div><strong>Created:</strong> {new Date(selectedProduct.createdAt).toLocaleDateString()}</div>
                        <div><strong>Last Updated:</strong> {new Date(selectedProduct.updatedAt).toLocaleDateString()}</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Features</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <strong>Key Benefits:</strong>
                          <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
                            {selectedProduct.bulletPoints.map((point, index) => (
                              <li key={index}>{point}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          <strong>Badges:</strong>
                          <div className="flex flex-wrap gap-1">
                            {selectedProduct.badges.map((badge, index) => (
                              <Badge key={index} variant="outline">{badge}</Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          <strong>Tags:</strong>
                          <div className="flex flex-wrap gap-1">
                            {selectedProduct.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="variants" className="space-y-4">
                  <div className="space-y-4">
                    {getProductVariants(selectedProduct.id).map((variant: any) => (
                      <Card key={variant._id}>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                              {variant.coverImage ? (
                                <Image 
                                  src={variant.coverImage} 
                                  alt={variant.title} 
                                  width={64} 
                                  height={64}
                                  className="object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                  }}
                                />
                              ) : (
                                <Package className="w-6 h-6 text-muted-foreground" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="font-semibold">{variant.title}</div>
                              <div className="text-sm text-muted-foreground">
                                SKU: {variant.id} | {variant.size} {variant.unit} | {variant.type}
                              </div>
                              {variant.label && (
                                <Badge variant="outline" className="mt-1">{variant.label}</Badge>
                              )}
                            </div>
                            
                            <div className="text-right">
                              <div className="font-semibold">₹{variant.price.toLocaleString()}</div>
                              {variant.mrp !== variant.price && (
                                <div className="text-sm text-muted-foreground line-through">
                                  ₹{variant.mrp.toLocaleString()}
                                </div>
                              )}
                              <div className="text-xs text-success">
                                {Math.round(((variant.mrp - variant.price) / variant.mrp) * 100)}% off
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="content" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Product Content Sections</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedProduct.sections
                          .sort((a, b) => a.order - b.order)
                          .map((section) => (
                            <div key={section.id} className="border rounded-lg p-4">
                              <div className="flex items-center space-x-2 mb-2">
                                {section.type === 'image' ? (
                                  <ImageIcon className="w-4 h-4" />
                                ) : (
                                  <Package className="w-4 h-4" />
                                )}
                                <Badge variant="outline">{section.type}</Badge>
                                <span className="text-sm text-muted-foreground">Order: {section.order}</span>
                              </div>
                              
                              {section.type === 'text' && (
                                <div>
                                  {section.heading && (
                                    <h4 className="font-semibold mb-1">{section.heading}</h4>
                                  )}
                                  {section.body && (
                                    <p className="text-sm text-muted-foreground">{section.body}</p>
                                  )}
                                </div>
                              )}
                              
                              {section.type === 'image' && (
                                <div>
                                  {section.alt && (
                                    <p className="text-sm font-medium">{section.alt}</p>
                                  )}
                                  {section.caption && (
                                    <p className="text-xs text-muted-foreground mt-1">{section.caption}</p>
                                  )}
                                  <div className="text-xs text-blue-600 mt-1">
                                    Desktop: {section.desktopUrl?.substring(0, 50)}...
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsPageContent />
    </Suspense>
  )
}