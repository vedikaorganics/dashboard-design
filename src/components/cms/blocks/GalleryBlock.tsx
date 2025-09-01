'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GalleryBlockContent } from '@/types/cms'
import { cn } from '@/lib/utils'

interface GalleryBlockProps {
  content: GalleryBlockContent
  isEditing?: boolean
  className?: string
}

export function GalleryBlock({ content, isEditing = false, className }: GalleryBlockProps) {
  const {
    images = [],
    layout = 'grid',
    columns = 3,
    showCaptions = true,
    lightbox = true
  } = content

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // If editing and no images, show placeholder
  if (isEditing && images.length === 0) {
    return (
      <div className={cn('text-center', className)}>
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 bg-muted/20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-muted flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-muted-foreground mb-2">Image Gallery</p>
          <p className="text-sm text-muted-foreground">Add images to create a gallery</p>
        </div>
      </div>
    )
  }

  const getColumnClass = () => {
    switch (columns) {
      case 2:
        return 'grid-cols-1 sm:grid-cols-2'
      case 3:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      case 6:
        return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    }
  }

  const openLightbox = (index: number) => {
    if (lightbox && !isEditing) {
      setLightboxIndex(index)
    }
  }

  const closeLightbox = () => {
    setLightboxIndex(null)
  }

  const goToPrevious = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1)
    }
  }

  const goToNext = () => {
    if (lightboxIndex !== null && lightboxIndex < images.length - 1) {
      setLightboxIndex(lightboxIndex + 1)
    }
  }

  if (layout === 'grid') {
    return (
      <>
        <div className={cn('space-y-4', className)}>
          <div className={cn('grid gap-4', getColumnClass())}>
            {images.map((image, index) => (
              <div key={index} className="group relative">
                <div 
                  className={cn(
                    'relative aspect-square overflow-hidden rounded-lg bg-muted cursor-pointer',
                    lightbox && !isEditing && 'hover:opacity-90 transition-opacity'
                  )}
                  onClick={() => openLightbox(index)}
                >
                  <Image
                    src={image.src}
                    alt={image.alt || `Gallery image ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                </div>
                {showCaptions && image.caption && (
                  <p className="mt-2 text-sm text-muted-foreground text-center">
                    {image.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Lightbox */}
        {lightboxIndex !== null && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={closeLightbox}
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Navigation */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 text-white hover:bg-white/20 disabled:opacity-50"
                  onClick={goToPrevious}
                  disabled={lightboxIndex === 0}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-16 text-white hover:bg-white/20 disabled:opacity-50"
                  onClick={goToNext}
                  disabled={lightboxIndex === images.length - 1}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}

            {/* Image */}
            <div className="relative max-w-full max-h-full">
              <Image
                src={images[lightboxIndex].src}
                alt={images[lightboxIndex].alt || `Gallery image ${lightboxIndex + 1}`}
                width={1200}
                height={800}
                className="max-w-full max-h-full object-contain"
              />
              {images[lightboxIndex].caption && (
                <p className="absolute bottom-0 left-0 right-0 text-white text-center p-4 bg-gradient-to-t from-black/50 to-transparent">
                  {images[lightboxIndex].caption}
                </p>
              )}
            </div>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
              {lightboxIndex + 1} of {images.length}
            </div>
          </div>
        )}
      </>
    )
  }

  // Carousel layout (simplified for now)
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex overflow-x-auto gap-4 pb-4">
        {images.map((image, index) => (
          <div key={index} className="flex-shrink-0 w-64">
            <div 
              className="relative aspect-square overflow-hidden rounded-lg bg-muted cursor-pointer"
              onClick={() => openLightbox(index)}
            >
              <Image
                src={image.src}
                alt={image.alt || `Gallery image ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
            {showCaptions && image.caption && (
              <p className="mt-2 text-sm text-muted-foreground text-center">
                {image.caption}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Gallery block editor component
export function GalleryBlockEditor({ 
  content, 
  onChange, 
  className 
}: { 
  content: GalleryBlockContent
  onChange: (content: Partial<GalleryBlockContent>) => void
  className?: string 
}) {
  const addImage = () => {
    const newImages = [
      ...(content.images || []),
      { src: '', alt: '', caption: '' }
    ]
    onChange({ images: newImages })
  }

  const updateImage = (index: number, updates: Partial<{ src: string; alt: string; caption: string }>) => {
    const newImages = [...(content.images || [])]
    newImages[index] = { ...newImages[index], ...updates }
    onChange({ images: newImages })
  }

  const removeImage = (index: number) => {
    const newImages = (content.images || []).filter((_, i) => i !== index)
    onChange({ images: newImages })
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Gallery settings */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Layout</label>
          <select
            value={content.layout || 'grid'}
            onChange={(e) => onChange({ layout: e.target.value as 'grid' | 'carousel' | 'masonry' })}
            className="w-full p-2 border rounded-md"
          >
            <option value="grid">Grid</option>
            <option value="carousel">Carousel</option>
            <option value="masonry">Masonry</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Columns</label>
          <select
            value={content.columns || 3}
            onChange={(e) => onChange({ columns: parseInt(e.target.value) as 2 | 3 | 4 | 6 })}
            className="w-full p-2 border rounded-md"
          >
            <option value={2}>2 Columns</option>
            <option value={3}>3 Columns</option>
            <option value={4}>4 Columns</option>
            <option value={6}>6 Columns</option>
          </select>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex space-x-6">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={content.showCaptions !== false}
            onChange={(e) => onChange({ showCaptions: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm">Show captions</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={content.lightbox !== false}
            onChange={(e) => onChange({ lightbox: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm">Enable lightbox</span>
        </label>
      </div>

      {/* Images */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Images</label>
          <Button
            type="button"
            onClick={addImage}
            size="sm"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Image
          </Button>
        </div>

        <div className="space-y-4">
          {(content.images || []).map((image, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Image {index + 1}</span>
                <Button
                  type="button"
                  onClick={() => removeImage(index)}
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Image URL</label>
                  <input
                    type="url"
                    value={image.src || ''}
                    onChange={(e) => updateImage(index, { src: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium">Alt Text</label>
                  <input
                    type="text"
                    value={image.alt || ''}
                    onChange={(e) => updateImage(index, { alt: e.target.value })}
                    placeholder="Describe the image"
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">Caption (optional)</label>
                <input
                  type="text"
                  value={image.caption || ''}
                  onChange={(e) => updateImage(index, { caption: e.target.value })}
                  placeholder="Optional caption"
                  className="w-full p-2 border rounded text-sm"
                />
              </div>

              {/* Image preview */}
              {image.src && (
                <div className="relative w-24 h-24 rounded border overflow-hidden bg-muted">
                  <Image
                    src={image.src}
                    alt={image.alt || 'Preview'}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Live preview */}
      {(content.images || []).length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Preview</label>
          <div className="border rounded-md p-4 bg-background">
            <GalleryBlock content={content} isEditing={false} />
          </div>
        </div>
      )}
    </div>
  )
}