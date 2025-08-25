"use client"

import React from "react"
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
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { GripVertical, MoreHorizontal, Package, Edit3, ImageIcon } from "lucide-react"

interface SortableVariantItemProps {
  variant: any
  onEdit: (variant: any) => void
}

function SortableVariantItem({ variant, onEdit }: SortableVariantItemProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'opacity-50' : ''}`}
    >
      <Card className="p-4 cursor-default">
        <div className="flex items-center space-x-4">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>

          {/* Variant Order */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {variant.variantOrder || 0}
              </span>
            </div>
          </div>

          {/* Variant Image */}
          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
            {variant.coverImage ? (
              <Image 
                src={variant.coverImage} 
                alt={variant.title} 
                width={64} 
                height={64}
                className="object-cover w-full h-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            ) : (
              <Package className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          
          {/* Variant Info */}
          <div className="flex-1">
            <div className="font-semibold">{variant.title}</div>
            <div className="text-sm text-muted-foreground">
              SKU: {variant.id} | {variant.size} {variant.unit} | {variant.type}
            </div>
            {variant.label && (
              <Badge variant="outline" className="mt-1">{variant.label}</Badge>
            )}
          </div>
          
          {/* Pricing */}
          <div className="text-right">
            <div className="font-semibold">₹{variant.price?.toLocaleString()}</div>
            {variant.mrp && variant.mrp !== variant.price && (
              <div className="text-sm text-muted-foreground line-through">
                ₹{variant.mrp.toLocaleString()}
              </div>
            )}
            {variant.mrp && variant.price && (
              <div className="text-xs text-green-600">
                {Math.round(((variant.mrp - variant.price) / variant.mrp) * 100)}% off
              </div>
            )}
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(variant)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Variant
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ImageIcon className="w-4 h-4 mr-2" />
                Manage Images
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Delete Variant
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>
    </div>
  )
}

interface SortableVariantsProps {
  variants: any[]
  onReorder: (oldIndex: number, newIndex: number) => void
  onEdit: (variant: any) => void
}

export function SortableVariants({ variants, onReorder, onEdit }: SortableVariantsProps) {
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
              onEdit={onEdit}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}