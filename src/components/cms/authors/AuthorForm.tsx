'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MediaInput } from '@/components/cms/media-library/MediaInput'
import { Loader2, Save, X, ExternalLink } from 'lucide-react'
import type { Author, CreateAuthorRequest, UpdateAuthorRequest } from '@/types/authors'
import { generateSlug } from '@/lib/authors/utils'

interface AuthorFormProps {
  author?: Author
  onSave?: (author: Author) => void
  onCancel?: () => void
}

const AUTHOR_ROLES = [
  'Editor',
  'Contributing Editor', 
  'Staff Writer',
  'Contributor',
  'Guest Writer',
  'Freelancer',
  'Columnist',
  'Reviewer'
]

export function AuthorForm({ author, onSave, onCancel }: AuthorFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<Author>>({
    displayName: '',
    email: '',
    bio: '',
    avatar: '',
    coverImage: '',
    role: '',
    featured: false,
    status: 'active' as const,
    socialLinks: {},
    expertise: [],
    metadata: {},
    seo: {},
    ...author
  })
  
  const [expertiseInput, setExpertiseInput] = useState(
    author?.expertise?.join(', ') || ''
  )
  const [autoSlug, setAutoSlug] = useState(!author) // Auto-generate slug for new authors

  const isEditing = Boolean(author?._id)
  
  // Auto-generate slug from display name for new authors
  useEffect(() => {
    if (!isEditing && autoSlug && formData.displayName) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(formData.displayName || '')
      }))
    }
  }, [formData.displayName, isEditing, autoSlug])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof typeof prev] as object || {}),
        [field]: value
      }
    }))
  }

  const handleExpertiseChange = (value: string) => {
    setExpertiseInput(value)
    const expertiseArray = value.split(',').map(item => item.trim()).filter(Boolean)
    setFormData(prev => ({
      ...prev,
      expertise: expertiseArray
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = isEditing 
        ? `/api/cms/authors/${author?.slug}`
        : '/api/cms/authors'
      
      const method = isEditing ? 'PUT' : 'POST'
      
      // Prepare data for submission
      const submitData = isEditing 
        ? formData as UpdateAuthorRequest 
        : formData as CreateAuthorRequest

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save author')
      }

      const savedAuthor = await response.json()
      
      if (onSave) {
        onSave(savedAuthor)
      } else {
        router.push('/cms/blog/authors')
      }
    } catch (error) {
      console.error('Error saving author:', error)
      alert(error instanceof Error ? error.message : 'Failed to save author')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      router.back()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Essential author profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                value={formData.displayName || ''}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                placeholder="Jane Smith"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="jane@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="slug">URL Slug *</Label>
              {!isEditing && (
                <Switch
                  checked={autoSlug}
                  onCheckedChange={setAutoSlug}
                />
              )}
              {!isEditing && (
                <span className="text-xs text-muted-foreground">Auto-generate</span>
              )}
            </div>
            <Input
              id="slug"
              value={formData.slug || ''}
              onChange={(e) => handleInputChange('slug', e.target.value)}
              placeholder="jane-smith"
              disabled={isEditing || autoSlug}
              required
            />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ExternalLink className="w-3 h-3" />
              <span>/blog/authors/{formData.slug || 'author-slug'}</span>
            </div>
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                URL cannot be changed after creation to preserve links
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Biography</Label>
            <Textarea
              id="bio"
              value={formData.bio || ''}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Brief biography and background..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role || ''}
                onValueChange={(value) => handleInputChange('role', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {AUTHOR_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || 'active'}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expertise">Expertise Areas</Label>
            <Input
              id="expertise"
              value={expertiseInput}
              onChange={(e) => handleExpertiseChange(e.target.value)}
              placeholder="Technology, Health, Sustainability"
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple areas with commas
            </p>
            {formData.expertise && formData.expertise.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.expertise.map((item, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {item}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="featured"
              checked={formData.featured || false}
              onCheckedChange={(value) => handleInputChange('featured', value)}
            />
            <Label htmlFor="featured">Featured Author</Label>
            <span className="text-xs text-muted-foreground">Show prominently on authors page</span>
          </div>
        </CardContent>
      </Card>

      {/* Media */}
      <Card>
        <CardHeader>
          <CardTitle>Media</CardTitle>
          <CardDescription>
            Profile images and visual content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <MediaInput
            label="Avatar"
            value={formData.avatar || ''}
            onChange={(value) => handleInputChange('avatar', value?.url || '')}
            accept="image"
            placeholder="Select profile image..."
            previewSize="md"
          />
          
          <MediaInput
            label="Cover Image"
            value={formData.coverImage || ''}
            onChange={(value) => handleInputChange('coverImage', value?.url || '')}
            accept="image"
            placeholder="Select cover/banner image..."
            previewSize="lg"
          />
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
          <CardDescription>
            Connect social media profiles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.socialLinks?.website || ''}
                onChange={(e) => handleNestedChange('socialLinks', 'website', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter</Label>
              <Input
                id="twitter"
                value={formData.socialLinks?.twitter || ''}
                onChange={(e) => handleNestedChange('socialLinks', 'twitter', e.target.value)}
                placeholder="@username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={formData.socialLinks?.linkedin || ''}
                onChange={(e) => handleNestedChange('socialLinks', 'linkedin', e.target.value)}
                placeholder="linkedin.com/in/username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                value={formData.socialLinks?.github || ''}
                onChange={(e) => handleNestedChange('socialLinks', 'github', e.target.value)}
                placeholder="github.com/username"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <CardHeader>
          <CardTitle>SEO Settings</CardTitle>
          <CardDescription>
            Search engine optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seoTitle">SEO Title</Label>
            <Input
              id="seoTitle"
              value={formData.seo?.title || ''}
              onChange={(e) => handleNestedChange('seo', 'title', e.target.value)}
              placeholder="Optimized title for search engines"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seoDescription">Meta Description</Label>
            <Textarea
              id="seoDescription"
              value={formData.seo?.description || ''}
              onChange={(e) => handleNestedChange('seo', 'description', e.target.value)}
              placeholder="Brief description for search results"
              rows={2}
            />
            <div className="text-xs text-muted-foreground">
              {(formData.seo?.description || '').length}/160 characters
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center gap-3">
        <Button 
          type="submit" 
          disabled={isLoading}
          className="min-w-[120px]"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          {isEditing ? 'Update' : 'Create'} Author
        </Button>
        
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleCancel}
          disabled={isLoading}
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>
    </form>
  )
}