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
import { Button } from "@/components/ui/button"
import { GripVertical, Image as ImageIcon, Type, Plus, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { ContentSectionDialog } from "./content-section-dialog"

interface ContentSection {
  id: string
  type: "image" | "text"
  order: number
  // Image section fields
  desktopUrl?: string
  mobileUrl?: string
  alt?: string
  caption?: string
  // Text section fields
  heading?: string
  body?: string
  images?: string[]
  items?: string[]
}

interface SortableContentItemProps {
  section: ContentSection
  productId: string
  onEdit: (section: ContentSection) => void
  onDelete: (sectionId: string) => void
}

function SortableContentItem({ section, productId, onEdit, onDelete }: SortableContentItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

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
      <div className="flex items-start space-x-4 p-4 bg-background border rounded-lg hover:bg-muted/30 transition-colors">
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
              {section.order}
            </span>
          </div>
        </div>

        {/* Section Type Icon */}
        <div className="flex-shrink-0">
          {section.type === 'image' ? (
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Type className="w-5 h-5 text-muted-foreground" />
          )}
        </div>

        {/* Section Preview */}
        <div className="flex-1 min-w-0">
          {section.type === 'image' ? (
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Badge variant="outline" className="text-xs h-5">
                  Image
                </Badge>
                {section.alt && (
                  <span className="text-sm font-medium truncate">
                    {section.alt}
                  </span>
                )}
              </div>
              {section.caption && (
                <p className="text-sm text-muted-foreground truncate">
                  {section.caption}
                </p>
              )}
              <div className="flex items-center space-x-2 mt-1 text-xs text-muted-foreground">
                {section.desktopUrl && <span>Desktop ✓</span>}
                {section.mobileUrl && <span>Mobile ✓</span>}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Badge variant="outline" className="text-xs h-5">
                  Text
                </Badge>
                {section.heading && (
                  <span className="text-sm font-medium truncate">
                    {section.heading}
                  </span>
                )}
              </div>
              {section.body && (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-5">
                  {section.body}
                </p>
              )}
              <div className="flex items-center space-x-2 mt-1 text-xs text-muted-foreground">
                {section.images && section.images.length > 0 && (
                  <span>{section.images.length} images</span>
                )}
                {section.items && section.items.length > 0 && (
                  <span>{section.items.length} items</span>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Image Preview */}
        {section.type === 'image' && section.desktopUrl && (
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-muted rounded border overflow-hidden">
              <Image
                src={section.desktopUrl}
                alt={section.alt || "Section image"}
                width={64}
                height={64}
                className="object-cover w-full h-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex-shrink-0 flex space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(section)}
            className="h-8 w-8 p-0"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(section.id)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

interface SortableContentSectionsProps {
  sections: ContentSection[]
  productId: string
  onUpdate: () => void
}

export function SortableContentSections({ sections, productId, onUpdate }: SortableContentSectionsProps) {
  const [editingSection, setEditingSection] = useState<ContentSection | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
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

  // Sort sections by order
  const sortedSections = [...(sections || [])].sort((a, b) => 
    (a.order || 0) - (b.order || 0)
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = sortedSections.findIndex(section => section.id === active.id)
      const newIndex = sortedSections.findIndex(section => section.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        try {
          // Reorder the array
          const reorderedSections = arrayMove(sortedSections, oldIndex, newIndex)
          
          // Update order for all sections
          const updatedSections = reorderedSections.map((section, index) => ({
            ...section,
            order: index
          }))

          // Update the entire sections array
          await fetch(`/api/products/${productId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sections: updatedSections })
          })
          
          // Refresh the product data
          onUpdate()
          toast.success("Sections reordered successfully!")
        } catch (error) {
          console.error('Failed to reorder sections:', error)
          toast.error("Failed to reorder sections")
        }
      }
    }
  }

  const handleEdit = (section: ContentSection) => {
    setEditingSection(section)
    setIsCreating(false)
    setIsDialogOpen(true)
  }

  const handleDelete = async (sectionId: string) => {
    if (!confirm("Are you sure you want to delete this section?")) {
      return
    }

    try {
      const updatedSections = sortedSections.filter(section => section.id !== sectionId)
      
      await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: updatedSections })
      })
      
      onUpdate()
      toast.success("Section deleted successfully!")
    } catch (error) {
      console.error('Failed to delete section:', error)
      toast.error("Failed to delete section")
    }
  }

  const handleAddSection = () => {
    setEditingSection(null)
    setIsCreating(true)
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingSection(null)
    setIsCreating(false)
  }

  const handleDialogSave = () => {
    onUpdate()
  }

  if (!sections || sections.length === 0) {
    return (
      <>
        <div className="text-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Type className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1">No content sections</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add images and text sections to build your product page
              </p>
              <Button onClick={handleAddSection} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>
            </div>
          </div>
        </div>

        <ContentSectionDialog
          isOpen={isDialogOpen}
          onClose={handleDialogClose}
          section={editingSection}
          productId={productId}
          onSave={handleDialogSave}
          allSections={[]}
        />
      </>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {sortedSections.length} section{sortedSections.length !== 1 ? 's' : ''}
          </p>
          <Button onClick={handleAddSection} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Section
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedSections.map(section => section.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {sortedSections.map((section) => (
                <SortableContentItem
                  key={section.id}
                  section={section}
                  productId={productId}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <ContentSectionDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        section={editingSection}
        productId={productId}
        onSave={handleDialogSave}
        allSections={sortedSections}
      />
    </>
  )
}