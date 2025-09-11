// Core CMS Types and Interfaces

export interface CMSContent {
  _id: string
  slug: string // URL identifier (e.g., "home", "privacy-policy", "product-123", "my-first-blog-post")
  type: "page" | "product" | "blog"
  pageType?: "predefined" | "custom" // For pages: predefined (home, shop, etc.) or custom
  productId?: string // For products: reference to actual product in database
  // Blog-specific fields
  blogCategory?: string // For blogs: category slug
  blogTags?: string[] // For blogs: array of tags
  blogAuthor?: string // For blogs: author name or ID (deprecated - use authorSlug)
  authorSlug?: string // For blogs: reference to author by slug
  blogFeaturedImage?: string // For blogs: featured image URL
  blogExcerpt?: string // For blogs: short description/summary
  blogReadTime?: number // For blogs: estimated read time in minutes
  title: string
  status: "draft" | "published" | "archived"
  publishedAt?: Date
  scheduledPublishAt?: Date
  blocks: ContentBlock[]
  seo: SEOMetadata
  version: number
  createdBy: string
  updatedBy: string
  createdAt: Date
  updatedAt: Date
}

export interface ContentBlock {
  id: string
  type: "hero-section" | "video-cta" | "sliding-images-cta" | "text" | "image" | "gallery" | "video" | "product-grid" | 
        "faq" | "custom-html"
  order: number
  content: BlockContent
}




export interface SEOMetadata {
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



export interface MediaAsset {
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
    cloudflareId?: string
    streamUrl?: string
    dashUrl?: string
    status?: any
    variants?: string[]
    duration?: string
    muxAssetId?: string
    muxPlaybackId?: string
  }
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
  deletedBy?: string
}

export interface MediaFolder {
  _id: string
  name: string
  parentId?: string
  path: string
  createdAt: Date
  updatedAt: Date
}

// Block-specific content interfaces
export type BlockContent = 
  | HeroSectionBlockContent
  | VideoCTABlockContent
  | SlidingImagesCTABlockContent
  | TextBlockContent
  | ImageBlockContent
  | GalleryBlockContent
  | VideoBlockContent
  | ProductGridBlockContent
  | FAQBlockContent
  | CustomHTMLBlockContent

export interface HeroSectionBlockContent {
  media: {
    type: "image" | "video"
    mobile: { url: string; assetId?: string; filename?: string; dimensions?: { width: number; height: number } }
    desktop?: { url: string; assetId?: string; filename?: string; dimensions?: { width: number; height: number } }
  }
  heading: string
  description: string
  cta: {
    text: string
    url: string
    style?: "primary" | "secondary" | "outline"
  }
  overlay: {
    enabled: boolean
    opacity: number
  }
  alignment: "left" | "center" | "right"
  height: "small" | "medium" | "large" | "fullscreen"
}

export interface VideoCTABlockContent {
  video: {
    mobile: { url: string; assetId?: string; filename?: string; dimensions?: { width: number; height: number } }
    desktop?: { url: string; assetId?: string; filename?: string; dimensions?: { width: number; height: number } }
  }
  heading: string
  text: string
  cta: {
    text: string
    link: string
  }
  overlay?: boolean
  overlayOpacity?: number
  height: "small" | "medium" | "large" | "fullscreen"
  // Optional responsive display dimensions for video
  displayDimensions?: {
    mobile?: { width?: string; height?: string }
    desktop?: { width?: string; height?: string }
  }
}

export interface SlidingImagesCTABlockContent {
  slides: Array<{
    image: {
      mobile: { url: string; assetId?: string; dimensions?: { width: number; height: number } }
      desktop?: { url: string; assetId?: string; dimensions?: { width: number; height: number } }
    }
    heading: string
    text: string
    cta: {
      text: string
      link: string
    }
  }>
  autoplay?: boolean
  autoplaySpeed?: number
  showDots?: boolean
  showArrows?: boolean
}

export interface TextBlockContent {
  text: string // Rich text HTML
  columns?: 1 | 2 | 3
  alignment?: "left" | "center" | "right" | "justify"
}

export interface ImageBlockContent {
  src: {
    mobile: { url: string; assetId?: string; filename?: string; dimensions?: { width: number; height: number } }
    desktop?: { url: string; assetId?: string; filename?: string; dimensions?: { width: number; height: number } }
  }
  alt: string
  caption?: string
  link?: string
  objectFit?: "contain" | "cover" | "fill"
  // Responsive display dimensions
  displayDimensions?: {
    mobile?: { width?: string; height?: string }
    desktop?: { width?: string; height?: string }
  }
  // Backward compatibility - will be deprecated
  width?: string
  height?: string
}

