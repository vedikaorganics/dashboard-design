"use client"

import { useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import { GripVertical, Star } from "lucide-react"
import { toast } from "sonner"

interface SortableReviewItemProps {
  review: any
  productId: string
}

function SortableReviewItem({ review, productId }: SortableReviewItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: review._id })

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
      <div className="flex items-start space-x-4 p-3 bg-background border rounded-lg hover:bg-muted/30 transition-colors">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Sort Order */}
        <div className="flex-shrink-0">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">
              {review.sortOrder || 0}
            </span>
          </div>
        </div>

        {/* Review Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-semibold text-sm">{review.author}</span>
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-3 w-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                />
              ))}
              <span className="text-xs text-muted-foreground ml-1">
                {review.rating}/5
              </span>
            </div>
          </div>
          {review.text && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-5">
              {review.text}
            </p>
          )}
          <div className="flex items-center space-x-2 mt-1">
            <Badge 
              variant={review.isApproved ? "default" : "secondary"}
              className="text-xs h-5"
            >
              {review.isApproved ? 'Approved' : 'Pending'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(review.createdAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
        
        {/* Review Photos */}
        {review.photos && review.photos.length > 0 && (
          <div className="flex-shrink-0">
            <div className="flex space-x-2">
              {review.photos.slice(0, 3).map((photoUrl: string, index: number) => {
                // Ensure Cloudinary URLs use HTTPS
                const secureUrl = photoUrl.replace(/^http:\/\/res\.cloudinary\.com/, 'https://res.cloudinary.com')
                
                return (
                  <div key={index} className="w-12 h-12 bg-muted rounded border overflow-hidden">
                    <Image
                      src={secureUrl}
                      alt={`Review photo ${index + 1}`}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  </div>
                )
              })}
              {review.photos.length > 3 && (
                <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center">
                  <span className="text-xs text-muted-foreground font-medium">
                    +{review.photos.length - 3}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface SortableReviewsProps {
  reviews: any[]
  productId: string
  onUpdate: () => void
}

export function SortableReviews({ reviews, productId, onUpdate }: SortableReviewsProps) {
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

  // Sort reviews by sortOrder
  const sortedReviews = [...(reviews || [])].sort((a, b) => 
    (a.sortOrder || 0) - (b.sortOrder || 0)
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = sortedReviews.findIndex(review => review._id === active.id)
      const newIndex = sortedReviews.findIndex(review => review._id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        try {
          // Reorder the array
          const reorderedReviews = arrayMove(sortedReviews, oldIndex, newIndex)
          
          // Update sortOrder for all reviews
          const updatedReviews = reorderedReviews.map((review, index) => ({
            ...review,
            sortOrder: index + 1
          }))

          // Update each review's sortOrder in the database
          const updatePromises = updatedReviews.map(review =>
            fetch(`/api/reviews/${review._id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sortOrder: review.sortOrder })
            })
          )

          await Promise.all(updatePromises)
          
          // Refresh the product data
          onUpdate()
          toast.success("Reviews reordered successfully!")
        } catch (error) {
          console.error('Failed to reorder reviews:', error)
          toast.error("Failed to reorder reviews")
        }
      }
    }
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">No reviews yet for this product</p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortedReviews.map(review => review._id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {sortedReviews.map((review) => (
            <SortableReviewItem
              key={review._id}
              review={review}
              productId={productId}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}