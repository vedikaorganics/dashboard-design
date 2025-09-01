# CMS Implementation Plan

## Overview
Create a unified CMS system that manages content for all pages (products, home, shop, privacy policy, etc.) with a flexible, block-based content architecture.

## Database Schema (MongoDB)

### Core Collections

```typescript
// Main CMS collection for all content
interface CMSContent {
  _id: string
  slug: string // URL identifier (e.g., "home", "privacy-policy", "product-123")
  type: "page" | "product" | "section"
  title: string
  status: "draft" | "published" | "archived"
  publishedAt?: Date
  scheduledPublishAt?: Date
  blocks: ContentBlock[]
  seo: SEOMetadata
  settings: PageSettings
  version: number
  history: ContentVersion[]
  createdBy: string
  updatedBy: string
  createdAt: Date
  updatedAt: Date
}

// Flexible content blocks
interface ContentBlock {
  id: string
  type: "hero" | "text" | "image" | "gallery" | "video" | "product-grid" | 
        "testimonials" | "faq" | "cta" | "spacer" | "custom-html" | 
        "banner" | "accordion" | "tabs" | "columns"
  order: number
  settings: BlockSettings
  content: any // Block-specific content
  responsive: ResponsiveSettings
  visibility: VisibilitySettings
}

// Block-specific settings
interface BlockSettings {
  padding?: { top: number; bottom: number; left: number; right: number }
  margin?: { top: number; bottom: number; left: number; right: number }
  backgroundColor?: string
  backgroundImage?: string
  customClasses?: string
  animation?: AnimationSettings
}

// Responsive configuration
interface ResponsiveSettings {
  desktop: { visible: boolean; width?: string }
  tablet: { visible: boolean; width?: string }
  mobile: { visible: boolean; width?: string }
}

// Visibility rules
interface VisibilitySettings {
  showOn?: "all" | "logged-in" | "logged-out"
  startDate?: Date
  endDate?: Date
  conditions?: VisibilityCondition[]
}

// SEO metadata
interface SEOMetadata {
  title?: string
  description?: string
  keywords?: string[]
  ogImage?: string
  ogTitle?: string
  ogDescription?: string
  canonicalUrl?: string
  noIndex?: boolean
  structuredData?: any
}

// Page-level settings
interface PageSettings {
  layout?: "full-width" | "contained" | "sidebar-left" | "sidebar-right"
  customCSS?: string
  customJS?: string
  headerEnabled?: boolean
  footerEnabled?: boolean
}

// Content versioning
interface ContentVersion {
  version: number
  blocks: ContentBlock[]
  updatedBy: string
  updatedAt: Date
  changeNote?: string
}

// Media library
interface MediaAsset {
  _id: string
  url: string
  thumbnailUrl: string
  type: "image" | "video" | "document"
  filename: string
  size: number
  dimensions?: { width: number; height: number }
  alt?: string
  caption?: string
  tags: string[]
  folderId?: string
  metadata?: {
    mimeType: string
    uploadedBy: string
    originalName: string
  }
  createdAt: Date
  updatedAt: Date
}

// Media folders for organization
interface MediaFolder {
  _id: string
  name: string
  parentId?: string
  path: string
  createdAt: Date
  updatedAt: Date
}
```

## UI Architecture

### File Structure

```
src/app/cms/
  page.tsx                    # CMS dashboard with analytics
  pages/
    page.tsx                  # List all pages
    new/page.tsx             # Create new page
    [slug]/
      edit/page.tsx          # Edit existing page
      preview/page.tsx       # Preview page
  products/
    page.tsx                 # Product content management
    [productId]/
      edit/page.tsx         # Edit product content
  media/
    page.tsx                 # Media library interface
  settings/
    page.tsx                 # CMS configuration

src/components/cms/
  block-editor/
    BlockEditor.tsx          # Main editor component
    BlockToolbar.tsx         # Block manipulation tools
    BlockSettings.tsx        # Settings panel for blocks
    BlockList.tsx           # Draggable list of blocks
    
  blocks/                    # Individual block components
    HeroBlock.tsx
    TextBlock.tsx           
    ImageBlock.tsx
    GalleryBlock.tsx
    VideoBlock.tsx
    ProductGridBlock.tsx
    TestimonialsBlock.tsx
    FAQBlock.tsx
    CTABlock.tsx
    SpacerBlock.tsx
    CustomHTMLBlock.tsx
    BannerBlock.tsx
    AccordionBlock.tsx
    TabsBlock.tsx
    ColumnsBlock.tsx
    
  media-library/
    MediaLibrary.tsx         # Main media interface
    MediaUploader.tsx        # Upload functionality
    MediaBrowser.tsx         # Browse and select media
    MediaFolders.tsx        # Folder navigation
    MediaDetails.tsx        # Media metadata editor
    
  page-builder/
    PageBuilder.tsx          # Main page composition interface
    PagePreview.tsx         # Live preview component
    PageSettings.tsx        # Page-level settings
    SEOSettings.tsx         # SEO configuration
    
  common/
    RichTextEditor.tsx      # Rich text editing component
    ContentSearch.tsx       # Search within CMS
    VersionHistory.tsx      # Content version browser
    PublishControls.tsx     # Draft/publish workflow

src/lib/cms/
  blocks.ts                  # Block type definitions
  validators.ts              # Content validation rules
  transformers.ts           # Data transformation utilities
  preview.ts                # Preview generation logic
  
src/hooks/
  use-cms.ts                # CMS-specific React hooks
  use-media.ts              # Media library hooks
  use-blocks.ts             # Block management hooks
  
src/types/
  cms.ts                    # All CMS TypeScript types
```

