'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { ImageBlockContent } from '@/types/cms'
import { cn } from '@/lib/utils'

interface ImageBlockProps {
  content: ImageBlockContent
  isEditing?: boolean
  className?: string
}

export function ImageBlock({ content, isEditing = false, className }: ImageBlockProps) {
  const [isMobile, setIsMobile] = useState(false)
  
  const {
    src,
    alt,
    caption,
    link,
    objectFit = 'cover',
    width,
    height
  } = content

  // Detect screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Get the appropriate image source
  const getImageSrc = () => {
    if (typeof src === 'string') return src
    if (!src) return ''
    
    // Use mobile version on mobile if available, otherwise fallback to desktop
    if (isMobile && src.mobile) return src.mobile
    return src.desktop || ''
  }

  // If editing and no desktop image, show placeholder
  if (isEditing && (!src?.desktop && !src)) {
    return (
      <div className={cn('text-center', className)}>
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 bg-muted/20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-muted flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-muted-foreground mb-2">Image Block</p>
          <p className="text-sm text-muted-foreground">Add an image URL to display your image</p>
        </div>
      </div>
    )
  }

  const imageContent = (
    <div className={cn('relative group', className)}>
      <div 
        className={cn(
          'relative overflow-hidden rounded-lg bg-muted',
          width && height ? '' : 'aspect-video'
        )}
        style={width && height ? { width, height } : {}}
      >
        <Image
          src={getImageSrc()}
          alt={alt || ''}
          fill={!width || !height}
          width={width ? parseInt(width) : undefined}
          height={height ? parseInt(height) : undefined}
          className={cn(
            'transition-transform duration-300 group-hover:scale-105',
            objectFit === 'cover' && 'object-cover',
            objectFit === 'contain' && 'object-contain',
            objectFit === 'fill' && 'object-fill'
          )}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />

        {/* Loading placeholder */}
        <div className="absolute inset-0 bg-muted animate-pulse" />
      </div>

      {caption && (
        <div className="mt-3 text-center">
          <p className="text-sm text-muted-foreground italic">{caption}</p>
        </div>
      )}
    </div>
  )

  // Wrap with link if provided
  if (link && !isEditing) {
    return (
      <a 
        href={link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block hover:opacity-90 transition-opacity"
      >
        {imageContent}
      </a>
    )
  }

  return imageContent
}

// Image block editor component
export function ImageBlockEditor({ 
  content, 
  onChange, 
  className 
}: { 
  content: ImageBlockContent
  onChange: (content: Partial<ImageBlockContent>) => void
  className?: string 
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Desktop Image URL */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Desktop Image URL *</label>
        <input
          type="url"
          value={typeof content.src === 'string' ? content.src : (content.src?.desktop || '')}
          onChange={(e) => onChange({ 
            src: typeof content.src === 'string' 
              ? { desktop: e.target.value, mobile: '' }
              : { ...content.src, desktop: e.target.value }
          })}
          placeholder="https://example.com/desktop-image.jpg"
          className="w-full p-2 border rounded-md"
        />
      </div>

      {/* Mobile Image URL */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Mobile Image URL (Optional)</label>
        <input
          type="url"
          value={typeof content.src === 'string' ? '' : (content.src?.mobile || '')}
          onChange={(e) => onChange({ 
            src: typeof content.src === 'string' 
              ? { desktop: content.src, mobile: e.target.value }
              : { ...content.src, mobile: e.target.value }
          })}
          placeholder="https://example.com/mobile-image.jpg"
          className="w-full p-2 border rounded-md"
        />
        <p className="text-xs text-muted-foreground">
          If not provided, desktop image will be used on mobile devices
        </p>
      </div>

      {/* Alt text */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Alt Text *</label>
        <input
          type="text"
          value={content.alt || ''}
          onChange={(e) => onChange({ alt: e.target.value })}
          placeholder="Describe the image for accessibility"
          className="w-full p-2 border rounded-md"
        />
        <p className="text-xs text-muted-foreground">
          Important for accessibility and SEO
        </p>
      </div>

      {/* Caption */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Caption (optional)</label>
        <input
          type="text"
          value={content.caption || ''}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="Optional image caption"
          className="w-full p-2 border rounded-md"
        />
      </div>

      {/* Link */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Link URL (optional)</label>
        <input
          type="url"
          value={content.link || ''}
          onChange={(e) => onChange({ link: e.target.value })}
          placeholder="https://example.com"
          className="w-full p-2 border rounded-md"
        />
      </div>

      {/* Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Object Fit</label>
          <select
            value={content.objectFit || 'cover'}
            onChange={(e) => onChange({ objectFit: e.target.value as 'cover' | 'contain' | 'fill' })}
            className="w-full p-2 border rounded-md"
          >
            <option value="cover">Cover (crop to fit)</option>
            <option value="contain">Contain (fit within bounds)</option>
            <option value="fill">Fill (stretch to fit)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Size</label>
          <select
            value={content.width && content.height ? 'custom' : 'auto'}
            onChange={(e) => {
              if (e.target.value === 'auto') {
                onChange({ width: undefined, height: undefined })
              } else {
                onChange({ width: '400px', height: '300px' })
              }
            }}
            className="w-full p-2 border rounded-md"
          >
            <option value="auto">Auto (responsive)</option>
            <option value="custom">Custom dimensions</option>
          </select>
        </div>
      </div>

      {/* Custom dimensions */}
      {content.width && content.height && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Width</label>
            <input
              type="text"
              value={content.width || ''}
              onChange={(e) => onChange({ width: e.target.value })}
              placeholder="400px or 50%"
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Height</label>
            <input
              type="text"
              value={content.height || ''}
              onChange={(e) => onChange({ height: e.target.value })}
              placeholder="300px or auto"
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>
      )}

      {/* Live preview */}
      {(content.src && (typeof content.src === 'string' ? content.src : content.src?.desktop)) && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Preview</label>
          <div className="border rounded-md p-4 bg-background">
            <ImageBlock content={content} isEditing={false} />
          </div>
        </div>
      )}
    </div>
  )
}