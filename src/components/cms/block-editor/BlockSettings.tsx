'use client'

import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ContentBlock, getMediaUrl, createMediaRef } from '@/types/cms'
import { MediaInput } from '@/components/cms/media-library/MediaInput'
import { SimpleRichTextEditor } from '@/components/ui/simple-rich-text-editor'

interface BlockSettingsProps {
  block: ContentBlock
  onUpdate: (updates: Partial<ContentBlock>) => void
  onClose: () => void
}

export function BlockSettings({ block, onUpdate, onClose }: BlockSettingsProps) {

  const updateBlockContent = (updates: any) => {
    onUpdate({
      content: { ...block.content, ...updates }
    })
  }


  const renderContentSettings = () => {
    switch (block.type) {
      case 'video-cta':
        const videoCTAContent = block.content as any
        return (
          <TooltipProvider>
            <div className="space-y-4">
              <MediaInput
                label="Mobile Video"
                value={videoCTAContent.video?.mobile}
                onChange={(value) => updateBlockContent({ 
                  video: { 
                    ...videoCTAContent.video, 
                    mobile: value 
                  }
                })}
                accept="video"
                placeholder="Select video from library..."
                required={true}
              />
              <MediaInput
                label="Desktop Video (Optional)"
                value={videoCTAContent.video?.desktop}
                onChange={(value) => updateBlockContent({ 
                  video: { 
                    ...videoCTAContent.video, 
                    desktop: value 
                  }
                })}
                accept="video"
                placeholder="Select video from library..."
                required={false}
                allowClear={true}
              />
              <div className="space-y-2">
                <Label htmlFor="heading">Heading</Label>
                <Input
                  id="heading"
                  value={videoCTAContent.heading || ''}
                  onChange={(e) => updateBlockContent({ heading: e.target.value })}
                  placeholder="Enter heading..."
                />
              </div>
              <div className="space-y-2">
                <SimpleRichTextEditor
                  id="text"
                  label="Text"
                  value={videoCTAContent.text || ''}
                  onChange={(value) => updateBlockContent({ text: value })}
                  placeholder="Enter description text..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cta-text">CTA Button Text</Label>
                <Input
                  id="cta-text"
                  value={videoCTAContent.cta?.text || ''}
                  onChange={(e) => updateBlockContent({ 
                    cta: { ...videoCTAContent.cta, text: e.target.value }
                  })}
                  placeholder="Learn More"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cta-link">CTA Button Link</Label>
                <Input
                  id="cta-link"
                  value={videoCTAContent.cta?.link || ''}
                  onChange={(e) => updateBlockContent({ 
                    cta: { ...videoCTAContent.cta, link: e.target.value }
                  })}
                  placeholder="https://..."
                />
              </div>
            </div>
          </TooltipProvider>
        )

      case 'sliding-images-cta':
        const slidingContent = block.content as any
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Slides</Label>
              {(slidingContent.slides || []).map((slide: any, index: number) => (
                <div key={index} className="p-3 border rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Slide {index + 1}</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newSlides = slidingContent.slides.filter((_: any, i: number) => i !== index)
                        updateBlockContent({ slides: newSlides })
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <MediaInput
                    label="Mobile Image"
                    value={slide.image?.mobile}
                    onChange={(value) => {
                      const newSlides = [...slidingContent.slides]
                      newSlides[index] = { 
                        ...slide, 
                        image: { 
                          ...slide.image, 
                          mobile: value 
                        }
                      }
                      updateBlockContent({ slides: newSlides })
                    }}
                    accept="image"
                    placeholder="Select image from library..."
                    required={true}
                  />
                  <MediaInput
                    label="Desktop Image (Optional)"
                    value={slide.image?.desktop}
                    onChange={(value) => {
                      const newSlides = [...slidingContent.slides]
                      newSlides[index] = { 
                        ...slide, 
                        image: { 
                          ...slide.image, 
                          desktop: value 
                        }
                      }
                      updateBlockContent({ slides: newSlides })
                    }}
                    accept="image"
                    placeholder="Select image from library..."
                    required={false}
                    allowClear={true}
                  />
                  <Input
                    value={slide.heading || ''}
                    onChange={(e) => {
                      const newSlides = [...slidingContent.slides]
                      newSlides[index] = { ...slide, heading: e.target.value }
                      updateBlockContent({ slides: newSlides })
                    }}
                    placeholder="Heading"
                  />
                  <SimpleRichTextEditor
                    value={slide.text || ''}
                    onChange={(value) => {
                      const newSlides = [...slidingContent.slides]
                      newSlides[index] = { ...slide, text: value }
                      updateBlockContent({ slides: newSlides })
                    }}
                    placeholder="Text"
                    rows={2}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={slide.cta?.text || ''}
                      onChange={(e) => {
                        const newSlides = [...slidingContent.slides]
                        newSlides[index] = { 
                          ...slide, 
                          cta: { ...slide.cta, text: e.target.value }
                        }
                        updateBlockContent({ slides: newSlides })
                      }}
                      placeholder="CTA Text"
                    />
                    <Input
                      value={slide.cta?.link || ''}
                      onChange={(e) => {
                        const newSlides = [...slidingContent.slides]
                        newSlides[index] = { 
                          ...slide, 
                          cta: { ...slide.cta, link: e.target.value }
                        }
                        updateBlockContent({ slides: newSlides })
                      }}
                      placeholder="CTA Link"
                    />
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newSlides = [...(slidingContent.slides || []), {
                    image: '',
                    heading: '',
                    text: '',
                    cta: { text: '', link: '' }
                  }]
                  updateBlockContent({ slides: newSlides })
                }}
              >
                Add Slide
              </Button>
            </div>
          </div>
        )

      case 'gallery':
        const galleryContent = block.content as any
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Images</Label>
              {(galleryContent.images || []).map((image: any, index: number) => (
                <div key={index} className="p-3 border rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Image {index + 1}</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newImages = galleryContent.images.filter((_: any, i: number) => i !== index)
                        updateBlockContent({ images: newImages })
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <MediaInput
                    label="Mobile Image"
                    value={image.src?.mobile}
                    onChange={(value) => {
                      const newImages = [...galleryContent.images]
                      newImages[index] = { 
                        ...image, 
                        src: { 
                          ...image.src, 
                          mobile: value 
                        }
                      }
                      updateBlockContent({ images: newImages })
                    }}
                    accept="image"
                    placeholder="Select image from library..."
                    required={true}
                  />
                  <MediaInput
                    label="Desktop Image (Optional)"
                    value={image.src?.desktop}
                    onChange={(value) => {
                      const newImages = [...galleryContent.images]
                      newImages[index] = { 
                        ...image, 
                        src: { 
                          ...image.src, 
                          desktop: value 
                        }
                      }
                      updateBlockContent({ images: newImages })
                    }}
                    accept="image"
                    placeholder="Select image from library..."
                    required={false}
                    allowClear={true}
                  />
                  <Input
                    value={image.alt || ''}
                    onChange={(e) => {
                      const newImages = [...galleryContent.images]
                      newImages[index] = { ...image, alt: e.target.value }
                      updateBlockContent({ images: newImages })
                    }}
                    placeholder="Alt text"
                  />
                  <Input
                    value={image.caption || ''}
                    onChange={(e) => {
                      const newImages = [...galleryContent.images]
                      newImages[index] = { ...image, caption: e.target.value }
                      updateBlockContent({ images: newImages })
                    }}
                    placeholder="Caption (optional)"
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newImages = [...(galleryContent.images || []), {
                    src: '',
                    alt: '',
                    caption: ''
                  }]
                  updateBlockContent({ images: newImages })
                }}
              >
                Add Image
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="layout">Layout</Label>
              <Select
                value={galleryContent.layout || 'grid'}
                onValueChange={(value) => updateBlockContent({ layout: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                  <SelectItem value="masonry">Masonry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="columns">Columns</Label>
              <Select
                value={String(galleryContent.columns || 3)}
                onValueChange={(value) => updateBlockContent({ columns: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Columns</SelectItem>
                  <SelectItem value="3">3 Columns</SelectItem>
                  <SelectItem value="4">4 Columns</SelectItem>
                  <SelectItem value="6">6 Columns</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 'video':
        const videoContent = block.content as any
        return (
          <div className="space-y-4">
            <MediaInput
              label="Mobile Video"
              value={videoContent.src?.mobile}
              onChange={(value) => {
                const updates: any = {
                  src: { 
                    ...videoContent.src, 
                    mobile: value 
                  }
                }
                
                // Auto-populate mobile display dimensions from asset dimensions if available and not already set
                if (value?.dimensions) {
                  const currentMobileWidth = videoContent.displayDimensions?.mobile?.width || videoContent.width
                  const currentMobileHeight = videoContent.displayDimensions?.mobile?.height || videoContent.height
                  
                  if (!currentMobileWidth || !currentMobileHeight) {
                    updates.displayDimensions = {
                      ...videoContent.displayDimensions,
                      mobile: {
                        ...videoContent.displayDimensions?.mobile,
                        width: !currentMobileWidth ? `${value.dimensions.width}px` : currentMobileWidth,
                        height: !currentMobileHeight ? `${value.dimensions.height}px` : currentMobileHeight
                      }
                    }
                    
                    // Backward compatibility
                    if (!currentMobileWidth) updates.width = `${value.dimensions.width}px`
                    if (!currentMobileHeight) updates.height = `${value.dimensions.height}px`
                  }
                }
                
                updateBlockContent(updates)
              }}
              accept="video"
              placeholder="Select video from library..."
              required={true}
            />
            <MediaInput
              label="Desktop Video (Optional)"
              value={videoContent.src?.desktop}
              onChange={(value) => {
                const updates: any = {
                  src: { 
                    ...videoContent.src, 
                    desktop: value 
                  }
                }
                
                // Auto-populate desktop display dimensions from asset dimensions if available and not already set
                if (value?.dimensions) {
                  const currentDesktopWidth = videoContent.displayDimensions?.desktop?.width
                  const currentDesktopHeight = videoContent.displayDimensions?.desktop?.height
                  
                  if (!currentDesktopWidth || !currentDesktopHeight) {
                    updates.displayDimensions = {
                      ...videoContent.displayDimensions,
                      desktop: {
                        ...videoContent.displayDimensions?.desktop,
                        width: !currentDesktopWidth ? `${value.dimensions.width}px` : currentDesktopWidth,
                        height: !currentDesktopHeight ? `${value.dimensions.height}px` : currentDesktopHeight
                      }
                    }
                  }
                }
                
                updateBlockContent(updates)
              }}
              accept="video"
              placeholder="Select video from library..."
              required={false}
            />
            <MediaInput
              label="Mobile Poster Image"
              value={videoContent.poster?.mobile}
              onChange={(value) => updateBlockContent({ 
                poster: { 
                  ...videoContent.poster, 
                  mobile: value 
                }
              })}
              accept="image"
              placeholder="Select image from library..."
              required={false}
            />
            <MediaInput
              label="Desktop Poster Image (Optional)"
              value={videoContent.poster?.desktop}
              onChange={(value) => updateBlockContent({ 
                poster: { 
                  ...videoContent.poster, 
                  desktop: value 
                }
              })}
              accept="image"
              placeholder="Select image from library..."
              required={false}
            />
          </div>
        )

      case 'product-grid':
        const productGridContent = block.content as any
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="layout">Layout</Label>
              <Select
                value={productGridContent.layout || 'grid'}
                onValueChange={(value) => updateBlockContent({ layout: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="columns">Columns</Label>
              <Select
                value={String(productGridContent.columns || 3)}
                onValueChange={(value) => updateBlockContent({ columns: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Columns</SelectItem>
                  <SelectItem value="3">3 Columns</SelectItem>
                  <SelectItem value="4">4 Columns</SelectItem>
                  <SelectItem value="6">6 Columns</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category Filter</Label>
              <Input
                id="category"
                value={productGridContent.filters?.category || ''}
                onChange={(e) => updateBlockContent({ 
                  filters: { 
                    ...productGridContent.filters, 
                    category: e.target.value 
                  }
                })}
                placeholder="Category name (optional)"
              />
            </div>
          </div>
        )


      case 'faq':
        const faqContent = block.content as any
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>FAQ Items</Label>
              {(faqContent.faqs || []).map((faq: any, index: number) => (
                <div key={index} className="p-3 border rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">FAQ {index + 1}</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newFaqs = faqContent.faqs.filter((_: any, i: number) => i !== index)
                        updateBlockContent({ faqs: newFaqs })
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <Input
                    value={faq.question || ''}
                    onChange={(e) => {
                      const newFaqs = [...faqContent.faqs]
                      newFaqs[index] = { ...faq, question: e.target.value }
                      updateBlockContent({ faqs: newFaqs })
                    }}
                    placeholder="Question"
                  />
                  <SimpleRichTextEditor
                    value={faq.answer || ''}
                    onChange={(value) => {
                      const newFaqs = [...faqContent.faqs]
                      newFaqs[index] = { ...faq, answer: value }
                      updateBlockContent({ faqs: newFaqs })
                    }}
                    placeholder="Answer"
                    rows={3}
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newFaqs = [...(faqContent.faqs || []), {
                    question: '',
                    answer: ''
                  }]
                  updateBlockContent({ faqs: newFaqs })
                }}
              >
                Add FAQ
              </Button>
            </div>
          </div>
        )






      case 'custom-html':
        const htmlContent = block.content as any
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="html">HTML Code</Label>
              <Textarea
                id="html"
                value={htmlContent.html || ''}
                onChange={(e) => updateBlockContent({ html: e.target.value })}
                placeholder="Enter your HTML code..."
                rows={8}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="css">CSS Code (Optional)</Label>
              <Textarea
                id="css"
                value={htmlContent.css || ''}
                onChange={(e) => updateBlockContent({ css: e.target.value })}
                placeholder="Enter your CSS code..."
                rows={4}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="js">JavaScript Code (Optional)</Label>
              <Textarea
                id="js"
                value={htmlContent.js || ''}
                onChange={(e) => updateBlockContent({ js: e.target.value })}
                placeholder="Enter your JavaScript code..."
                rows={4}
                className="font-mono"
              />
            </div>
          </div>
        )

      case 'text':
        const textContent = block.content as any
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <SimpleRichTextEditor
                id="text"
                value={textContent.text || ''}
                onChange={(value) => updateBlockContent({ text: value })}
                placeholder="Enter your text content..."
                rows={8}
              />
            </div>
          </div>
        )

      case 'image':
        const imageContent = block.content as any
        return (
          <TooltipProvider>
            <div className="space-y-4">
              <MediaInput
                label="Mobile Image"
                value={imageContent.src?.mobile}
                onChange={(value) => {
                  const updates: any = {
                    src: { 
                      ...imageContent.src, 
                      mobile: value 
                    }
                  }
                  
                  // Auto-populate mobile display dimensions from asset dimensions if available and not already set
                  if (value?.dimensions) {
                    const currentMobileWidth = imageContent.displayDimensions?.mobile?.width || imageContent.width
                    const currentMobileHeight = imageContent.displayDimensions?.mobile?.height || imageContent.height
                    
                    if (!currentMobileWidth || !currentMobileHeight) {
                      updates.displayDimensions = {
                        ...imageContent.displayDimensions,
                        mobile: {
                          ...imageContent.displayDimensions?.mobile,
                          width: !currentMobileWidth ? `${value.dimensions.width}px` : currentMobileWidth,
                          height: !currentMobileHeight ? `${value.dimensions.height}px` : currentMobileHeight
                        }
                      }
                      
                      // Backward compatibility
                      if (!currentMobileWidth) updates.width = `${value.dimensions.width}px`
                      if (!currentMobileHeight) updates.height = `${value.dimensions.height}px`
                    }
                  }
                  
                  updateBlockContent(updates)
                }}
                accept="image"
                placeholder="Select image from library..."
                required={true}
              />
              <MediaInput
                label="Desktop Image (Optional)"
                value={imageContent.src?.desktop}
                onChange={(value) => {
                  const updates: any = {
                    src: { 
                      ...imageContent.src, 
                      desktop: value 
                    }
                  }
                  
                  // Auto-populate desktop display dimensions from asset dimensions if available and not already set
                  if (value?.dimensions) {
                    const currentDesktopWidth = imageContent.displayDimensions?.desktop?.width
                    const currentDesktopHeight = imageContent.displayDimensions?.desktop?.height
                    
                    if (!currentDesktopWidth || !currentDesktopHeight) {
                      updates.displayDimensions = {
                        ...imageContent.displayDimensions,
                        desktop: {
                          ...imageContent.displayDimensions?.desktop,
                          width: !currentDesktopWidth ? `${value.dimensions.width}px` : currentDesktopWidth,
                          height: !currentDesktopHeight ? `${value.dimensions.height}px` : currentDesktopHeight
                        }
                      }
                    }
                  }
                  
                  updateBlockContent(updates)
                }}
                accept="image"
                placeholder="Select image from library..."
                required={false}
                allowClear={true}
              />
              <div className="space-y-2">
                <Label htmlFor="alt">Alt Text</Label>
                <Input
                  id="alt"
                  value={imageContent.alt || ''}
                  onChange={(e) => updateBlockContent({ alt: e.target.value })}
                  placeholder="Describe the image..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Input
                  id="caption"
                  value={imageContent.caption || ''}
                  onChange={(e) => updateBlockContent({ caption: e.target.value })}
                  placeholder="Optional caption..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link">Link URL</Label>
                <Input
                  id="link"
                  value={imageContent.link || ''}
                  onChange={(e) => updateBlockContent({ link: e.target.value })}
                  placeholder="https://... (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="objectFit">Object Fit</Label>
                <Select
                  value={imageContent.objectFit || 'cover'}
                  onValueChange={(value) => updateBlockContent({ objectFit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover">Cover</SelectItem>
                    <SelectItem value="contain">Contain</SelectItem>
                    <SelectItem value="fill">Fill</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TooltipProvider>
        )


      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <p>Content settings for {block.type} block coming soon...</p>
          </div>
        )
    }
  }

  return (
    <div className="p-4 space-y-4">
      {renderContentSettings()}
    </div>
  )
}