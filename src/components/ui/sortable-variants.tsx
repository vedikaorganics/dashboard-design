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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
      <Label>Other Images</Label>
      
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
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAdd}
        className="text-xs h-7 px-3"
      >
        <Plus className="w-3 h-3 mr-1" />
        Add Image
      </Button>
    </div>
  )
}

interface SortableVariantItemProps {
  variant: any
  productId: string
  onUpdate: () => void
}

function SortableVariantItem({ variant, productId, onUpdate }: SortableVariantItemProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
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

  const handleEditClick = () => {
    // Reset form data when opening dialog
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
    setShowEditDialog(true)
  }

  const addOtherImage = () => {
    setEditData({
      ...editData,
      otherImages: [...editData.otherImages, '']
    })
  }

  const removeOtherImage = (index: number) => {
    const updatedImages = editData.otherImages.filter((_: string, i: number) => i !== index)
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
          otherImages: editData.otherImages.filter((img: string) => img.trim() !== '')
        })
      })

      if (response.ok) {
        toast.success("Variant updated successfully!")
        setShowEditDialog(false)
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
      <div
        ref={setNodeRef}
        style={style}
        className={`${isDragging ? 'opacity-50' : ''}`}
      >
        <Card className="py-3 overflow-hidden shadow-sm hover:shadow-md bg-background transition-shadow">
          <div 
            className="px-4 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={handleEditClick}
          >
            <div className="flex items-center space-x-4">
              {/* Drag Handle */}
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </div>

              {/* Variant Order */}
              <div className="flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {variant.variantOrder || 0}
                  </span>
                </div>
              </div>

              {/* Variant Image */}
              <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {variant.coverImage ? (
                  <Image 
                    src={variant.coverImage} 
                    alt={variant.title} 
                    width={56} 
                    height={56}
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
                <div className="font-semibold text-base truncate">{variant.title}</div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {variant.id} • {variant.size} {variant.unit}
                </div>
                {variant.label && (
                  <Badge variant="outline" className="text-xs mt-1">{variant.label}</Badge>
                )}
              </div>
              
              {/* Pricing */}
              <div className="text-right flex-shrink-0">
                <div className="font-semibold text-base">₹{variant.price?.toLocaleString()}</div>
                {variant.mrp && variant.mrp !== variant.price && (
                  <div className="text-sm text-muted-foreground line-through">
                    ₹{variant.mrp.toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Edit Variant Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Variant: <code className="text-base font-mono">{variant.id}</code></DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editData.title}
                onChange={(e) => setEditData({...editData, title: e.target.value})}
                placeholder="Variant title"
              />
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
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEditDialog(false)}
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
        <div className="space-y-1">
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