// Core CMS Types and Interfaces

export interface CMSContent {
  _id: string
  slug: string // URL identifier (e.g., "home", "privacy-policy", "product-123")
  type: "page" | "product"
  pageType?: "predefined" | "custom" // For pages: predefined (home, shop, etc.) or custom
  productId?: string // For products: reference to actual product in database
  title: string
  status: "draft" | "published" | "archived"
  publishedAt?: Date
  scheduledPublishAt?: Date
  blocks: ContentBlock[]
  seo: SEOMetadata
  settings: PageSettings
  version: number
  createdBy: string
  updatedBy: string
  createdAt: Date
  updatedAt: Date
}

export interface ContentBlock {
  id: string
  type: "video-cta" | "sliding-images-cta" | "text" | "image" | "gallery" | "video" | "product-grid" | 
        "testimonials" | "faq" | "cta" | "spacer" | "custom-html" | 
        "banner" | "accordion" | "tabs" | "columns"
  order: number
  settings: BlockSettings
  content: BlockContent
  responsive: ResponsiveSettings
  visibility: VisibilitySettings
}

export interface BlockSettings {
  padding?: { top?: number; bottom?: number; left?: number; right?: number }
  margin?: { top?: number; bottom?: number; left?: number; right?: number }
  backgroundColor?: string
  backgroundImage?: string
  customClasses?: string
  animation?: AnimationSettings
}

export interface AnimationSettings {
  type?: "fade" | "slide" | "zoom" | "bounce"
  direction?: "up" | "down" | "left" | "right"
  duration?: number
  delay?: number
}

export interface ResponsiveSettings {
  desktop: { visible: boolean; width?: string }
  tablet: { visible: boolean; width?: string }
  mobile: { visible: boolean; width?: string }
}

export interface VisibilitySettings {
  showOn?: "all" | "logged-in" | "logged-out"
  startDate?: Date
  endDate?: Date
  conditions?: VisibilityCondition[]
}

export interface VisibilityCondition {
  field: string
  operator: "equals" | "contains" | "greater-than" | "less-than"
  value: any
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

export interface PageSettings {
  layout?: "full-width" | "contained" | "sidebar-left" | "sidebar-right"
  customCSS?: string
  customJS?: string
  headerEnabled?: boolean
  footerEnabled?: boolean
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
    cloudflareId: string
    streamUrl?: string
    dashUrl?: string
    status?: any
    variants?: string[]
    duration?: string
  }
  createdAt: Date
  updatedAt: Date
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
  | VideoCTABlockContent
  | SlidingImagesCTABlockContent
  | TextBlockContent
  | ImageBlockContent
  | GalleryBlockContent
  | VideoBlockContent
  | ProductGridBlockContent
  | TestimonialsBlockContent
  | FAQBlockContent
  | CTABlockContent
  | SpacerBlockContent
  | CustomHTMLBlockContent
  | BannerBlockContent
  | AccordionBlockContent
  | TabsBlockContent
  | ColumnsBlockContent

export interface VideoCTABlockContent {
  video: {
    desktop: string
    mobile?: string
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
}

export interface SlidingImagesCTABlockContent {
  slides: Array<{
    image: {
      desktop: string
      mobile?: string
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
    desktop: string
    mobile?: string
  }
  alt: string
  caption?: string
  link?: string
  objectFit?: "contain" | "cover" | "fill"
  width?: string
  height?: string
}

export interface GalleryBlockContent {
  images: Array<{
    src: {
      desktop: string
      mobile?: string
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
    desktop: string
    mobile?: string
  }
  poster?: {
    desktop: string
    mobile?: string
  }
  controls: boolean
  autoplay: boolean
  loop: boolean
  muted: boolean
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

export interface TestimonialsBlockContent {
  testimonials: Array<{
    text: string
    author: string
    role?: string
    avatar?: string
    rating?: number
  }>
  layout: "grid" | "carousel" | "single"
  showRating: boolean
  showAvatar: boolean
}

export interface FAQBlockContent {
  faqs: Array<{
    question: string
    answer: string
  }>
  allowMultipleOpen: boolean
  defaultOpen?: number
}

export interface CTABlockContent {
  heading: string
  description?: string
  buttons: Array<{
    text: string
    url: string
    style: "primary" | "secondary" | "outline"
  }>
  backgroundImage?: {
    desktop: string
    mobile?: string
  }
  backgroundColor?: string
}

export interface SpacerBlockContent {
  height: {
    desktop: number
    tablet?: number
    mobile?: number
  }
}

export interface CustomHTMLBlockContent {
  html: string
  css?: string
  js?: string
}

export interface BannerBlockContent {
  text: string
  type: "info" | "warning" | "success" | "error"
  dismissible: boolean
  icon?: string
  buttons?: Array<{
    text: string
    url: string
    style: "primary" | "secondary" | "outline"
  }>
}

export interface AccordionBlockContent {
  items: Array<{
    title: string
    content: string
  }>
  allowMultipleOpen: boolean
  defaultOpen?: number[]
}

export interface TabsBlockContent {
  tabs: Array<{
    title: string
    content: string
  }>
  defaultTab?: number
  orientation: "horizontal" | "vertical"
}

export interface ColumnsBlockContent {
  columns: Array<{
    width: number // percentage
    blocks: ContentBlock[]
  }>
  gap: number
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
  type: "page" | "product"
  pageType?: "predefined" | "custom"
  productId?: string
  title: string
  blocks?: ContentBlock[]
  seo?: SEOMetadata
  settings?: PageSettings
  status?: "draft" | "published"
  version?: number
}

export interface UpdateContentRequest {
  title?: string
  blocks?: ContentBlock[]
  seo?: SEOMetadata
  settings?: PageSettings
  status?: "draft" | "published" | "archived"
  publishedAt?: Date
  scheduledPublishAt?: Date
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
  defaultSettings: BlockSettings
  component: React.ComponentType<{ block: ContentBlock; isEditing?: boolean }>
  editor: React.ComponentType<{ 
    block: ContentBlock
    onChange: (content: BlockContent) => void
    onSettingsChange: (settings: BlockSettings) => void
  }>
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
    slug: 'home',
    title: 'Home Page',
    description: 'Main landing page of the website',
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