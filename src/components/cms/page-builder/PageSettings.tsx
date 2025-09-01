'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CMSContent } from '@/types/cms'

interface PageSettingsProps {
  content: CMSContent
  onUpdate: (updates: Partial<CMSContent>) => void
  onClose: () => void
}

export function PageSettings({ content, onUpdate, onClose }: PageSettingsProps) {
  const [activeTab, setActiveTab] = useState('general')

  const updateSEO = (updates: any) => {
    onUpdate({
      seo: { ...content.seo, ...updates }
    })
  }

  const updateSettings = (updates: any) => {
    onUpdate({
      settings: { ...content.settings, ...updates }
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Page Settings</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <div className="border-b">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          <TabsContent value="general" className="p-4 space-y-6 mt-0">
            {/* Basic info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Page Title *</Label>
                <Input
                  id="title"
                  value={content.title}
                  onChange={(e) => onUpdate({ title: e.target.value })}
                  placeholder="Enter page title..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={content.slug}
                  onChange={(e) => onUpdate({ slug: e.target.value })}
                  placeholder="page-url-slug"
                />
                <p className="text-xs text-muted-foreground">
                  URL: https://yoursite.com/{content.slug}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Content Type</Label>
                <Select
                  value={content.type}
                  onValueChange={(value) => onUpdate({ type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="page">Static Page</SelectItem>
                    <SelectItem value="product">Product Page</SelectItem>
                    <SelectItem value="section">Page Section</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Layout settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Layout</h4>
              
              <div className="space-y-2">
                <Label htmlFor="layout">Page Layout</Label>
                <Select
                  value={content.settings?.layout || 'contained'}
                  onValueChange={(value) => updateSettings({ layout: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-width">Full Width</SelectItem>
                    <SelectItem value="contained">Container (Max Width)</SelectItem>
                    <SelectItem value="sidebar-left">Left Sidebar</SelectItem>
                    <SelectItem value="sidebar-right">Right Sidebar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="header"
                  checked={content.settings?.headerEnabled !== false}
                  onCheckedChange={(checked) => updateSettings({ headerEnabled: checked })}
                />
                <Label htmlFor="header">Show site header</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="footer"
                  checked={content.settings?.footerEnabled !== false}
                  onCheckedChange={(checked) => updateSettings({ footerEnabled: checked })}
                />
                <Label htmlFor="footer">Show site footer</Label>
              </div>
            </div>

            <Separator />

            {/* Publishing */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Publishing</h4>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={content.status}
                  onValueChange={(value) => onUpdate({ status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {content.status === 'published' && content.publishedAt && (
                <div className="text-sm text-muted-foreground">
                  Published on {new Date(content.publishedAt).toLocaleString()}
                </div>
              )}

              {content.scheduledPublishAt && (
                <div className="text-sm text-muted-foreground">
                  Scheduled for {new Date(content.scheduledPublishAt).toLocaleString()}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="seo" className="p-4 space-y-6 mt-0">
            {/* SEO Meta */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo-title">SEO Title</Label>
                <Input
                  id="seo-title"
                  value={content.seo?.title || ''}
                  onChange={(e) => updateSEO({ title: e.target.value })}
                  placeholder="Optimized page title for search engines"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Recommended: 50-60 characters</span>
                  <span>{(content.seo?.title || '').length}/60</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo-description">Meta Description</Label>
                <Textarea
                  id="seo-description"
                  value={content.seo?.description || ''}
                  onChange={(e) => updateSEO({ description: e.target.value })}
                  placeholder="Brief description that appears in search results"
                  rows={3}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Recommended: 150-160 characters</span>
                  <span>{(content.seo?.description || '').length}/160</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo-keywords">Keywords</Label>
                <Input
                  id="seo-keywords"
                  value={content.seo?.keywords?.join(', ') || ''}
                  onChange={(e) => updateSEO({ 
                    keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) 
                  })}
                  placeholder="keyword1, keyword2, keyword3"
                />
                <p className="text-xs text-muted-foreground">
                  Separate keywords with commas
                </p>
              </div>
            </div>

            <Separator />

            {/* Open Graph */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Social Media (Open Graph)</h4>
              
              <div className="space-y-2">
                <Label htmlFor="og-title">Social Title</Label>
                <Input
                  id="og-title"
                  value={content.seo?.ogTitle || ''}
                  onChange={(e) => updateSEO({ ogTitle: e.target.value })}
                  placeholder="Title for social media sharing"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="og-description">Social Description</Label>
                <Textarea
                  id="og-description"
                  value={content.seo?.ogDescription || ''}
                  onChange={(e) => updateSEO({ ogDescription: e.target.value })}
                  placeholder="Description for social media sharing"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="og-image">Social Image URL</Label>
                <Input
                  id="og-image"
                  value={content.seo?.ogImage || ''}
                  onChange={(e) => updateSEO({ ogImage: e.target.value })}
                  placeholder="https://example.com/social-image.jpg"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 1200x630px
                </p>
              </div>
            </div>

            <Separator />

            {/* Advanced SEO */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Advanced SEO</h4>
              
              <div className="space-y-2">
                <Label htmlFor="canonical">Canonical URL</Label>
                <Input
                  id="canonical"
                  value={content.seo?.canonicalUrl || ''}
                  onChange={(e) => updateSEO({ canonicalUrl: e.target.value })}
                  placeholder="https://example.com/canonical-url"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use the page's own URL
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="noindex"
                  checked={content.seo?.noIndex || false}
                  onCheckedChange={(checked) => updateSEO({ noIndex: checked })}
                />
                <Label htmlFor="noindex">No Index (hide from search engines)</Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="p-4 space-y-6 mt-0">
            {/* Custom CSS/JS */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Custom Code</h4>
              
              <div className="space-y-2">
                <Label htmlFor="custom-css">Custom CSS</Label>
                <Textarea
                  id="custom-css"
                  value={content.settings?.customCSS || ''}
                  onChange={(e) => updateSettings({ customCSS: e.target.value })}
                  placeholder="/* Custom CSS for this page */"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-js">Custom JavaScript</Label>
                <Textarea
                  id="custom-js"
                  value={content.settings?.customJS || ''}
                  onChange={(e) => updateSettings({ customJS: e.target.value })}
                  placeholder="// Custom JavaScript for this page"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <Separator />

            {/* Version info */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Version Information</h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Created</Label>
                  <div>{new Date(content.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Updated</Label>
                  <div>{new Date(content.updatedAt).toLocaleString()}</div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Version</Label>
                  <div>v{content.version}</div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">ID</Label>
                  <div className="font-mono text-xs break-all">{content._id}</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Danger zone */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
              
              <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <p className="text-sm text-destructive mb-3">
                  Delete this page permanently. This action cannot be undone.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
                      // Handle delete - would need to be passed as prop
                      console.log('Delete page')
                    }
                  }}
                >
                  Delete Page
                </Button>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}