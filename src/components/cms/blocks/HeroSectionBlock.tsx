'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { HeroSectionBlockContent, getMediaUrl } from '@/types/cms'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HeroSectionBlockProps {
  content: HeroSectionBlockContent
  isEditing?: boolean
  className?: string
}

export function HeroSectionBlock({ content, isEditing = false, className }: HeroSectionBlockProps) {
  const [isMobile, setIsMobile] = useState(false)
  
  const {
    media,
    heading,
    description,
    cta,
    overlay,
    alignment = 'center',
    height = 'large'
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

  // Get the appropriate media source
  const getMediaSrc = () => {
    if (!media?.mobile && !media?.desktop) return ''
    
    // Mobile-first: Use desktop version on desktop if available, otherwise use mobile
    if (!isMobile && media.desktop) return getMediaUrl(media.desktop)
    return getMediaUrl(media.mobile)
  }

  // Get height classes
  const getHeightClasses = () => {
    switch (height) {
      case 'small': return 'h-[400px]'
      case 'medium': return 'h-[600px]'
      case 'large': return 'h-[800px]'
      case 'fullscreen': return 'h-screen'
      default: return 'h-[800px]'
    }
  }

  // Get alignment classes
  const getAlignmentClasses = () => {
    switch (alignment) {
      case 'left': return 'text-left items-start'
      case 'right': return 'text-right items-end'
      case 'center': 
      default: return 'text-center items-center'
    }
  }

  // Get CTA button variant
  const getCtaVariant = () => {
    switch (cta?.style) {
      case 'secondary': return 'secondary'
      case 'outline': return 'outline'
      case 'primary':
      default: return 'default'
    }
  }

  const mediaSrc = getMediaSrc()

  // If editing and no media, show placeholder
  if (isEditing && !mediaSrc) {
    return (
      <div className={cn(
        'relative flex flex-col justify-center bg-muted border-2 border-dashed border-muted-foreground/25',
        getHeightClasses(),
        getAlignmentClasses(),
        className
      )}>
        <div className="p-8 space-y-4 max-w-4xl mx-auto">
          <div className="text-muted-foreground text-sm">Hero Section</div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
            {heading || 'Your Hero Heading'}
          </h1>
          <div 
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
            dangerouslySetInnerHTML={{ __html: description || 'Add your compelling hero description here.' }}
          />
          {cta?.text && (
            <Button variant={getCtaVariant()} size="lg" className="mt-6">
              {cta.text}
            </Button>
          )}
          <div className="text-xs text-muted-foreground mt-4">
            Select media in settings to complete this hero section
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'relative overflow-hidden',
      getHeightClasses(),
      className
    )}>
      {/* Background Media */}
      {mediaSrc && (
        <>
          {media.type === 'video' ? (
            <video
              src={mediaSrc}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <Image
              src={mediaSrc}
              alt={heading || 'Hero background'}
              fill
              className="object-cover"
              priority
            />
          )}
        </>
      )}

      {/* Overlay */}
      {overlay?.enabled && (
        <div 
          className="absolute inset-0 bg-black"
          style={{ opacity: overlay.opacity || 0.4 }}
        />
      )}

      {/* Content */}
      <div className={cn(
        'absolute inset-0 flex flex-col justify-center px-4 sm:px-6 lg:px-8',
        getAlignmentClasses()
      )}>
        <div className="space-y-6 max-w-4xl mx-auto">
          {heading && (
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg">
              {heading}
            </h1>
          )}
          
          {description && (
            <div 
              className="text-lg md:text-xl text-white/90 max-w-2xl drop-shadow-md"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}
          
          {cta?.text && cta?.url && (
            <div className="pt-4">
              <Button 
                asChild 
                variant={getCtaVariant()} 
                size="lg"
                className="shadow-lg"
              >
                <a href={cta.url} target={cta.url.startsWith('http') ? '_blank' : '_self'}>
                  {cta.text}
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}