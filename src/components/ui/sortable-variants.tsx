"use client"

import React, { useState } from "react"
import Image from "next/image"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GripVertical, ChevronDown, ChevronUp, Package, Save, X, Plus } from "lucide-react"
import { toast } from "sonner"

interface SortableOtherImageProps {
  imageUrl: string
  index: number
  onUpdate: (index: number, value: string) => void
  onRemove: (index: number) => void
  canRemove: boolean
}

function SortableOtherImage({ imageUrl, index, onUpdate, onRemove, canRemove }: SortableOtherImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `other-image-${index}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center space-x-2 ${isDragging ? 'opacity-50' : ''}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded flex-shrink-0"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <Input
          value={imageUrl}
          onChange={(e) => onUpdate(index, e.target.value)}
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
        onClick={() => onRemove(index)}
        disabled={!canRemove}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}

interface SortableOtherImagesProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  onAdd: () => void
}

function SortableOtherImages({ images, onImagesChange, onAdd }: SortableOtherImagesProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id.toString().split('-')[2])
      const newIndex = parseInt(over.id.toString().split('-')[2])
      
      const reorderedImages = [...images]
      const [movedItem] = reorderedImages.splice(oldIndex, 1)
      reorderedImages.splice(newIndex, 0, movedItem)
      
      onImagesChange(reorderedImages)
    }
  }

  const handleUpdate = (index: number, value: string) => {
    const updatedImages = [...images]
    updatedImages[index] = value
    onImagesChange(updatedImages)
  }

  const handleRemove = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index)
    onImagesChange(updatedImages.length > 0 ? updatedImages : [''])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Other Images</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAdd}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Image
        </Button>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={images.map((_, index) => `other-image-${index}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {images.map((imageUrl, index) => (
              <SortableOtherImage
                key={`other-image-${index}`}
                imageUrl={imageUrl}
                index={index}
                onUpdate={handleUpdate}
                onRemove={handleRemove}
                canRemove={images.length > 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

interface SortableVariantItemProps {
  variant: any
  productId: string
  onUpdate: () => void
}

function SortableVariantItem({ variant, productId, onUpdate }: SortableVariantItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [editData, setEditData] = useState({
    title: variant.title || '',
    size: variant.size || '',
    unit: variant.unit || '',
    type: variant.type || 'Bottle',
    price: variant.price || '',
    mrp: variant.mrp || '',
    coverImage: variant.coverImage || '',
    label: variant.label || '',
    otherImages: variant.otherImages || ['']
  })
  const [isSaving, setIsSaving] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: variant._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleExpand = () => {
    if (!isExpanded) {
      // Reset form data when expanding
      setEditData({
        title: variant.title || '',
        size: variant.size || '',
        unit: variant.unit || '',
        type: variant.type || 'Bottle',
        price: variant.price || '',
        mrp: variant.mrp || '',
        coverImage: variant.coverImage || '',
        label: variant.label || '',
        otherImages: variant.otherImages?.length > 0 ? variant.otherImages : ['']
      })
    }
    setIsExpanded(!isExpanded)
  }

  const addOtherImage = () => {
    setEditData({
      ...editData,
      otherImages: [...editData.otherImages, '']
    })
  }

  const removeOtherImage = (index: number) => {
    const updatedImages = editData.otherImages.filter((_, i) => i !== index)
    setEditData({
      ...editData,
      otherImages: updatedImages.length > 0 ? updatedImages : ['']
    })
  }

  const updateOtherImage = (index: number, value: string) => {
    const updatedImages = [...editData.otherImages]
    updatedImages[index] = value
    setEditData({
      ...editData,
      otherImages: updatedImages
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/products/${productId}/variants/${variant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editData,
          size: Number(editData.size),
          price: Number(editData.price),
          mrp: Number(editData.mrp),
          otherImages: editData.otherImages.filter(img => img.trim() !== '')
        })
      })

      if (response.ok) {
        toast.success("Variant updated successfully!")
        setIsExpanded(false)
        onUpdate()
      } else {
        toast.error("Failed to update variant")
      }
    } catch (error) {
      console.error('Failed to update variant:', error)
      toast.error("Failed to update variant")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 animate-in fade-in"
          onClick={() => setIsExpanded(false)}
        />
      )}
      
      <div
        ref={setNodeRef}
        style={style}
        className={`${isDragging ? 'opacity-50' : ''} ${isExpanded ? 'relative z-50' : ''}`}
      >
        <Card className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'shadow-2xl border-2 border-primary/20 bg-background' : 'shadow-sm hover:shadow-md bg-background'
        }`}>
        {/* Collapsed View */}
        <div className="p-3">
          <div className="flex items-center space-x-3">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
            >
              <GripVertical className="w-3 h-3 text-muted-foreground" />
            </div>

            {/* Variant Order */}
            <div className="flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {variant.variantOrder || 0}
                </span>
              </div>
            </div>

            {/* Variant Image */}
            <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center overflow-hidden">
              {variant.coverImage ? (
                <Image 
                  src={variant.coverImage} 
                  alt={variant.title} 
                  width={48} 
                  height={48}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              ) : (
                <Package className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            
            {/* Variant Info */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{variant.title}</div>
              <div className="text-xs text-muted-foreground">
                {variant.id} • {variant.size} {variant.unit}
              </div>
              {variant.label && (
                <Badge variant="outline" className="text-xs mt-0.5">{variant.label}</Badge>
              )}
            </div>
            
            {/* Pricing */}
            <div className="text-right flex-shrink-0">
              <div className="font-medium text-sm">₹{variant.price?.toLocaleString()}</div>
              {variant.mrp && variant.mrp !== variant.price && (
                <div className="text-xs text-muted-foreground line-through">
                  ₹{variant.mrp.toLocaleString()}
                </div>
              )}
            </div>

            {/* Expand/Collapse Button */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleExpand}
              className="flex-shrink-0 h-8 w-8 p-0"
            >
              <ChevronDown className={`w-3 h-3 transition-transform duration-300 ease-in-out ${
                isExpanded ? 'rotate-180' : 'rotate-0'
              }`} />
            </Button>
          </div>
        </div>

        {/* Expanded Edit Form */}
        <div 
          className={`border-t bg-muted/30 overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className={`p-4 space-y-4 transition-opacity duration-300 ease-in-out ${
            isExpanded ? 'opacity-100' : 'opacity-0'
          }`}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Variant ID</Label>
                  <Input value={variant.id} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={editData.title}
                    onChange={(e) => setEditData({...editData, title: e.target.value})}
                    placeholder="Variant title"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Input
                    type="number"
                    value={editData.size}
                    onChange={(e) => setEditData({...editData, size: e.target.value})}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <select 
                    value={editData.unit}
                    onChange={(e) => setEditData({...editData, unit: e.target.value})}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="litre">Litre</option>
                    <option value="ml">ML</option>
                    <option value="kg">KG</option>
                    <option value="grams">Grams</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select 
                    value={editData.type}
                    onChange={(e) => setEditData({...editData, type: e.target.value})}
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
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={editData.price}
                    onChange={(e) => setEditData({...editData, price: e.target.value})}
                    placeholder="490"
                  />
                </div>
                <div className="space-y-2">
                  <Label>MRP (₹)</Label>
                  <Input
                    type="number"
                    value={editData.mrp}
                    onChange={(e) => setEditData({...editData, mrp: e.target.value})}
                    placeholder="550"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cover Image URL</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={editData.coverImage}
                    onChange={(e) => setEditData({...editData, coverImage: e.target.value})}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1"
                  />
                  {editData.coverImage && (
                    <div className="w-12 h-12 bg-muted rounded border overflow-hidden flex-shrink-0">
                      <Image
                        src={editData.coverImage}
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
                <Label>Label</Label>
                <Input
                  value={editData.label}
                  onChange={(e) => setEditData({...editData, label: e.target.value})}
                  placeholder="e.g., Best Seller, New"
                />
              </div>

              {/* Other Images */}
              <SortableOtherImages
                images={editData.otherImages}
                onImagesChange={(images) => setEditData({ ...editData, otherImages: images })}
                onAdd={addOtherImage}
              />
              
              {editData.otherImages.some(img => img.trim() !== '') && (
                <div className="text-xs text-muted-foreground">
                  Drag to reorder images. Preview images will appear for valid URLs.
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsExpanded(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
        </div>
      </Card>
      </div>
    </>
  )
}

interface SortableVariantsProps {
  variants: any[]
  productId: string
  onReorder: (oldIndex: number, newIndex: number) => void
  onUpdate: () => void
}

export { SortableOtherImages }

export function SortableVariants({ variants, productId, onReorder, onUpdate }: SortableVariantsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Sort variants by variantOrder
  const sortedVariants = [...variants].sort((a, b) => 
    (a.variantOrder || 0) - (b.variantOrder || 0)
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = sortedVariants.findIndex(variant => variant._id === active.id)
      const newIndex = sortedVariants.findIndex(variant => variant._id === over.id)
      
      onReorder(oldIndex, newIndex)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortedVariants.map(variant => variant._id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {sortedVariants.map((variant) => (
            <SortableVariantItem
              key={variant._id}
              variant={variant}
              productId={productId}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}