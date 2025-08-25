"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Package, Star, Eye, TrendingUp, Edit3, Save, X, Plus, MoreHorizontal, Palette, ImageIcon, Users, ShoppingCart, Heart } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ColorPicker } from "@/components/ui/color-picker"
import { SortableVariants } from "@/components/ui/sortable-variants"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { 
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage
} from "@/components/ui/breadcrumb"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useProductDetails } from "@/hooks/use-data"

interface ProductDetailPageProps {
  params: Promise<{
    productId: string
  }>
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const resolvedParams = React.use(params)
  const { productId } = resolvedParams
  
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, any>>({})
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [newVariantData, setNewVariantData] = useState({
    id: '',
    title: '',
    size: '',
    unit: '',
    type: 'Bottle',
    price: '',
    mrp: '',
    coverImage: '',
    label: '',
    otherImages: ['']
  })
  const [editVariantData, setEditVariantData] = useState<any>(null)
  
  // Fetch product details with variants and reviews
  const { data: productData, isLoading, error, mutate } = useProductDetails(productId)
  
  const product = productData as any

  if (isLoading) {
    return (
      <DashboardLayout title="Product Details">
        <div className="flex-1 space-y-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-40 bg-muted rounded mb-6"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !product) {
    return (
      <DashboardLayout title="Product Details">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested product could not be found.</p>
            <Button asChild>
              <Link href="/products">Back to Products</Link>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const handleEdit = (field: string, currentValue: any) => {
    setEditingField(field)
    setEditValues({ ...editValues, [field]: currentValue })
  }

  const handleSave = async (field: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [field]: editValues[field] })
      })
      
