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
import { TiptapRichTextEditor } from '@/components/ui/tiptap-rich-text-editor'

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
                <TiptapRichTextEditor
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
                  <TiptapRichTextEditor
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
              onChange={(value) => updateBlockContent({ 
                src: { 
                  ...videoContent.src, 
                  mobile: value 
                }
              })}
              accept="video"
              placeholder="Select video from library..."
              required={true}
            />
            <MediaInput
              label="Desktop Video (Optional)"
              value={videoContent.src?.desktop}
              onChange={(value) => updateBlockContent({ 
                src: { 
                  ...videoContent.src, 
                  desktop: value 
                }
              })}
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

      case 'testimonials':
        const testimonialsContent = block.content as any
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Testimonials</Label>
              {(testimonialsContent.testimonials || []).map((testimonial: any, index: number) => (
                <div key={index} className="p-3 border rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Testimonial {index + 1}</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newTestimonials = testimonialsContent.testimonials.filter((_: any, i: number) => i !== index)
                        updateBlockContent({ testimonials: newTestimonials })
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <TiptapRichTextEditor
                    value={testimonial.text || ''}
                    onChange={(value) => {
                      const newTestimonials = [...testimonialsContent.testimonials]
                      newTestimonials[index] = { ...testimonial, text: value }
                      updateBlockContent({ testimonials: newTestimonials })
                    }}
                    placeholder="Testimonial text"
                    rows={3}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={testimonial.author || ''}
                      onChange={(e) => {
                        const newTestimonials = [...testimonialsContent.testimonials]
                        newTestimonials[index] = { ...testimonial, author: e.target.value }
                        updateBlockContent({ testimonials: newTestimonials })
                      }}
                      placeholder="Author name"
                    />
                    <Input
                      value={testimonial.role || ''}
                      onChange={(e) => {
                        const newTestimonials = [...testimonialsContent.testimonials]
                        newTestimonials[index] = { ...testimonial, role: e.target.value }
                        updateBlockContent({ testimonials: newTestimonials })
                      }}
                      placeholder="Role/Title"
                    />
                  </div>
                  <MediaInput
                    label="Avatar Image (Optional)"
                    value={testimonial.avatar}
                    onChange={(value) => {
                      const newTestimonials = [...testimonialsContent.testimonials]
                      newTestimonials[index] = { ...testimonial, avatar: value }
                      updateBlockContent({ testimonials: newTestimonials })
                    }}
                    accept="image"
                    placeholder="Select avatar from library..."
                    required={false}
                    allowClear={true}
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newTestimonials = [...(testimonialsContent.testimonials || []), {
                    text: '',
                    author: '',
                    role: '',
                    avatar: ''
                  }]
                  updateBlockContent({ testimonials: newTestimonials })
                }}
              >
                Add Testimonial
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="layout">Layout</Label>
              <Select
                value={testimonialsContent.layout || 'grid'}
                onValueChange={(value) => updateBlockContent({ layout: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                  <SelectItem value="single">Single</SelectItem>
                </SelectContent>
              </Select>
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
                  <TiptapRichTextEditor
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

      case 'cta':
        const ctaContent = block.content as any
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="heading">Heading</Label>
              <Input
                id="heading"
                value={ctaContent.heading || ''}
                onChange={(e) => updateBlockContent({ heading: e.target.value })}
                placeholder="Enter CTA heading..."
              />
            </div>
            <div className="space-y-2">
              <TiptapRichTextEditor
                id="description"
                label="Description"
                value={ctaContent.description || ''}
                onChange={(value) => updateBlockContent({ description: value })}
                placeholder="Enter description..."
                rows={3}
              />
            </div>
            <MediaInput
              label="Mobile Background Image"
              value={ctaContent.backgroundImage?.mobile}
              onChange={(value) => updateBlockContent({ 
                backgroundImage: { 
                  ...ctaContent.backgroundImage, 
                  mobile: value 
                }
              })}
              accept="image"
              placeholder="Select background image from library..."
              required={false}
            />
            <MediaInput
              label="Desktop Background Image (Optional)"
              value={ctaContent.backgroundImage?.desktop}
              onChange={(value) => updateBlockContent({ 
                backgroundImage: { 
                  ...ctaContent.backgroundImage, 
                  desktop: value 
                }
              })}
              accept="image"
              placeholder="Select background image from library..."
              required={false}
              allowClear={true}
            />
            <div className="space-y-2">
              <Label htmlFor="bg-color">Background Color</Label>
              <Input
                id="bg-color"
                value={ctaContent.backgroundColor || ''}
                onChange={(e) => updateBlockContent({ backgroundColor: e.target.value })}
                placeholder="#hex or color name (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label>Buttons</Label>
              {(ctaContent.buttons || []).map((button: any, index: number) => (
                <div key={index} className="p-3 border rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Button {index + 1}</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newButtons = ctaContent.buttons.filter((_: any, i: number) => i !== index)
                        updateBlockContent({ buttons: newButtons })
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={button.text || ''}
                      onChange={(e) => {
                        const newButtons = [...ctaContent.buttons]
                        newButtons[index] = { ...button, text: e.target.value }
                        updateBlockContent({ buttons: newButtons })
                      }}
                      placeholder="Button text"
                    />
                    <Input
                      value={button.url || ''}
                      onChange={(e) => {
                        const newButtons = [...ctaContent.buttons]
                        newButtons[index] = { ...button, url: e.target.value }
                        updateBlockContent({ buttons: newButtons })
                      }}
                      placeholder="Button URL"
                    />
                  </div>
                  <Select
                    value={button.style || 'primary'}
                    onValueChange={(value) => {
                      const newButtons = [...ctaContent.buttons]
                      newButtons[index] = { ...button, style: value }
                      updateBlockContent({ buttons: newButtons })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="outline">Outline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newButtons = [...(ctaContent.buttons || []), {
                    text: '',
                    url: '',
                    style: 'primary'
                  }]
                  updateBlockContent({ buttons: newButtons })
                }}
              >
                Add Button
              </Button>
            </div>
          </div>
        )

      case 'banner':
        const bannerContent = block.content as any
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <TiptapRichTextEditor
                id="text"
                label="Banner Text"
                value={bannerContent.text || ''}
                onChange={(value) => updateBlockContent({ text: value })}
                placeholder="Enter banner message..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Banner Type</Label>
              <Select
                value={bannerContent.type || 'info'}
                onValueChange={(value) => updateBlockContent({ type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 'accordion':
        const accordionContent = block.content as any
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Accordion Items</Label>
              {(accordionContent.items || []).map((item: any, index: number) => (
                <div key={index} className="p-3 border rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Item {index + 1}</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newItems = accordionContent.items.filter((_: any, i: number) => i !== index)
                        updateBlockContent({ items: newItems })
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <Input
                    value={item.title || ''}
                    onChange={(e) => {
                      const newItems = [...accordionContent.items]
                      newItems[index] = { ...item, title: e.target.value }
                      updateBlockContent({ items: newItems })
                    }}
                    placeholder="Title"
                  />
                  <TiptapRichTextEditor
                    value={item.content || ''}
                    onChange={(value) => {
                      const newItems = [...accordionContent.items]
                      newItems[index] = { ...item, content: value }
                      updateBlockContent({ items: newItems })
                    }}
                    placeholder="Content"
                    rows={3}
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newItems = [...(accordionContent.items || []), {
                    title: '',
                    content: ''
                  }]
                  updateBlockContent({ items: newItems })
                }}
              >
                Add Item
              </Button>
            </div>
          </div>
        )

      case 'tabs':
        const tabsContent = block.content as any
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tab Items</Label>
              {(tabsContent.tabs || []).map((tab: any, index: number) => (
                <div key={index} className="p-3 border rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Tab {index + 1}</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newTabs = tabsContent.tabs.filter((_: any, i: number) => i !== index)
                        updateBlockContent({ tabs: newTabs })
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <Input
                    value={tab.title || ''}
                    onChange={(e) => {
                      const newTabs = [...tabsContent.tabs]
                      newTabs[index] = { ...tab, title: e.target.value }
                      updateBlockContent({ tabs: newTabs })
                    }}
                    placeholder="Tab title"
                  />
                  <TiptapRichTextEditor
                    value={tab.content || ''}
                    onChange={(value) => {
                      const newTabs = [...tabsContent.tabs]
                      newTabs[index] = { ...tab, content: value }
                      updateBlockContent({ tabs: newTabs })
                    }}
                    placeholder="Tab content"
                    rows={3}
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newTabs = [...(tabsContent.tabs || []), {
                    title: '',
                    content: ''
                  }]
                  updateBlockContent({ tabs: newTabs })
                }}
              >
                Add Tab
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="orientation">Orientation</Label>
              <Select
                value={tabsContent.orientation || 'horizontal'}
                onValueChange={(value) => updateBlockContent({ orientation: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                  <SelectItem value="vertical">Vertical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 'columns':
        const columnsContent = block.content as any
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gap">Gap (px)</Label>
              <Input
                id="gap"
                type="number"
                value={columnsContent.gap || 16}
                onChange={(e) => updateBlockContent({ gap: parseInt(e.target.value) || 16 })}
                placeholder="16"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Column content configuration coming soon...
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
              <TiptapRichTextEditor
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
                  
                  // Auto-populate width/height from dimensions if available and not already set
                  if (value?.dimensions && (!imageContent.width || !imageContent.height)) {
                    if (!imageContent.width) {
                      updates.width = `${value.dimensions.width}px`
                    }
                    if (!imageContent.height) {
                      updates.height = `${value.dimensions.height}px`
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
                  
                  // Auto-populate width/height from dimensions if available and not already set
                  // Only do this if mobile image doesn't have dimensions or if this has different dimensions
                  if (value?.dimensions && (!imageContent.width || !imageContent.height)) {
                    if (!imageContent.width) {
                      updates.width = `${value.dimensions.width}px`
                    }
                    if (!imageContent.height) {
                      updates.height = `${value.dimensions.height}px`
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
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    value={imageContent.width || ''}
                    onChange={(e) => updateBlockContent({ width: e.target.value })}
                    placeholder="Auto (e.g., 300px, 100%)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    value={imageContent.height || ''}
                    onChange={(e) => updateBlockContent({ height: e.target.value })}
                    placeholder="Auto (e.g., 200px, 50vh)"
                  />
                </div>
              </div>
            </div>
          </TooltipProvider>
        )

      case 'spacer':
        const spacerContent = block.content as any
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobile-height">Mobile Height (px)</Label>
              <Input
                id="mobile-height"
                type="number"
                value={spacerContent.height?.mobile || 50}
                onChange={(e) => updateBlockContent({ 
                  height: { 
                    ...spacerContent.height, 
                    mobile: parseInt(e.target.value) || 50 
                  }
                })}
                placeholder="50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tablet-height">Tablet Height (px)</Label>
              <Input
                id="tablet-height"
                type="number"
                value={spacerContent.height?.tablet || spacerContent.height?.mobile || 50}
                onChange={(e) => updateBlockContent({ 
                  height: { 
                    ...spacerContent.height, 
                    tablet: parseInt(e.target.value) || 50 
                  }
                })}
                placeholder="Auto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desktop-height">Desktop Height (px) (Optional)</Label>
              <Input
                id="desktop-height"
                type="number"
                value={spacerContent.height?.desktop || spacerContent.height?.mobile || 50}
                onChange={(e) => updateBlockContent({ 
                  height: { 
                    ...spacerContent.height, 
                    desktop: parseInt(e.target.value) || 50 
                  }
                })}
                placeholder="Auto"
              />
            </div>
          </div>
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