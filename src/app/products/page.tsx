"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Search, Filter, Package, TrendingUp, TrendingDown, AlertTriangle, Eye, Star, Palette, Image as ImageIcon } from "lucide-react"
import { useProducts } from "@/hooks/use-data"
import type { Product, ProductVariant } from "@/types"
import Image from "next/image"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { StarRating } from "@/components/ui/star-rating"


const getBadge = (text: string, variant?: "default" | "secondary" | "destructive" | "outline") => {
  return <Badge variant={variant || "outline"}>{text}</Badge>
}


export default function ProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  
  const { data: productsData, isLoading } = useProducts()
  
  const products = (productsData as any)?.products || []
  const totalProducts = (productsData as any)?.totalProducts || 0
  const totalVariants = (productsData as any)?.totalVariants || 0
  const avgRating = (productsData as any)?.avgRating || 0
  
  const filteredProducts = products.filter((product: any) =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.id.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const getProductVariants = (productId: string) => {
    const product = products.find((p: any) => p.id === productId)
    return product?.variants || []
  }
  
  return (
    <DashboardLayout title="Products Catalog">
      <div className="flex-1 space-y-6">
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground">Oil varieties available</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Product Variants</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVariants}</div>
              <p className="text-xs text-muted-foreground">Size & packaging options</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Across all products</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Seller</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">Mustard Oil</div>
              <p className="text-xs text-muted-foreground">Most popular variety</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Wood-Pressed Oil Collection</CardTitle>
            <CardDescription>
              Manage your premium oil products and variants with detailed information.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product: any) => {
                const variants = getProductVariants(product.id)
                const minPrice = product.minPrice || 0
                const maxPrice = product.maxPrice || 0
                const rating = product.avgRating || 0
                const reviewCount = product.reviewCount || 0
                
                return (
                  <Card key={product._id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <AspectRatio ratio={16 / 9}>
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center relative h-full">
                        <div 
                          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                          style={{ backgroundColor: product.colorHex }}
                        >
                          <Package className="w-8 h-8" />
                        </div>
                        {product.tags.length > 0 && (
                          <div className="absolute top-2 right-2">
                            {getBadge(product.tags[0], "default")}
                          </div>
                        )}
                      </div>
                    </AspectRatio>
                    
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg leading-none">{product.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {product.description}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="font-medium">
                              ₹{minPrice.toLocaleString()}
                              {maxPrice !== minPrice && ` - ₹${maxPrice.toLocaleString()}`}
                            </span>
                            <div className="text-xs text-muted-foreground">
                              {variants.length} variant{variants.length > 1 ? 's' : ''}
                            </div>
                          </div>
                          
                          {rating > 0 && (
                            <StarRating rating={rating} size="sm" />
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {product.badges.map((badge: any, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {badge}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            onClick={() => setSelectedProduct(product)}
                            className="flex-1" 
                            size="sm"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>Edit product</DropdownMenuItem>
                              <DropdownMenuItem>Manage variants</DropdownMenuItem>
                              <DropdownMenuItem>Update pricing</DropdownMenuItem>
                              <DropdownMenuItem>View analytics</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
        
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
                              <div className="text-xs text-green-600">
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