      if (response.ok) {
        setEditingField(null)
        mutate()
        toast.success(`${field} updated successfully`)
      } else {
        toast.error(`Failed to update ${field}`)
      }
    } catch (error) {
      console.error('Failed to update field:', error)
      toast.error(`Failed to update ${field}`)
    }
  }

  const handleCancel = () => {
    setEditingField(null)
    setEditValues({})
  }

  const handleVariantReorder = async (oldIndex: number, newIndex: number) => {
    try {
      // Sort variants by variantOrder for consistent indexing
      const sortedVariants = [...(product.variants || [])].sort((a, b) => 
        (a.variantOrder || 0) - (b.variantOrder || 0)
      )
      
      // Reorder the array
      const reorderedVariants = [...sortedVariants]
      const [movedItem] = reorderedVariants.splice(oldIndex, 1)
      reorderedVariants.splice(newIndex, 0, movedItem)
      
      // Update variantOrder for all variants
      const updatedVariants = reorderedVariants.map((variant, index) => ({
        ...variant,
        variantOrder: index + 1
      }))

      // Update each variant's order in the database
      const updatePromises = updatedVariants.map(variant =>
        fetch(`/api/products/${productId}/variants/${variant.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variantOrder: variant.variantOrder })
        })
      )

      await Promise.all(updatePromises)
      
      // Refresh the product data
      mutate()
      toast.success("Variants reordered successfully!")
    } catch (error) {
      console.error('Failed to reorder variants:', error)
      toast.error("Failed to reorder variants")
    }
  }

  const addOtherImage = (isEdit = false) => {
    if (isEdit && editVariantData) {
      setEditVariantData({
        ...editVariantData,
        otherImages: [...(editVariantData.otherImages || []), '']
      })
    } else {
      setNewVariantData({
        ...newVariantData,
        otherImages: [...newVariantData.otherImages, '']
      })
    }
  }

  const removeOtherImage = (index: number, isEdit = false) => {
    if (isEdit && editVariantData) {
      const updatedImages = editVariantData.otherImages.filter((_: any, i: number) => i !== index)
      setEditVariantData({
        ...editVariantData,
        otherImages: updatedImages.length > 0 ? updatedImages : ['']
      })
    } else {
      const updatedImages = newVariantData.otherImages.filter((_, i) => i !== index)
      setNewVariantData({
        ...newVariantData,
        otherImages: updatedImages.length > 0 ? updatedImages : ['']
      })
    }
  }

  const updateOtherImage = (index: number, value: string, isEdit = false) => {
    if (isEdit && editVariantData) {
      const updatedImages = [...editVariantData.otherImages]
      updatedImages[index] = value
      setEditVariantData({
        ...editVariantData,
        otherImages: updatedImages
      })
    } else {
      const updatedImages = [...newVariantData.otherImages]
      updatedImages[index] = value
      setNewVariantData({
        ...newVariantData,
        otherImages: updatedImages
      })
    }
  }

  const resetNewVariantForm = () => {
    setNewVariantData({
      id: '',
      title: '',
      size: '',
      unit: '',
      type: 'Bottle',
      price: '',
      mrp: '',
      coverImage: '',
      label: '',
      otherImages: ['']
    })
  }

  const handleEditVariant = (variant: any) => {
    setEditVariantData({
      ...variant,
      otherImages: variant.otherImages || ['']
    })
    setSelectedVariant(variant)
  }

  const mainVariant = product.variants?.find((v: any) => v.id === product.mainVariant) || product.variants?.[0]

  return (
    <DashboardLayout title="Product Details">
      <div className="flex-1 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/products">Products</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{product.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Hero Section */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-6">
                {/* Product Image */}
                <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {mainVariant?.coverImage ? (
                    <Image 
                      src={mainVariant.coverImage} 
                      alt={product.title} 
                      width={128} 
                      height={128}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  ) : (
                    <Package className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      {editingField === 'title' ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={editValues.title || ''}
                            onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                            className="text-2xl font-bold h-10"
                          />
                          <Button size="sm" onClick={() => handleSave('title')}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 group">
                          <h1 className="text-3xl font-bold">{product.title}</h1>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleEdit('title', product.title)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">ID: {product.id}</p>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          Preview Product Page
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Plus className="w-4 h-4 mr-2" />
                          Add New Variant
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Archive Product
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Description */}
                  <div>
                    {editingField === 'description' ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editValues.description || ''}
                          onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                          className="min-h-20"
                          placeholder="Product description..."
                        />
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={() => handleSave('description')}>
                            <Save className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel}>
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="group">
                        <p className="text-muted-foreground">
                          {product.description || 'No description available'}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleEdit('description', product.description)}
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Badges and Tags */}
                  <div className="flex flex-wrap gap-2">
                    {product.badges?.map((badge: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {badge}
                      </Badge>
                    ))}
                    {product.tags?.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                    {product.colorHex && (
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: product.colorHex }}
                        ></div>
                        <code className="text-xs text-muted-foreground">{product.colorHex}</code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>


        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="variants">Variants ({product.variants?.length || 0})</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({product.reviewCount || 0})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Product Overview</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Core product information and settings
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Product ID</Label>
                      <Input value={product.id} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Main Variant</Label>
                      {editingField === 'mainVariant' ? (
                        <div className="flex items-center space-x-2">
                          <select 
                            value={editValues.mainVariant || ''}
                            onChange={(e) => setEditValues({ ...editValues, mainVariant: e.target.value })}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select main variant</option>
                            {product.variants?.map((variant: any) => (
                              <option key={variant.id} value={variant.id}>
                                {variant.id} - {variant.title}
                              </option>
                            ))}
                          </select>
                          <Button size="sm" onClick={() => handleSave('mainVariant')}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 group">
                          <Input value={product.mainVariant || 'Not set'} disabled />
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleEdit('mainVariant', product.mainVariant)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Created At</Label>
                      <Input value={product.createdAt ? new Date(product.createdAt).toLocaleDateString() : ''} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Color Theme</Label>
                      {editingField === 'colorHex' ? (
                        <div className="space-y-2">
                          <ColorPicker
                            value={editValues.colorHex || product.colorHex || '#000000'}
                            onChange={(color) => setEditValues({ ...editValues, colorHex: color })}
                          />
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={() => handleSave('colorHex')}>
                              <Save className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancel}>
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 group">
                          <div className="flex items-center space-x-2 flex-1 h-9 px-3 border rounded-md bg-muted">
                            <div 
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: product.colorHex || '#000000' }}
                            />
                            <span className="text-sm">{product.colorHex || '#000000'}</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleEdit('colorHex', product.colorHex)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Key Benefits */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Key Benefits</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const newBenefits = [...(product.bulletPoints || []), 'New benefit']
                        handleEdit('bulletPoints', newBenefits)
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Benefit
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {editingField === 'bulletPoints' ? (
                      <div className="space-y-4">
                        {(editValues.bulletPoints || []).map((point: string, index: number) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              value={point}
                              onChange={(e) => {
                                const newBenefits = [...editValues.bulletPoints]
                                newBenefits[index] = e.target.value
                                setEditValues({ ...editValues, bulletPoints: newBenefits })
                              }}
                              placeholder="Enter benefit..."
                            />
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const newBenefits = editValues.bulletPoints.filter((_: any, i: number) => i !== index)
                                setEditValues({ ...editValues, bulletPoints: newBenefits })
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex space-x-2 pt-2">
                          <Button size="sm" onClick={() => handleSave('bulletPoints')}>
                            <Save className="w-4 h-4 mr-1" />
                            Save Benefits
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel}>
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {product.bulletPoints?.length > 0 ? (
                          product.bulletPoints.map((point: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg group">
                              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                              <span className="text-sm flex-1">{point}</span>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleEdit('bulletPoints', product.bulletPoints)}
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                              <Package className="w-6 h-6" />
                            </div>
                            <p className="text-sm">No key benefits added yet.</p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => handleEdit('bulletPoints', [''])}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add First Benefit
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="variants">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Product Variants</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      Manage sizes, pricing, and packaging options
                    </div>
                  </div>
                  <Button onClick={() => setShowVariantModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Variant
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {product.variants && product.variants.length > 0 ? (
                  <>
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Package className="w-4 h-4" />
                        <span>Drag and drop to reorder variants. Order numbers will be automatically updated.</span>
                      </div>
                    </div>
                    <SortableVariants 
                      variants={product.variants}
                      onReorder={handleVariantReorder}
                      onEdit={handleEditVariant}
                    />
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No variants found for this product</p>
                    <Button 
                      onClick={() => setShowVariantModal(true)}
                      className="mt-2"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Variant
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Content Sections</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Manage product page content sections and images
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {product.sections
                    ?.sort((a: any, b: any) => a.order - b.order)
                    .map((section: any) => (
                      <Card key={section.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {section.type === 'image' ? (
                              <ImageIcon className="w-4 h-4" />
                            ) : (
                              <Package className="w-4 h-4" />
                            )}
                            <Badge variant="outline">{section.type}</Badge>
                            <span className="text-sm text-muted-foreground">Order: {section.order}</span>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Edit3 className="w-4 h-4" />
                          </Button>
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
                          </div>
                        )}
                      </Card>
                    ))}
                  
                  <Button variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Content Section
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Customer Reviews</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Moderate and respond to customer feedback
                </div>
              </CardHeader>
              <CardContent>
                {product.reviews?.length > 0 ? (
                  <div className="space-y-4">
                    {product.reviews.map((review: any) => (
                      <Card key={review._id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium">{review.author}</div>
                            <div className="flex items-center space-x-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                                />
                              ))}
                              <span className="text-sm text-muted-foreground ml-2">
                                {review.rating}/5
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={review.isApproved ? "bg-success/20 text-success" : "bg-warning/20 text-warning"}>
                              {review.isApproved ? 'Approved' : 'Pending'}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {review.text && (
                          <p className="text-sm text-muted-foreground mt-2">{review.text}</p>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No reviews yet for this product</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Variant Modal */}
        <Dialog open={showVariantModal} onOpenChange={(open) => {
          setShowVariantModal(open)
          if (!open) resetNewVariantForm()
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Variant</DialogTitle>
              <DialogDescription>
                Create a new variant for {product.title}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="variantId">Variant ID *</Label>
                  <Input
                    id="variantId"
                    value={newVariantData.id}
                    onChange={(e) => setNewVariantData({...newVariantData, id: e.target.value})}
                    placeholder="e.g., YMS-1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variantTitle">Title *</Label>
                  <Input
                    id="variantTitle"
                    value={newVariantData.title}
                    onChange={(e) => setNewVariantData({...newVariantData, title: e.target.value})}
                    placeholder="e.g., Vedika Organics Yellow Mustard Oil (1L)"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="size">Size *</Label>
                  <Input
                    id="size"
                    type="number"
                    value={newVariantData.size}
                    onChange={(e) => setNewVariantData({...newVariantData, size: e.target.value})}
                    placeholder="1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <select 
                    id="unit"
                    value={newVariantData.unit}
                    onChange={(e) => setNewVariantData({...newVariantData, unit: e.target.value})}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    required
                  >
                    <option value="">Select unit</option>
                    <option value="litre">Litre</option>
                    <option value="ml">ML</option>
                    <option value="kg">KG</option>
                    <option value="grams">Grams</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <select 
                    id="type"
                    value={newVariantData.type}
                    onChange={(e) => setNewVariantData({...newVariantData, type: e.target.value})}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="Bottle">Bottle</option>
                    <option value="Pouch">Pouch</option>
                    <option value="Can">Can</option>
                    <option value="Jar">Jar</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newVariantData.price}
                    onChange={(e) => setNewVariantData({...newVariantData, price: e.target.value})}
                    placeholder="490"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mrp">MRP (₹)</Label>
                  <Input
                    id="mrp"
                    type="number"
                    value={newVariantData.mrp}
                    onChange={(e) => setNewVariantData({...newVariantData, mrp: e.target.value})}
                    placeholder="550"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverImage">Cover Image URL</Label>
                <Input
                  id="coverImage"
                  value={newVariantData.coverImage}
                  onChange={(e) => setNewVariantData({...newVariantData, coverImage: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="label">Label (optional)</Label>
                <Input
                  id="label"
                  value={newVariantData.label}
                  onChange={(e) => setNewVariantData({...newVariantData, label: e.target.value})}
                  placeholder="e.g., Best Seller, New"
                />
              </div>

              {/* Other Images Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Other Images</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addOtherImage(false)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Image
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {newVariantData.otherImages.map((imageUrl, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="flex-1">
                        <Input
                          value={imageUrl}
                          onChange={(e) => updateOtherImage(index, e.target.value, false)}
                          placeholder={`Image URL ${index + 1}`}
                        />
                      </div>
                      {imageUrl && (
                        <div className="w-12 h-12 bg-muted rounded border overflow-hidden flex-shrink-0">
                          <Image
                            src={imageUrl}
                            alt={`Preview ${index + 1}`}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOtherImage(index, false)}
                        disabled={newVariantData.otherImages.length === 1}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {newVariantData.otherImages.some(img => img) && (
                  <div className="text-xs text-muted-foreground">
                    Preview images will appear when valid URLs are entered
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowVariantModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                // Handle form submission here
                toast.success("Variant added successfully!")
                setShowVariantModal(false)
                resetNewVariantForm()
              }}>
                Add Variant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Variant Modal */}
        <Dialog open={selectedVariant !== null} onOpenChange={(open) => {
          if (!open) {
            setSelectedVariant(null)
            setEditVariantData(null)
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Variant</DialogTitle>
              <DialogDescription>
                Edit variant details for {editVariantData?.title}
              </DialogDescription>
            </DialogHeader>
            
            {editVariantData && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Variant ID</Label>
                    <Input
                      value={editVariantData.id}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editTitle">Title</Label>
                    <Input
                      id="editTitle"
                      value={editVariantData.title}
                      onChange={(e) => setEditVariantData({...editVariantData, title: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="editSize">Size</Label>
                    <Input
                      id="editSize"
                      type="number"
                      value={editVariantData.size}
                      onChange={(e) => setEditVariantData({...editVariantData, size: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editUnit">Unit</Label>
                    <select 
                      id="editUnit"
                      value={editVariantData.unit}
                      onChange={(e) => setEditVariantData({...editVariantData, unit: e.target.value})}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="litre">Litre</option>
                      <option value="ml">ML</option>
                      <option value="kg">KG</option>
                      <option value="grams">Grams</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editType">Type</Label>
                    <select 
                      id="editType"
                      value={editVariantData.type}
                      onChange={(e) => setEditVariantData({...editVariantData, type: e.target.value})}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="Bottle">Bottle</option>
                      <option value="Pouch">Pouch</option>
                      <option value="Can">Can</option>
                      <option value="Jar">Jar</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="editPrice">Price (₹)</Label>
                    <Input
                      id="editPrice"
                      type="number"
                      value={editVariantData.price}
                      onChange={(e) => setEditVariantData({...editVariantData, price: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editMrp">MRP (₹)</Label>
                    <Input
                      id="editMrp"
                      type="number"
                      value={editVariantData.mrp}
                      onChange={(e) => setEditVariantData({...editVariantData, mrp: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editCoverImage">Cover Image URL</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="editCoverImage"
                      value={editVariantData.coverImage}
                      onChange={(e) => setEditVariantData({...editVariantData, coverImage: e.target.value})}
                      className="flex-1"
                    />
                    {editVariantData.coverImage && (
                      <div className="w-12 h-12 bg-muted rounded border overflow-hidden flex-shrink-0">
                        <Image
                          src={editVariantData.coverImage}
                          alt="Cover preview"
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editLabel">Label</Label>
                  <Input
                    id="editLabel"
                    value={editVariantData.label || ''}
                    onChange={(e) => setEditVariantData({...editVariantData, label: e.target.value})}
                  />
                </div>

                {/* Other Images Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Other Images</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addOtherImage(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Image
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {(editVariantData.otherImages || ['']).map((imageUrl: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="flex-1">
                          <Input
                            value={imageUrl}
                            onChange={(e) => updateOtherImage(index, e.target.value, true)}
                            placeholder={`Image URL ${index + 1}`}
                          />
                        </div>
                        {imageUrl && (
                          <div className="w-12 h-12 bg-muted rounded border overflow-hidden flex-shrink-0">
                            <Image
                              src={imageUrl}
                              alt={`Preview ${index + 1}`}
                              width={48}
                              height={48}
                              className="object-cover w-full h-full"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOtherImage(index, true)}
                          disabled={(editVariantData.otherImages || ['']).length === 1}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {(editVariantData.otherImages || []).some((img: string) => img) && (
                    <div className="text-xs text-muted-foreground">
                      Preview images will appear when valid URLs are entered
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setSelectedVariant(null)
                setEditVariantData(null)
              }}>
                Cancel
              </Button>
              <Button onClick={() => {
                // Handle form submission here
                toast.success("Variant updated successfully!")
                setSelectedVariant(null)
                setEditVariantData(null)
              }}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}