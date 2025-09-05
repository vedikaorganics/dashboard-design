# Ecommerce Project Integration Guide

This comprehensive guide explains how your ecommerce Next.js project can consume content and data managed through this dashboard system. Both systems share the same MongoDB database, enabling seamless content management and real-time updates.

## Table of Contents

1. [Database Architecture](#database-architecture)
2. [MongoDB Collections](#mongodb-collections)
3. [Product Management Integration](#product-management-integration)
4. [CMS Content Integration](#cms-content-integration)
5. [Media Asset Integration](#media-asset-integration)
6. [API Endpoints for Frontend](#api-endpoints-for-frontend)
7. [Implementation Examples](#implementation-examples)
8. [Best Practices](#best-practices)
9. [Performance Optimization](#performance-optimization)

## Database Architecture

The dashboard manages content in a MongoDB database with the following connection configuration:

```javascript
// lib/mongodb.ts - Database Connection
import { MongoClient } from 'mongodb'

const client = new MongoClient(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})

// Connection pooling ensures optimal performance
export async function getDatabase() {
  await client.connect()
  return client.db() // Uses database from MONGODB_URI
}
```

**Environment Requirements:**
- `MONGODB_URI`: Full MongoDB connection string (same database as dashboard)
- Example: `mongodb+srv://username:password@cluster.mongodb.net/your-database`

## MongoDB Collections

### Core Product Collections

#### 1. `products` Collection
```typescript
interface Product {
  _id: string
  id: string              // Unique product identifier
  title: string           // Product name
  description: string     // Product description
  colorHex: string        // Brand color for theming
  bulletPoints: string[]  // Key product features
  mainVariant: string     // Default variant ID
  sections: ProductSection[] // Rich content sections
  badges: string[]        // Product badges (New, Sale, etc.)
  tags: string[]          // Product tags for filtering
  createdAt: string
  updatedAt: string
}

interface ProductSection {
  id: string
  type: 'image' | 'text'
  order: number           // Display order
  desktopUrl?: string     // Desktop image URL
  mobileUrl?: string      // Mobile image URL
  alt?: string           // Image alt text
  caption?: string       // Image caption
  heading?: string       // Text heading
  body?: string          // Text content
  images?: any[]         // Additional images
  items?: any[]          // Additional items
}
```

#### 2. `productvariants` Collection
```typescript
interface ProductVariant {
  _id: string
  id: string              // Unique variant identifier
  title: string           // Variant name (e.g., "500ml Bottle")
  unit: string           // Unit type (ml, gm, kg, etc.)
  size: number           // Numeric size value
  price: number          // Current selling price
  mrp: number            // Maximum Retail Price
  coverImage: string     // Main product image URL
  cartImage: string      // Cart display image URL
  productId: string      // Reference to parent product
  otherImages: string[]  // Additional product images
  variantOrder: number   // Display order within product
  label: string | null   // Special label (Sale, New, etc.)
  type: string           // Variant type/category
  createdAt: string
  updatedAt: string
}
```

#### 3. `reviews` Collection
```typescript
interface Review {
  _id: string
  author: string         // Reviewer name
  userId: string         // User ID who wrote review
  product: string        // Product title
  productId: string      // Product ID reference
  rating: number         // 1-5 star rating
  text: string          // Review text
  photos: string[]      // Review image URLs
  isApproved: boolean   // Moderation status
  replies: any[]        // Admin replies
  sortOrder: number     // Custom sorting
  createdAt: string
  updatedAt: string
}
```

### CMS Content Collections

#### 4. `cms_content` Collection
```typescript
interface CMSContent {
  _id: string
  slug: string                    // URL identifier (e.g., "home", "about")
  type: "page" | "product"       // Content type
  pageType?: "predefined" | "custom" // For pages
  productId?: string             // For product-specific content
  title: string                  // Page/content title
  status: "draft" | "published" | "archived"
  publishedAt?: Date
  blocks: ContentBlock[]         // Rich content blocks
  seo: SEOMetadata              // SEO configuration
  version: number               // Version control
  createdBy: string
  updatedBy: string
  createdAt: Date
  updatedAt: Date
}

interface ContentBlock {
  id: string
  type: "video-cta" | "sliding-images-cta" | "text" | "image" | 
        "gallery" | "video" | "product-grid" | "testimonials" | 
        "faq" | "cta" | "spacer" | "custom-html" | "banner" | 
        "accordion" | "tabs" | "columns"
  order: number                 // Display order
  content: BlockContent        // Type-specific content
}

// Text Block Content Structure
interface TextBlockContent {
  text: string                  // Rich HTML content from Tiptap editor
}

// Video CTA Block Content Structure  
interface VideoCTABlockContent {
  video: {
    mobile: { url: string }      // HLS streaming URL from Cloudflare Stream
    desktop?: { url: string }    // HLS streaming URL from Cloudflare Stream (optional)
  }
  overlay: boolean
  overlayOpacity?: number
  heading: string
  text: string                  // Rich HTML content from Tiptap editor
  cta: {
    text: string
    link: string
  }
  height: "small" | "medium" | "large" | "full"
}

// Video Block Content Structure
interface VideoBlockContent {
  src: {
    mobile: { url: string }      // HLS streaming URL from Cloudflare Stream
    desktop?: { url: string }    // HLS streaming URL from Cloudflare Stream (optional)
  }
  poster?: {
    mobile: { url: string }      // Poster image URL
    desktop?: { url: string }    // Desktop poster image (optional)
  }
  controls?: boolean            // Show video controls
  autoplay?: boolean           // Auto-play video
  loop?: boolean               // Loop video playback
  muted?: boolean              // Mute video by default
}
```

#### 5. `cms_media_assets` Collection
```typescript
interface MediaAsset {
  _id: string
  url: string                   // Cloudflare public URL
  thumbnailUrl: string          // Cloudflare thumbnail URL
  type: "image" | "video" | "document"
  filename: string              // Original filename
  size: number                  // File size in bytes
  dimensions?: { width: number; height: number }
  alt?: string                  // Alt text
  caption?: string              // Caption text
  tags: string[]               // Media tags
  folderId?: string            // Organization folder
  metadata: {
    mimeType: string
    uploadedBy: string
    originalName: string
    cloudflareId: string       // Cloudflare asset ID
    streamUrl?: string         // Video stream URL
    dashUrl?: string          // Video DASH URL
    status?: any              // Upload status
    variants?: string[]       // Image variants
    duration?: string         // Video duration
  }
  createdAt: Date
  updatedAt: Date
}
```

### Supporting Collections

#### 6. `users` Collection
```typescript
interface User {
  _id: string
  phoneNumber: string
  phoneNumberVerified: boolean
  email: string
  name: string
  avatar: string
  offers: string[]              // Applied offer IDs
  noOfOrders: number           // Total orders count
  notes: string                // Admin notes
  userId: string               // Unique user identifier
  lastOrderedOn?: string       // Last order date
  createdAt: string
  updatedAt: string
}
```

#### 7. `orders` Collection
```typescript
interface Order {
  _id: string
  orderId: string              // Order number
  userId: string               // Customer ID
  amount: number               // Total amount
  currency: string
  orderStatus: 'CONFIRMED' | 'PENDING' | 'DELIVERED' | 'CANCELLED'
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED' | 'CASH_ON_DELIVERY'
  deliveryStatus: 'PENDING' | 'PREPARING' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED'
  time: string                 // Order timestamp
  items: OrderItem[]           // Ordered products
  address: Address             // Delivery address
  cashOnDelivery: boolean
  offers: Array<{              // Applied offers
    _id: string
    offerId: string
    title: string
    discount: number
    type: string
  }>
  rewards: number              // Reward points earned
  utmParams: UTMParams         // Marketing attribution
  razorpayOrder: RazorpayOrder // Payment details
  createdAt: string
  updatedAt: string
}
```

## Product Management Integration

### Fetching Products for Ecommerce

#### Basic Product Listing
```typescript
// app/api/products/route.ts
import { getDatabase } from '@/lib/mongodb'

export async function GET() {
  const db = await getDatabase()
  
  // Parallel queries for optimal performance
  const [products, variants, reviews] = await Promise.all([
    db.collection('products').find({}).toArray(),
    db.collection('productvariants').find({}).toArray(),
    db.collection('reviews').find({ isApproved: true }).toArray()
  ])
  
  // Enrich products with variants and reviews
  const enrichedProducts = products.map(product => {
    const productVariants = variants.filter(v => v.productId === product.id)
    const productReviews = reviews.filter(r => r.productId === product.id)
    
    return {
      ...product,
      variants: productVariants,
      reviewCount: productReviews.length,
      avgRating: calculateAverage(productReviews),
      minPrice: Math.min(...productVariants.map(v => v.price)),
      maxPrice: Math.max(...productVariants.map(v => v.price))
    }
  })
  
  return Response.json({ products: enrichedProducts })
}
```

#### Single Product Details
```typescript
// app/api/products/[productId]/route.ts
export async function GET(request: Request, { params }: { params: { productId: string } }) {
  const db = await getDatabase()
  const { productId } = params
  
  const [product, variants, reviews] = await Promise.all([
    db.collection('products').findOne({ id: productId }),
    db.collection('productvariants').find({ productId }).sort({ variantOrder: 1 }).toArray(),
    db.collection('reviews').find({ productId, isApproved: true }).toArray()
  ])
  
  if (!product) {
    return Response.json({ error: 'Product not found' }, { status: 404 })
  }
  
  return Response.json({
    ...product,
    variants,
    reviews,
    avgRating: calculateAverage(reviews),
    reviewCount: reviews.length
  })
}
```

### Product Display Components

#### Product Card Component
```tsx
// components/ProductCard.tsx
interface ProductCardProps {
  product: Product & {
    variants: ProductVariant[]
    avgRating: number
    reviewCount: number
    minPrice: number
    maxPrice: number
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const mainVariant = product.variants.find(v => v.id === product.mainVariant)
  
  return (
    <div className="product-card">
      <img 
        src={mainVariant?.coverImage} 
        alt={product.title}
        className="product-image"
      />
      <h3>{product.title}</h3>
      <div className="price">
        {product.minPrice === product.maxPrice ? (
          <span>₹{product.minPrice}</span>
        ) : (
          <span>₹{product.minPrice} - ₹{product.maxPrice}</span>
        )}
      </div>
      <div className="rating">
        <StarRating rating={product.avgRating} />
        <span>({product.reviewCount})</span>
      </div>
      {product.badges.map(badge => (
        <span key={badge} className="badge">{badge}</span>
      ))}
    </div>
  )
}
```

#### Product Detail Page
```tsx
// app/products/[productId]/page.tsx
export default async function ProductPage({ params }: { params: { productId: string } }) {
  const product = await fetchProduct(params.productId)
  
  return (
    <div className="product-detail">
      <div className="product-images">
        <ProductImageGallery 
          images={[product.mainVariant.coverImage, ...product.mainVariant.otherImages]}
        />
      </div>
      
      <div className="product-info">
        <h1>{product.title}</h1>
        <p>{product.description}</p>
        
        {/* Bullet points from dashboard */}
        <ul className="features">
          {product.bulletPoints.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
        
        {/* Variant selector */}
        <VariantSelector 
          variants={product.variants}
          onVariantChange={handleVariantChange}
        />
        
        {/* Rich content sections */}
        <div className="content-sections">
          {product.sections
            .sort((a, b) => a.order - b.order)
            .map(section => (
              <ProductSection key={section.id} section={section} />
            ))
          }
        </div>
        
        {/* Reviews */}
        <ReviewsSection reviews={product.reviews} />
      </div>
    </div>
  )
}
```

## CMS Content Integration

### Fetching CMS Pages

#### Page Content API
```typescript
// app/api/cms/[slug]/route.ts
export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const db = await getDatabase()
  const { slug } = params
  
  // Get latest published version
  const content = await db.collection('cms_content')
    .findOne(
      { slug, status: 'published' },
      { sort: { version: -1 } }
    )
  
  if (!content) {
    return Response.json({ error: 'Page not found' }, { status: 404 })
  }
  
  return Response.json(content)
}
```

#### Dynamic Page Rendering
```tsx
// app/[slug]/page.tsx - Dynamic CMS pages
export default async function CMSPage({ params }: { params: { slug: string } }) {
  const content = await fetchCMSContent(params.slug)
  
  return (
    <div className="cms-page">
      <Head>
        <title>{content.seo?.title || content.title}</title>
        <meta name="description" content={content.seo?.description} />
        <meta name="keywords" content={content.seo?.keywords?.join(', ')} />
      </Head>
      
      <div className="content-blocks">
        {content.blocks
          .sort((a, b) => a.order - b.order)
          .map(block => (
            <ContentBlock key={block.id} block={block} />
          ))
        }
      </div>
    </div>
  )
}
```

### Content Block Components

#### Dynamic Block Renderer
```tsx
// components/ContentBlock.tsx
export function ContentBlock({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'text':
      return <TextBlock content={block.content as TextBlockContent} />
    
    case 'image':
      return <ImageBlock content={block.content as ImageBlockContent} />
    
    case 'gallery':
      return <GalleryBlock content={block.content as GalleryBlockContent} />
    
    case 'video':
      return <VideoBlock content={block.content as VideoBlockContent} />
    
    case 'video-cta':
      return <VideoCTABlock content={block.content as VideoCTABlockContent} />
    
    case 'sliding-images-cta':
      return <SlidingImagesCTABlock content={block.content as SlidingImagesCTABlockContent} />
    
    case 'product-grid':
      return <ProductGridBlock content={block.content as ProductGridBlockContent} />
    
    case 'testimonials':
      return <TestimonialsBlock content={block.content as TestimonialsBlockContent} />
    
    case 'faq':
      return <FAQBlock content={block.content as FAQBlockContent} />
    
    case 'cta':
      return <CTABlock content={block.content as CTABlockContent} />
    
    case 'custom-html':
      return <CustomHTMLBlock content={block.content as CustomHTMLBlockContent} />
    
    default:
      return null
  }
}
```

#### Example Block Components
```tsx
// Text Block with Rich Content
function TextBlock({ content }: { content: TextBlockContent }) {
  return (
    <section className="text-block">
      <div 
        className="rich-text-content prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: content.text }}
      />
    </section>
  )
}

// Video CTA Block
function VideoCTABlock({ content }: { content: VideoCTABlockContent }) {
  const videoSrc = content.video.desktop?.url || content.video.mobile.url
  
  return (
    <section className={`video-cta height-${content.height}`}>
      <video 
        src={videoSrc}
        autoPlay
        loop
        muted
        className="background-video"
      />
      {content.overlay && (
        <div 
          className="overlay" 
          style={{ opacity: content.overlayOpacity || 0.5 }}
        />
      )}
      <div className="content">
        <h2>{content.heading}</h2>
        <div 
          className="text-content"
          dangerouslySetInnerHTML={{ __html: content.text }}
        />
        <a href={content.cta.link} className="cta-button">
          {content.cta.text}
        </a>
      </div>
    </section>
  )
}

// Video Block
function VideoBlock({ content }: { content: VideoBlockContent }) {
  const videoSrc = content.src.desktop?.url || content.src.mobile.url
  const posterSrc = content.poster?.desktop?.url || content.poster?.mobile?.url
  
  return (
    <section className="video-block">
      <video
        src={videoSrc}
        poster={posterSrc}
        controls={content.controls ?? true}
        autoPlay={content.autoplay ?? false}
        loop={content.loop ?? false}
        muted={content.muted ?? false}
        className="w-full h-auto"
      >
        Your browser does not support the video tag.
      </video>
    </section>
  )
}

// Product Grid Block
function ProductGridBlock({ content }: { content: ProductGridBlockContent }) {
  const [products, setProducts] = useState([])
  
  useEffect(() => {
    // Fetch products by IDs
    fetchProductsByIds(content.products).then(setProducts)
  }, [content.products])
  
  return (
    <section className="product-grid">
      <div className={`grid columns-${content.columns} ${content.layout}`}>
        {products.map(product => (
          <ProductCard 
            key={product.id}
            product={product}
            showPrice={content.showPrice}
            showRating={content.showRating}
            showAddToCart={content.showAddToCart}
          />
        ))}
      </div>
    </section>
  )
}
```

## Media Asset Integration

### Cloudflare Media URLs

All media assets are stored in Cloudflare and optimized for performance:

```typescript
// Media URL utilities
export function getOptimizedImageUrl(
  assetUrl: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'avif' | 'jpg'
  } = {}
) {
  const url = new URL(assetUrl)
  
  if (options.width) url.searchParams.set('width', options.width.toString())
  if (options.height) url.searchParams.set('height', options.height.toString())
  if (options.quality) url.searchParams.set('quality', options.quality.toString())
  if (options.format) url.searchParams.set('format', options.format)
  
  return url.toString()
}

// Responsive image component
export function ResponsiveImage({ 
  src, 
  alt, 
  sizes = "100vw",
  className 
}: {
  src: { mobile: { url: string }, desktop?: { url: string } }
  alt: string
  sizes?: string
  className?: string
}) {
  const mobileUrl = src.mobile.url
  const desktopUrl = src.desktop?.url || mobileUrl
  
  return (
    <picture>
      <source
        media="(min-width: 768px)"
        srcSet={`
          ${getOptimizedImageUrl(desktopUrl, { width: 640 })} 640w,
          ${getOptimizedImageUrl(desktopUrl, { width: 1024 })} 1024w,
          ${getOptimizedImageUrl(desktopUrl, { width: 1920 })} 1920w
        `}
      />
      <img
        src={getOptimizedImageUrl(mobileUrl, { width: 640 })}
        srcSet={`
          ${getOptimizedImageUrl(mobileUrl, { width: 320 })} 320w,
          ${getOptimizedImageUrl(mobileUrl, { width: 640 })} 640w
        `}
        sizes={sizes}
        alt={alt}
        className={className}
      />
    </picture>
  )
}
```

### Video Integration

All video blocks provide HLS streaming URLs for adaptive video playback:

```tsx
// HLS Video Player with hls.js for cross-browser support
'use client'

import { useEffect, useRef } from 'react'

export function CloudflareVideo({ 
  src, 
  poster, 
  controls = true,
  autoplay = false,
  loop = false,
  muted = false 
}: VideoBlockContent) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoSrc = src.desktop?.url || src.mobile.url
  const posterSrc = poster?.desktop?.url || poster?.mobile?.url
  
  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoSrc) return
    
    // Check if HLS is supported natively (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoSrc
    } 
    // For other browsers, use hls.js
    else if (typeof window !== 'undefined') {
      import('hls.js').then(({ default: Hls }) => {
        if (Hls.isSupported()) {
          const hls = new Hls()
          hls.loadSource(videoSrc)
          hls.attachMedia(video)
          
          return () => {
            hls.destroy()
          }
        }
      })
    }
  }, [videoSrc])
  
  return (
    <video
      ref={videoRef}
      poster={posterSrc}
      controls={controls}
      autoPlay={autoplay}
      loop={loop}
      muted={muted}
      className="cloudflare-video w-full h-auto"
    >
      Your browser does not support the video tag.
    </video>
  )
}

// Responsive video component for different screen sizes
export function ResponsiveVideo({ 
  src, 
  poster,
  className = "",
  ...videoProps 
}: {
  src: { mobile: { url: string }, desktop?: { url: string } }
  poster?: { mobile: { url: string }, desktop?: { url: string } }
  className?: string
  controls?: boolean
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
}) {
  return (
    <video
      className={`w-full h-auto ${className}`}
      poster={poster?.desktop?.url || poster?.mobile?.url}
      {...videoProps}
    >
      {/* Desktop video source */}
      {src.desktop && (
        <source 
          src={src.desktop.url} 
          media="(min-width: 768px)"
          type="video/mp4"
        />
      )}
      
      {/* Mobile video source */}
      <source 
        src={src.mobile.url} 
        type="video/mp4"
      />
      
      Your browser does not support the video tag.
    </video>
  )
}
```

**Video Features:**

1. **HLS Streaming URLs** - All video content provides adaptive HLS streaming URLs
2. **Poster Image Support** - Video blocks include thumbnail/preview images  
3. **Responsive Sources** - Different video streams for mobile/desktop if needed
4. **HTML5 Video Compatible** - URLs work with HTML5 video players that support HLS

**Note:** Videos use HLS streaming format (`.m3u8`) which requires a compatible player like:
- Native iOS Safari (built-in HLS support)
- hls.js for other browsers
- video.js with HLS plugin
- Other HLS-compatible video players

## API Endpoints for Frontend

### Public API Endpoints (No Auth Required)

```typescript
// Product APIs
GET /api/products                    // List all products with variants
GET /api/products/[productId]        // Single product details
GET /api/products/[productId]/reviews // Product reviews

// CMS APIs
GET /api/cms/content                 // List all published content
GET /api/cms/content/[slug]          // Get content by slug
GET /api/cms/media                   // List media assets

// Search API
GET /api/search?q=query&type=products|content
```

### Private API Endpoints (Require Auth)

```typescript
// Order Management
POST /api/orders                     // Create order
GET /api/orders/[orderId]           // Get order details
PATCH /api/orders/[orderId]         // Update order status

// User Management
GET /api/users/[userId]             // Get user profile
PATCH /api/users/[userId]           // Update user profile

// Review Management
POST /api/reviews                    // Submit review
```

### API Response Formats

All APIs follow consistent response formats:

```typescript
// Success Response
{
  "success": true,
  "data": { ... },
  "pagination"?: {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}

// Error Response
{
  "success": false,
  "error": "Error message",
  "code"?: "ERROR_CODE"
}
```

## Implementation Examples

### Homepage Implementation

```tsx
// app/page.tsx - Homepage using CMS content
export default async function HomePage() {
  const homeContent = await fetchCMSContent('home')
  const featuredProducts = await fetchFeaturedProducts()
  
  return (
    <main>
      {/* CMS-managed hero section */}
      <div className="content-blocks">
        {homeContent.blocks
          .filter(block => block.type === 'video-cta' || block.type === 'sliding-images-cta')
          .map(block => (
            <ContentBlock key={block.id} block={block} />
          ))
        }
      </div>
      
      {/* Featured products */}
      <section className="featured-products">
        <h2>Featured Products</h2>
        <div className="product-grid">
          {featuredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
      
      {/* More CMS content */}
      <div className="content-blocks">
        {homeContent.blocks
          .filter(block => block.type !== 'video-cta' && block.type !== 'sliding-images-cta')
          .map(block => (
            <ContentBlock key={block.id} block={block} />
          ))
        }
      </div>
    </main>
  )
}
```

### Shop Page Implementation

```tsx
// app/shop/page.tsx - Product listing page
export default async function ShopPage({ 
  searchParams 
}: { 
  searchParams: { category?: string, search?: string, page?: string }
}) {
  const products = await fetchProducts({
    category: searchParams.category,
    search: searchParams.search,
    page: parseInt(searchParams.page || '1')
  })
  
  return (
    <div className="shop-page">
      <aside className="filters">
        <ProductFilters />
      </aside>
      
      <main className="products">
        <div className="product-grid">
          {products.data.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
        <Pagination 
          current={products.pagination.page}
          total={products.pagination.pages}
        />
      </main>
    </div>
  )
}
```

### Rich Text Rendering

Text blocks and other content types now use rich HTML formatting from the Tiptap editor. When rendering in your frontend:

```tsx
// Rich text styling with Tailwind Typography
import '@tailwindcss/typography'

function RichTextRenderer({ content }: { content: string }) {
  return (
    <div 
      className="prose prose-lg max-w-none 
                 prose-headings:font-bold prose-headings:text-gray-900
                 prose-p:text-gray-700 prose-p:leading-relaxed
                 prose-strong:text-gray-900 prose-strong:font-semibold
                 prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800
                 prose-ul:list-disc prose-ol:list-decimal
                 prose-li:my-2 prose-blockquote:border-l-4 prose-blockquote:border-gray-300
                 prose-blockquote:pl-4 prose-blockquote:italic"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

// Usage in components
function TextBlock({ content }: { content: TextBlockContent }) {
  return (
    <section className="text-block py-8">
      <div className="container mx-auto px-4">
        <RichTextRenderer content={content.text} />
      </div>
    </section>
  )
}
```

**Security Note:** The `dangerouslySetInnerHTML` is safe here because:
- Content is created through the dashboard's Tiptap editor
- Tiptap sanitizes HTML by default
- Only trusted users have access to the dashboard
- Content goes through the CMS moderation workflow

## Best Practices

### 1. Caching Strategy

```typescript
// lib/cache.ts - Same caching strategy as dashboard
const cache = new Map()

export function getCachedData(key: string) {
  const item = cache.get(key)
  if (item && Date.now() < item.expires) {
    return item.data
  }
  cache.delete(key)
  return null
}

export function setCachedData(key: string, data: any, ttlSeconds: number) {
  cache.set(key, {
    data,
    expires: Date.now() + (ttlSeconds * 1000)
  })
}

// Usage in API routes
export async function GET() {
  const cacheKey = 'products:all'
  let products = getCachedData(cacheKey)
  
  if (!products) {
    products = await fetchProductsFromDB()
    setCachedData(cacheKey, products, 300) // 5 minutes TTL
  }
  
  return Response.json(products)
}
```

### 2. Error Handling

```typescript
// lib/api-client.ts
export async function apiCall(endpoint: string, options?: RequestInit) {
  try {
    const response = await fetch(`/api${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      ...options
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'API call failed')
    }
    
    return data
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error)
    throw error
  }
}
```

### 3. SEO Optimization

```typescript
// lib/seo.ts
export function generateMetadata(content: CMSContent) {
  return {
    title: content.seo?.title || content.title,
    description: content.seo?.description || content.title,
    keywords: content.seo?.keywords?.join(', '),
    openGraph: {
      title: content.seo?.ogTitle || content.seo?.title || content.title,
      description: content.seo?.ogDescription || content.seo?.description,
      images: content.seo?.ogImage ? [content.seo.ogImage] : undefined
    },
    robots: {
      index: !content.seo?.noIndex,
      follow: !content.seo?.noIndex
    },
    alternates: {
      canonical: content.seo?.canonicalUrl
    }
  }
}
```

### 4. Type Safety

```typescript
// types/ecommerce.ts - Extend dashboard types
import type { Product, ProductVariant, CMSContent } from '@/types'

export interface EnrichedProduct extends Product {
  variants: ProductVariant[]
  avgRating: number
  reviewCount: number
  minPrice: number
  maxPrice: number
}

export interface CartItem {
  variantId: string
  quantity: number
  product: Product
  variant: ProductVariant
}

export interface Order {
  items: CartItem[]
  total: number
  shipping: Address
  // ... other order fields
}
```

## Performance Optimization

### 1. Database Query Optimization

```typescript
// Efficient product fetching with aggregation
export async function fetchProductsOptimized() {
  const db = await getDatabase()
  
  const pipeline = [
    // Match published products only
    { $match: { status: 'published' } },
    
    // Lookup variants
    {
      $lookup: {
        from: 'productvariants',
        localField: 'id',
        foreignField: 'productId',
        as: 'variants'
      }
    },
    
    // Lookup reviews
    {
      $lookup: {
        from: 'reviews',
        localField: 'id',
        foreignField: 'productId',
        as: 'reviews',
        pipeline: [{ $match: { isApproved: true } }]
      }
    },
    
    // Calculate aggregated fields
    {
      $addFields: {
        avgRating: { $avg: '$reviews.rating' },
        reviewCount: { $size: '$reviews' },
        minPrice: { $min: '$variants.price' },
        maxPrice: { $max: '$variants.price' }
      }
    }
  ]
  
  return db.collection('products').aggregate(pipeline).toArray()
}
```

### 2. Image Optimization

```typescript
// Next.js Image component with Cloudflare
import Image from 'next/image'

export function OptimizedProductImage({ 
  src, 
  alt, 
  width, 
  height 
}: {
  src: string
  alt: string
  width: number
  height: number
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      loader={({ src, width, quality }) => {
        const url = new URL(src)
        url.searchParams.set('width', width.toString())
        url.searchParams.set('quality', (quality || 75).toString())
        url.searchParams.set('format', 'webp')
        return url.toString()
      }}
    />
  )
}
```

### 3. API Route Caching

```typescript
// app/api/products/route.ts with Next.js caching
export async function GET() {
  const products = await fetchProductsOptimized()
  
  return Response.json(products, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    }
  })
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 300 // Revalidate every 5 minutes
```

---

This integration guide provides a complete foundation for consuming dashboard-managed content in your ecommerce Next.js application. The shared MongoDB database ensures real-time content updates, while the caching strategies maintain optimal performance. All content types - products, CMS pages, and media assets - are fully accessible through the documented APIs and patterns.