export interface GalleryBlockContent {
  images: Array<{
    src: {
      mobile: { url: string; assetId?: string; dimensions?: { width: number; height: number } }
      desktop?: { url: string; assetId?: string; dimensions?: { width: number; height: number } }
    }
    alt: string
    caption?: string
  }>
  layout: "grid" | "carousel" | "masonry"
  columns: 2 | 3 | 4 | 6
  showCaptions: boolean
  lightbox: boolean
}

export interface VideoBlockContent {
  type: "upload" | "youtube" | "vimeo"
  src: {
    mobile: { url: string; assetId?: string; filename?: string; dimensions?: { width: number; height: number } }
    desktop?: { url: string; assetId?: string; filename?: string; dimensions?: { width: number; height: number } }
  }
  poster?: {
    mobile: { url: string; assetId?: string; filename?: string; dimensions?: { width: number; height: number } }
    desktop?: { url: string; assetId?: string; filename?: string; dimensions?: { width: number; height: number } }
  }
  controls: boolean
  autoplay: boolean
  loop: boolean
  muted: boolean
  // Responsive display dimensions
  displayDimensions?: {
    mobile?: { width?: string; height?: string }
    desktop?: { width?: string; height?: string }
  }
  // Backward compatibility - will be deprecated
  width?: string
  height?: string
}

export interface ProductGridBlockContent {
  products: string[] // Product IDs
  layout: "grid" | "carousel" | "list"
  columns: 2 | 3 | 4 | 6
  showPrice: boolean
  showRating: boolean
  showAddToCart: boolean
  filters?: {
    category?: string
    tags?: string[]
    featured?: boolean
  }
}


export interface FAQBlockContent {
  faqs: Array<{
    question: string
    answer: string
  }>
  allowMultipleOpen: boolean
  defaultOpen?: number
}



export interface CustomHTMLBlockContent {
  html: string
  css?: string
  js?: string
}





// API Response types
export interface CMSContentResponse {
  success: boolean
  data?: CMSContent
  error?: string
}

export interface CMSContentListResponse {
  success: boolean
  data?: {
    content: CMSContent[]
    pagination: {
      total: number
      page: number
      limit: number
      pages: number
    }
  }
  error?: string
}

export interface MediaAssetResponse {
  success: boolean
  data?: MediaAsset
  error?: string
}

export interface MediaAssetListResponse {
  success: boolean
  data?: {
    assets: MediaAsset[]
    folders: MediaFolder[]
    pagination: {
      total: number
      page: number
      limit: number
      pages: number
    }
  }
  error?: string
}

// Form types for API requests
export interface CreateContentRequest {
  slug: string
  type: "page" | "product" | "blog"
  pageType?: "predefined" | "custom"
  productId?: string
  // Blog-specific fields
  blogCategory?: string
  blogTags?: string[]
  blogAuthor?: string // Deprecated - use authorSlug
  authorSlug?: string
  blogFeaturedImage?: string
  blogExcerpt?: string
  title: string
  blocks?: ContentBlock[]
  seo?: SEOMetadata
  status?: "draft" | "published"
  version?: number
}

export interface UpdateContentRequest {
  title?: string
  slug?: string
  blocks?: ContentBlock[]
  seo?: SEOMetadata
  status?: "draft" | "published" | "archived"
  publishedAt?: Date
  scheduledPublishAt?: Date
  // Blog-specific fields
  blogCategory?: string
  blogTags?: string[]
  blogAuthor?: string // Deprecated - use authorSlug
  authorSlug?: string
  blogFeaturedImage?: string
  blogExcerpt?: string
}

export interface PublishContentRequest {
  publishAt?: Date
  changeNote?: string
}

export interface UploadMediaRequest {
  file: File
  alt?: string
  caption?: string
  tags?: string[]
  folderId?: string
}

// Block registry type for dynamic block loading
export interface BlockDefinition {
  type: string
  name: string
  icon: string
  description: string
  category: "content" | "media" | "layout" | "ecommerce" | "interactive"
  defaultContent: BlockContent
  component: React.ComponentType<{ block: ContentBlock; isEditing?: boolean }>
  editor: React.ComponentType<{ 
    block: ContentBlock
    onChange: (content: BlockContent) => void
  }>
}

// Media utility functions for backwards compatibility
export const createMediaRef = (
  url: string, 
  assetId?: string, 
  filename?: string, 
  dimensions?: { width: number; height: number }
): { url: string; assetId?: string; filename?: string; dimensions?: { width: number; height: number } } => ({
  url,
  assetId,
  filename,
  dimensions
})

