"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { X, Plus, Image as ImageIcon, Type } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

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

interface ContentSectionDialogProps {
  isOpen: boolean
  onClose: () => void
  section?: ContentSection | null
  productId: string
  onSave: () => void
  allSections: ContentSection[]
}

export function ContentSectionDialog({
  isOpen,
  onClose,
  section,
  productId,
  onSave,
  allSections
}: ContentSectionDialogProps) {
  const [type, setType] = useState<"image" | "text">("text")
  const [desktopUrl, setDesktopUrl] = useState("")
  const [mobileUrl, setMobileUrl] = useState("")
  const [alt, setAlt] = useState("")
  const [caption, setCaption] = useState("")
  const [heading, setHeading] = useState("")
  const [body, setBody] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [items, setItems] = useState<string[]>([])
  const [newImageUrl, setNewImageUrl] = useState("")
  const [newItem, setNewItem] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const isEditing = !!section

  // Initialize form when dialog opens or section changes
  useEffect(() => {
    if (section) {
      setType(section.type)
      setDesktopUrl(section.desktopUrl || "")
      setMobileUrl(section.mobileUrl || "")
      setAlt(section.alt || "")
      setCaption(section.caption || "")
      setHeading(section.heading || "")
      setBody(section.body || "")
      setImages(section.images || [])
      setItems(section.items || [])
    } else {
      // Reset form for new section
      setType("text")
      setDesktopUrl("")
      setMobileUrl("")
      setAlt("")
      setCaption("")
      setHeading("")
      setBody("")
      setImages([])
      setItems([])
    }
    setNewImageUrl("")
    setNewItem("")
  }, [section, isOpen])

  const generateId = () => {
    return Math.random().toString(36).substr(2, 9)
  }

  const addImage = () => {
    if (newImageUrl.trim()) {
      setImages(prev => [...prev, newImageUrl.trim()])
      setNewImageUrl("")
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const addItem = () => {
    if (newItem.trim()) {
      setItems(prev => [...prev, newItem.trim()])
      setNewItem("")
    }
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    if (type === "image") {
      if (!desktopUrl.trim()) {
        toast.error("Desktop URL is required for image sections")
        return false
      }
      if (!alt.trim()) {
        toast.error("Alt text is required for image sections")
        return false
      }
    } else {
      if (!heading.trim()) {
        toast.error("Heading is required for text sections")
        return false
      }
    }
    return true
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    
    try {
      let updatedSections = [...allSections]
      
      const sectionData: ContentSection = {
        id: section?.id || generateId(),
        type,
        order: section?.order ?? allSections.length,
        ...(type === "image" && {
          desktopUrl: desktopUrl.trim(),
          mobileUrl: mobileUrl.trim() || undefined,
          alt: alt.trim(),
          caption: caption.trim() || undefined,
        }),
        ...(type === "text" && {
          heading: heading.trim(),
          body: body.trim() || undefined,
          images: images.length > 0 ? images : undefined,
          items: items.length > 0 ? items : undefined,
        })
      }

      if (isEditing) {
        // Update existing section
        const index = updatedSections.findIndex(s => s.id === section!.id)
        if (index !== -1) {
          updatedSections[index] = sectionData
        }
      } else {
        // Add new section
        updatedSections.push(sectionData)
      }

      await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: updatedSections })
      })

      toast.success(isEditing ? "Section updated successfully!" : "Section created successfully!")
      onSave()
      onClose()
    } catch (error) {
      console.error('Failed to save section:', error)
      toast.error("Failed to save section")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>{isEditing ? "Edit" : "Create"} Content Section</span>
            {isEditing && (
              <Badge variant="outline" className="ml-2">
                <code className="text-xs">{section?.id}</code>
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Section Type */}
          <div className="space-y-2">
            <Label>Section Type</Label>
            <Select
              value={type}
              onValueChange={(value: "image" | "text") => setType(value)}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">
                  <div className="flex items-center space-x-2">
                    <Type className="w-4 h-4" />
                    <span>Text Section</span>
                  </div>
                </SelectItem>
                <SelectItem value="image">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4" />
                    <span>Image Section</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Image Section Fields */}
          {type === "image" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Desktop URL *</Label>
                  <Input
                    value={desktopUrl}
                    onChange={(e) => setDesktopUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  {desktopUrl && (
                    <div className="w-full h-32 bg-muted rounded border overflow-hidden">
                      <Image
                        src={desktopUrl}
                        alt="Desktop preview"
                        width={200}
                        height={128}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Mobile URL</Label>
                  <Input
                    value={mobileUrl}
                    onChange={(e) => setMobileUrl(e.target.value)}
                    placeholder="https://example.com/image-mobile.jpg"
                  />
                  {mobileUrl && (
                    <div className="w-full h-32 bg-muted rounded border overflow-hidden">
                      <Image
                        src={mobileUrl}
                        alt="Mobile preview"
                        width={200}
                        height={128}
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
                <Label>Alt Text *</Label>
                <Input
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                  placeholder="Descriptive text for accessibility"
                />
              </div>

              <div className="space-y-2">
                <Label>Caption</Label>
                <Input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Optional caption text"
                />
              </div>
            </div>
          )}

          {/* Text Section Fields */}
          {type === "text" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Heading *</Label>
                <Input
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  placeholder="Section heading"
                />
              </div>

              <div className="space-y-2">
                <Label>Body Text</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Section content..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Additional Images</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  <Button type="button" onClick={addImage} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {images.length > 0 && (
                  <div className="space-y-2">
                    {images.map((imageUrl, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded">
                        <span className="text-sm truncate flex-1">{imageUrl}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeImage(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Items List</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Add list item"
                  />
                  <Button type="button" onClick={addItem} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {items.length > 0 && (
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded">
                        <span className="text-sm flex-1">{item}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : (isEditing ? "Update Section" : "Create Section")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}