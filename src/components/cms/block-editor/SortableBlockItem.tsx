'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  GripVertical, 
  Copy, 
  Trash2, 
  Settings,
  Type,
  Image as ImageIcon,
  Video,
  Layout,
  ShoppingCart,
  MousePointer
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ContentBlock } from '@/types/cms'
import { cn } from '@/lib/utils'

interface SortableBlockItemProps {
  block: ContentBlock
  isSelected: boolean
  onSelect: () => void
  onUpdate: (blockId: string, updates: Partial<ContentBlock>) => void
  onDuplicate: (blockId: string) => void
  onDelete: (blockId: string) => void
}

export function SortableBlockItem({
  block,
  isSelected,
  onSelect,
  onUpdate,
  onDuplicate,
  onDelete
}: SortableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'hero':
      case 'text':
        return <Type className="w-4 h-4" />
      case 'image':
      case 'gallery':
        return <ImageIcon className="w-4 h-4" />
      case 'video':
        return <Video className="w-4 h-4" />
      case 'columns':
      case 'spacer':
        return <Layout className="w-4 h-4" />
      case 'product-grid':
        return <ShoppingCart className="w-4 h-4" />
      case 'cta':
      case 'accordion':
      case 'tabs':
        return <MousePointer className="w-4 h-4" />
      default:
        return <Layout className="w-4 h-4" />
    }
  }

  const getBlockTitle = (block: ContentBlock): string => {
    switch (block.type) {
      case 'video-cta':
        return (block.content as any)?.heading || 'Video CTA Block'
      case 'sliding-images-cta':
        return `Sliding Images (${(block.content as any)?.slides?.length || 0} slides)`
      case 'text':
        const textContent = (block.content as any)?.text
        if (textContent) {
          // Strip HTML tags and truncate
          const plainText = textContent.replace(/<[^>]*>/g, '')
          return plainText.length > 50 ? plainText.substring(0, 50) + '...' : plainText
        }
        return 'Text Block'
      case 'image':
        return (block.content as any)?.alt || 'Image Block'
      case 'gallery':
        const images = (block.content as any)?.images
        return images?.length ? `Gallery (${images.length} images)` : 'Gallery Block'
      case 'video':
        return 'Video Block'
      case 'product-grid':
        const products = (block.content as any)?.products
        return products?.length ? `Products (${products.length} items)` : 'Product Grid'
      case 'testimonials':
        const testimonials = (block.content as any)?.testimonials
        return testimonials?.length ? `Testimonials (${testimonials.length})` : 'Testimonials'
      case 'faq':
        const faqs = (block.content as any)?.faqs
        return faqs?.length ? `FAQ (${faqs.length} items)` : 'FAQ Block'
      case 'cta':
        return (block.content as any)?.heading || 'Call to Action'
      case 'accordion':
        const items = (block.content as any)?.items
        return items?.length ? `Accordion (${items.length} items)` : 'Accordion'
      case 'tabs':
        const tabs = (block.content as any)?.tabs
        return tabs?.length ? `Tabs (${tabs.length})` : 'Tabs Block'
      case 'columns':
        const columns = (block.content as any)?.columns
        return columns?.length ? `${columns.length} Columns` : 'Columns'
      case 'spacer':
        return 'Spacer'
      case 'banner':
        return (block.content as any)?.text || 'Banner'
      case 'custom-html':
        return 'Custom HTML'
      default:
        return `${(block.type as string).charAt(0).toUpperCase()}${(block.type as string).slice(1)} Block`
    }
  }

  const getBlockDescription = (block: ContentBlock): string => {
    switch (block.type) {
      case 'video-cta':
        const heading = (block.content as any)?.heading
        return heading || 'Video with call-to-action'
      case 'sliding-images-cta':
        const slides = (block.content as any)?.slides
        return slides?.length ? `${slides.length} sliding images with CTA` : 'Sliding images with call-to-action'
      case 'text':
        const columns = (block.content as any)?.columns
        return columns > 1 ? `${columns} column layout` : 'Rich text content'
      case 'image':
        const dimensions = `${(block.content as any)?.width || 'auto'} × ${(block.content as any)?.height || 'auto'}`
        return `Image • ${dimensions}`
      case 'gallery':
        const layout = (block.content as any)?.layout || 'grid'
        const cols = (block.content as any)?.columns || 3
        return `${layout} layout • ${cols} columns`
      case 'video':
        const videoType = (block.content as any)?.type || 'upload'
        return `${videoType} video`
      case 'product-grid':
        const gridLayout = (block.content as any)?.layout || 'grid'
        const gridCols = (block.content as any)?.columns || 3
        return `${gridLayout} • ${gridCols} columns`
      case 'spacer':
        const height = (block.content as any)?.height?.desktop || 50
        return `${height}px height`
      default:
        return `${block.type.replace('-', ' ')} component`
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group',
        isDragging && 'opacity-50'
      )}
    >
      <Card 
        className={cn(
          'transition-all cursor-pointer hover:shadow-sm'
        )}
        onClick={onSelect}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            {/* Drag handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>

            {/* Block icon */}
            <div className="flex-shrink-0 mt-0.5">
              {getBlockIcon(block.type)}
            </div>

            {/* Block content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-medium text-sm truncate">
                  {getBlockTitle(block)}
                </h4>
                <Badge variant="outline" className="text-xs capitalize">
                  {block.type.replace('-', ' ')}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {getBlockDescription(block)}
              </p>
              
              {/* Visibility indicators */}
              <div className="flex items-center space-x-2 mt-2">
                {!block.responsive?.desktop?.visible && (
                  <Badge variant="outline" className="text-xs">Hidden on Desktop</Badge>
                )}
                {!block.responsive?.tablet?.visible && (
                  <Badge variant="outline" className="text-xs">Hidden on Tablet</Badge>
                )}
                {!block.responsive?.mobile?.visible && (
                  <Badge variant="outline" className="text-xs">Hidden on Mobile</Badge>
                )}
                {block.visibility?.showOn !== 'all' && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {block.visibility.showOn?.replace('-', ' ')} only
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect()
                }}
                className="h-8 w-8 p-0"
              >
                <Settings className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDuplicate(block.id)
                }}
                className="h-8 w-8 p-0"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('Are you sure you want to delete this block?')) {
                    onDelete(block.id)
                  }
                }}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}