export const getMediaUrl = (mediaRef: string | { url: string; assetId?: string; filename?: string; dimensions?: { width: number; height: number } }): string => {
  if (typeof mediaRef === 'string') return mediaRef
  return mediaRef.url
}

export const getMediaAssetId = (mediaRef: string | { url: string; assetId?: string; filename?: string; dimensions?: { width: number; height: number } }): string | undefined => {
  if (typeof mediaRef === 'string') return undefined
  return mediaRef.assetId
}

export const getMediaFilename = (mediaRef: string | { url: string; assetId?: string; filename?: string; dimensions?: { width: number; height: number } }): string | undefined => {
  if (typeof mediaRef === 'string') return undefined
  return mediaRef.filename
}

export const getMediaDimensions = (mediaRef: string | { url: string; assetId?: string; filename?: string; dimensions?: { width: number; height: number } }): { width: number; height: number } | undefined => {
  if (typeof mediaRef === 'string') return undefined
  return mediaRef.dimensions
}

export const isMediaAsset = (mediaRef: string | { url: string; assetId?: string; filename?: string; dimensions?: { width: number; height: number } }): mediaRef is { url: string; assetId?: string; filename?: string; dimensions?: { width: number; height: number } } => {
  return typeof mediaRef === 'object' && mediaRef !== null && 'url' in mediaRef
}

// Utility types
export type BlockType = ContentBlock["type"]
export type ContentStatus = CMSContent["status"]
export type ContentType = CMSContent["type"]
export type PageType = CMSContent["pageType"]
export type MediaType = MediaAsset["type"]

// Predefined pages configuration
export interface PredefinedPage {
  slug: string
  title: string
  description: string
  defaultBlocks?: ContentBlock[]
  requiredSEO?: Partial<SEOMetadata>
}

export const PREDEFINED_PAGES: PredefinedPage[] = [
  {
    slug: '', // Homepage uses empty slug for root URL
    title: 'Home Page',
    description: 'Main landing page of the website (root URL)',
    requiredSEO: {
      title: 'Welcome to Vedika Organics',
      description: 'Premium organic products for a healthier lifestyle'
    }
  },
  {
    slug: 'shop',
    title: 'Shop',
    description: 'Product listing and category pages',
    requiredSEO: {
      title: 'Shop - Vedika Organics',
      description: 'Browse our collection of organic products'
    }
  },
  {
    slug: 'about',
    title: 'About Us',
    description: 'Company information and story',
    requiredSEO: {
      title: 'About Us - Vedika Organics',
      description: 'Learn about our mission and commitment to organic living'
    }
  },
  {
    slug: 'contact',
    title: 'Contact',
    description: 'Contact information and form',
    requiredSEO: {
      title: 'Contact Us - Vedika Organics',
      description: 'Get in touch with us for any questions or support'
    }
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    description: 'Privacy policy and data handling information',
    requiredSEO: {
      title: 'Privacy Policy - Vedika Organics',
      noIndex: true
    }
  },
  {
    slug: 'terms-of-service',
    title: 'Terms of Service',
    description: 'Terms and conditions of use',
    requiredSEO: {
      title: 'Terms of Service - Vedika Organics',
      noIndex: true
    }
  },
  {
    slug: 'shipping-returns',
    title: 'Shipping & Returns',
    description: 'Shipping and return policy information',
    requiredSEO: {
      title: 'Shipping & Returns - Vedika Organics'
    }
  }
]

// Blog categories configuration
export interface BlogCategory {
  slug: string
  name: string
  description: string
  color?: string
}

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    slug: 'health-wellness',
    name: 'Health & Wellness',
    description: 'Articles about organic living and healthy lifestyle',
    color: '#10b981'
  },
  {
    slug: 'recipes',
    name: 'Recipes',
    description: 'Delicious organic recipes and cooking tips',
    color: '#f59e0b'
  },
  {
    slug: 'sustainability',
    name: 'Sustainability',
    description: 'Environmental impact and sustainable practices',
    color: '#22c55e'
  },
  {
    slug: 'farming',
    name: 'Organic Farming',
    description: 'Insights into organic farming methods and practices',
    color: '#8b5cf6'
  },
  {
    slug: 'product-updates',
    name: 'Product Updates',
    description: 'New products and company announcements',
    color: '#3b82f6'
  },
  {
    slug: 'tips-guides',
    name: 'Tips & Guides',
    description: 'Helpful tips and how-to guides',
    color: '#ef4444'
  }
]