### Component Architecture

#### Block Editor
- Visual drag-and-drop interface using @dnd-kit (already in project)
- Real-time preview alongside editor
- Inline editing for text content
- Settings panel for each block type
- Undo/redo functionality
- Copy/paste blocks between pages

#### Media Library
- Grid/list view toggle
- Drag-and-drop upload
- Bulk upload support
- Image optimization on upload
- Search by filename, tags, or metadata
- Folder organization
- Direct integration with block editor

#### Page Builder Interface
- Split view: editor and preview
- Mobile/tablet/desktop preview modes
- Block library sidebar
- Page settings panel
- SEO preview (Google SERP preview)
- Save draft / Publish controls
- Version history access

## API Routes

```
/api/cms/
  content/
    GET    /                 # List all content
    POST   /                 # Create new content
    GET    /[slug]          # Get specific content
    PUT    /[slug]          # Update content
    DELETE /[slug]          # Delete content
    POST   /[slug]/publish  # Publish content
    POST   /[slug]/unpublish # Unpublish content
    GET    /[slug]/versions # Get version history
    POST   /[slug]/restore  # Restore specific version
    
  media/
    GET    /                 # List media assets
    POST   /upload          # Upload new media
    GET    /[id]            # Get media details
    PUT    /[id]            # Update media metadata
    DELETE /[id]            # Delete media
    POST   /folders         # Create folder
    PUT    /folders/[id]    # Update folder
    DELETE /folders/[id]    # Delete folder
    
  blocks/
    GET    /types           # Get available block types
    POST   /validate        # Validate block content
    
  preview/
    POST   /                # Generate preview
    GET    /[slug]          # Get preview URL
    
  search/
    GET    /                # Search CMS content
```

## Block Types Implementation

### Hero Block
```typescript
{
  type: "hero",
  content: {
    heading: string
    subheading?: string
    backgroundImage?: string
    backgroundVideo?: string
    overlay?: boolean
    overlayOpacity?: number
    buttons?: Array<{
      text: string
      url: string
      style: "primary" | "secondary" | "outline"
    }>
    height: "small" | "medium" | "large" | "fullscreen"
  }
}
```

### Text Block
```typescript
{
  type: "text",
  content: {
    text: string // Rich text HTML
    columns?: 1 | 2 | 3
    alignment?: "left" | "center" | "right" | "justify"
  }
}
```

### Image Block
```typescript
{
  type: "image",
  content: {
    src: string
    alt: string
    caption?: string
    link?: string
    objectFit?: "contain" | "cover" | "fill"
    width?: string
    height?: string
  }
}
```

### Product Grid Block
```typescript
{
  type: "product-grid",
  content: {
    products: string[] // Product IDs
    layout: "grid" | "carousel" | "list"
    columns: 2 | 3 | 4 | 6
    showPrice: boolean
    showRating: boolean
    showAddToCart: boolean
  }
}
```

## Technical Implementation

### Frontend Libraries
- **Rich Text Editor**: Lexical (by Meta) or TipTap
- **Drag & Drop**: @dnd-kit (already installed)
- **Image Processing**: Sharp for server-side optimization
- **File Upload**: react-dropzone
- **Preview**: iframe with postMessage for communication
- **Form Handling**: react-hook-form (already installed)

### Performance Optimizations
- Lazy load block components
- Image optimization and responsive images
- Aggressive caching with cache invalidation
- Debounced auto-save
- Virtual scrolling for long content lists
- CDN integration for media assets

### Security Considerations
- Input sanitization for custom HTML blocks
- XSS prevention in rich text content
- CSRF protection for all mutations
- Role-based access control
- Media upload file type restrictions
- Rate limiting on API endpoints

## Migration Strategy

1. **Set up new CMS infrastructure**
   - Create database collections
   - Build API routes
   - Implement core UI components

2. **Create migration scripts**
   - Convert existing product sections to new block format
   - Map current content structure to new schema
   - Preserve all existing data

3. **Parallel operation**
   - Run new CMS alongside existing system
   - Allow gradual migration of content
   - Maintain backward compatibility

4. **Deprecation**
   - Once stable, migrate all content
   - Remove old content management code
   - Update all references to use new CMS

## Benefits

- **Unified System**: Single CMS for all content types
- **Flexibility**: Block-based architecture supports any layout
- **User-Friendly**: Visual editor with drag-and-drop
- **Performance**: Optimized queries and caching
- **SEO-Ready**: Built-in metadata and structured data
- **Scalable**: Designed for growth
- **Maintainable**: Clean separation of concerns

## Future Enhancements

### Template System
- Pre-designed page templates (e.g., "About Us", "Product Landing")
- Section templates for common patterns
- Block templates for quick insertion
- Save custom templates for reuse
- Template library with categories and search
- Template versioning and updates

### Advanced Features
- A/B testing for content variations
- Personalization rules
- Multi-language support
- Workflow approvals
- Content scheduling calendar
- Analytics integration
- AI-powered content suggestions
- Collaborative editing