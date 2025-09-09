# Blog Frontend Implementation Guide

This guide provides comprehensive instructions for implementing blog pages on your frontend website using the CMS data from this dashboard.

## Table of Contents

1. [API Integration](#api-integration)
2. [Data Structure](#data-structure)
3. [Frontend Components](#frontend-components)
4. [Content Block Rendering](#content-block-rendering)
5. [Blog Features](#blog-features)
6. [SEO Implementation](#seo-implementation)
7. [Performance Optimization](#performance-optimization)
8. [Example Code](#example-code)

## API Integration

### Base API Endpoint
```
GET /api/cms/content
```

### Blog Posts Endpoints

#### 1. Fetch All Blog Posts
```javascript
// Fetch published blog posts with pagination
const fetchBlogPosts = async (options = {}) => {
  const params = new URLSearchParams({
    type: 'blog',
    status: 'published',
    publicView: 'true',
    page: options.page || '1',
    limit: options.limit || '20',
    ...options.filters
  })
  
  const response = await fetch(`/api/cms/content?${params}`)
  const data = await response.json()
  
  return data
}

// Example usage:
const blogPosts = await fetchBlogPosts({
  page: '1',
  limit: '10',
  filters: {
    pageType: 'health-wellness', // Category filter
    search: 'organic recipes'     // Search filter
  }
})
```

#### 2. Fetch Single Blog Post
```javascript
const fetchBlogPost = async (slug) => {
  const response = await fetch(`/api/cms/content/${slug}`)
  const data = await response.json()
  
  if (data.success && data.data.status === 'published') {
    return data.data
  }
  throw new Error('Blog post not found')
}
```

#### 3. Fetch Blog Posts by Category
```javascript
const fetchBlogsByCategory = async (categorySlug, page = 1) => {
  return fetchBlogPosts({
    page: page.toString(),
    filters: { pageType: categorySlug }
  })
}
```

## Data Structure

### Blog Post Object
```typescript
interface BlogPost {
  _id: string
  slug: string                    // URL slug (e.g., "my-first-blog-post")
  type: "blog"
  title: string                   // Blog post title
  status: "published"             // Only published posts on frontend
  publishedAt: string            // ISO date string
  
  // Blog-specific fields
  blogCategory: string           // Category slug (e.g., "health-wellness")
  blogTags: string[]            // Array of tags
  blogAuthor: string            // Author name
  blogFeaturedImage: string     // Featured image URL
  blogExcerpt: string           // Short description
  blogReadTime: number          // Estimated read time in minutes
  
  // Content
  blocks: ContentBlock[]        // Array of content blocks
  
  // SEO
  seo: {
    title: string
    description: string
    keywords: string[]
    ogImage?: string
    ogTitle?: string
    ogDescription?: string
  }
  
  // Metadata
  createdAt: string
  updatedAt: string
}
```

### Content Blocks
```typescript
interface ContentBlock {
  id: string
  type: "text" | "image" | "gallery" | "video" | "custom-html"
  order: number
  content: BlockContent
}

// Text Block (most common for blogs)
interface TextBlockContent {
  text: string              // Rich HTML content
  alignment?: "left" | "center" | "right" | "justify"
}
```

### Blog Categories
```typescript
const BLOG_CATEGORIES = [
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
  // ... more categories
]
```

## Frontend Components

### 1. Blog Listing Page (`/blog`)

```jsx
// pages/blog.js or app/blog/page.js
import { useState, useEffect } from 'react'
import BlogCard from '../components/BlogCard'
import CategoryFilter from '../components/CategoryFilter'
import Pagination from '../components/Pagination'

export default function BlogPage({ initialPosts, categories }) {
  const [posts, setPosts] = useState(initialPosts?.content || [])
  const [pagination, setPagination] = useState(initialPosts?.pagination || {})
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const fetchPosts = async (category, page) => {
    const filters = category !== 'all' ? { pageType: category } : {}
    const data = await fetchBlogPosts({ page: page.toString(), filters })
    
    if (data.success) {
      setPosts(data.data.content)
      setPagination(data.data.pagination)
    }
  }

  useEffect(() => {
    fetchPosts(selectedCategory, currentPage)
  }, [selectedCategory, currentPage])

  return (
    <div className="blog-page">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Blog</h1>
        
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {posts.map(post => (
            <BlogCard key={post._id} post={post} />
          ))}
        </div>
        
        <Pagination
          pagination={pagination}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  )
}

// For Next.js App Router or getServerSideProps
export async function getServerSideProps() {
  const initialPosts = await fetchBlogPosts({ limit: '9' })
  const categories = BLOG_CATEGORIES
  
  return {
    props: {
      initialPosts: initialPosts.success ? initialPosts.data : null,
      categories
    }
  }
}
```

### 2. Individual Blog Post Page (`/blog/[slug]`)

```jsx
// pages/blog/[slug].js or app/blog/[slug]/page.js
import BlogContent from '../../components/BlogContent'
import BlogHeader from '../../components/BlogHeader'
import BlogSEO from '../../components/BlogSEO'
import RelatedPosts from '../../components/RelatedPosts'

export default function BlogPostPage({ post, relatedPosts }) {
  if (!post) {
    return <div>Blog post not found</div>
  }

  return (
    <>
      <BlogSEO post={post} />
      
      <article className="blog-post">
        <div className="container mx-auto px-4 py-8">
          <BlogHeader post={post} />
          
          <div className="prose prose-lg max-w-4xl mx-auto">
            <BlogContent blocks={post.blocks} />
          </div>
          
          <RelatedPosts
            currentPost={post}
            posts={relatedPosts}
          />
        </div>
      </article>
    </>
  )
}

export async function getServerSideProps({ params }) {
  try {
    const post = await fetchBlogPost(params.slug)
    
    // Fetch related posts (same category, different post)
    const relatedData = await fetchBlogsByCategory(post.blogCategory, 1)
    const relatedPosts = relatedData.success 
      ? relatedData.data.content.filter(p => p._id !== post._id).slice(0, 3)
      : []

    return {
      props: {
        post,
        relatedPosts
      }
    }
  } catch (error) {
    return {
      notFound: true
    }
  }
}
```

### 3. Blog Card Component

```jsx
// components/BlogCard.js
import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from '../utils/dateUtils'
import CategoryBadge from './CategoryBadge'

export default function BlogCard({ post }) {
  return (
    <article className="blog-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {post.blogFeaturedImage && (
        <div className="aspect-video relative">
          <Image
            src={post.blogFeaturedImage}
            alt={post.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <CategoryBadge categorySlug={post.blogCategory} />
          {post.blogReadTime && (
            <span className="text-sm text-gray-600">
              {post.blogReadTime} min read
            </span>
          )}
        </div>
        
        <h2 className="text-xl font-bold mb-2 hover:text-blue-600">
          <Link href={`/blog/${post.slug}`}>
            {post.title}
          </Link>
        </h2>
        
        {post.blogExcerpt && (
          <p className="text-gray-600 mb-4 line-clamp-3">
            {post.blogExcerpt}
          </p>
        )}
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>By {post.blogAuthor}</span>
          <time dateTime={post.publishedAt}>
            {formatDate(post.publishedAt)}
          </time>
        </div>
      </div>
    </article>
  )
}
```

## Content Block Rendering

### Blog Content Renderer

```jsx
// components/BlogContent.js
import BlockRenderer from './BlockRenderer'

export default function BlogContent({ blocks }) {
  // Sort blocks by order
  const sortedBlocks = blocks.sort((a, b) => a.order - b.order)
  
  return (
    <div className="blog-content">
      {sortedBlocks.map(block => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </div>
  )
}
```

### Block Renderer Component

```jsx
// components/BlockRenderer.js
import TextBlock from './blocks/TextBlock'
import ImageBlock from './blocks/ImageBlock'
import GalleryBlock from './blocks/GalleryBlock'
import VideoBlock from './blocks/VideoBlock'
import CustomHTMLBlock from './blocks/CustomHTMLBlock'

export default function BlockRenderer({ block }) {
  switch (block.type) {
    case 'text':
      return <TextBlock content={block.content} />
    case 'image':
      return <ImageBlock content={block.content} />
    case 'gallery':
      return <GalleryBlock content={block.content} />
    case 'video':
      return <VideoBlock content={block.content} />
    case 'custom-html':
      return <CustomHTMLBlock content={block.content} />
    default:
      return null
  }
}
```

### Text Block (Most Important for Blogs)

```jsx
// components/blocks/TextBlock.js
export default function TextBlock({ content }) {
  const { text, alignment = 'left' } = content
  
  return (
    <div 
      className={`text-block text-${alignment} mb-6`}
      dangerouslySetInnerHTML={{ __html: text }}
    />
  )
}
```

### Image Block

```jsx
// components/blocks/ImageBlock.js
import Image from 'next/image'

export default function ImageBlock({ content }) {
  const { src, alt, caption, link } = content
  const imageUrl = typeof src === 'string' ? src : src.mobile.url
  
  const ImageElement = (
    <div className="image-block mb-6">
      <div className="relative">
        <Image
          src={imageUrl}
          alt={alt}
          width={800}
          height={400}
          className="w-full h-auto rounded-lg"
        />
      </div>
      {caption && (
        <p className="text-sm text-gray-600 mt-2 text-center italic">
          {caption}
        </p>
      )}
    </div>
  )
  
  if (link) {
    return <a href={link} target="_blank" rel="noopener noreferrer">{ImageElement}</a>
  }
  
  return ImageElement
}
```

## Blog Features

### 1. Category Filter Component

```jsx
// components/CategoryFilter.js
import { BLOG_CATEGORIES } from '../constants/blogCategories'

export default function CategoryFilter({ selected, onSelect }) {
  return (
    <div className="category-filter mb-8">
      <h3 className="text-lg font-semibold mb-4">Categories</h3>
      <div className="flex flex-wrap gap-2">
        <button
          className={`px-4 py-2 rounded-full border ${
            selected === 'all' 
              ? 'bg-blue-500 text-white border-blue-500' 
              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
          }`}
          onClick={() => onSelect('all')}
        >
          All Posts
        </button>
        
        {BLOG_CATEGORIES.map(category => (
          <button
            key={category.slug}
            className={`px-4 py-2 rounded-full border ${
              selected === category.slug
                ? 'text-white border-transparent'
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
            }`}
            style={{
              backgroundColor: selected === category.slug ? category.color : undefined
            }}
            onClick={() => onSelect(category.slug)}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  )
}
```

### 2. Search Functionality

```jsx
// components/BlogSearch.js
import { useState } from 'react'

export default function BlogSearch({ onSearch }) {
  const [query, setQuery] = useState('')
  
  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(query)
  }
  
  return (
    <form onSubmit={handleSubmit} className="blog-search mb-8">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search blog posts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Search
        </button>
      </div>
    </form>
  )
}
```

### 3. Related Posts Component

```jsx
// components/RelatedPosts.js
import BlogCard from './BlogCard'

export default function RelatedPosts({ currentPost, posts }) {
  if (!posts.length) return null
  
  return (
    <section className="related-posts mt-16">
      <h3 className="text-2xl font-bold mb-8">Related Posts</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map(post => (
          <BlogCard key={post._id} post={post} />
        ))}
      </div>
    </section>
  )
}
```

## SEO Implementation

### 1. Blog SEO Component

```jsx
// components/BlogSEO.js
import Head from 'next/head'

export default function BlogSEO({ post }) {
  const seo = post.seo || {}
  const title = seo.title || post.title
  const description = seo.description || post.blogExcerpt
  const image = seo.ogImage || post.blogFeaturedImage
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`
  
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Keywords */}
      {seo.keywords?.length && (
        <meta name="keywords" content={seo.keywords.join(', ')} />
      )}
      
      {/* Open Graph */}
      <meta property="og:title" content={seo.ogTitle || title} />
      <meta property="og:description" content={seo.ogDescription || description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="article" />
      {image && <meta property="og:image" content={image} />}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
      
      {/* Article specific meta */}
      <meta property="article:published_time" content={post.publishedAt} />
      <meta property="article:modified_time" content={post.updatedAt} />
      <meta property="article:author" content={post.blogAuthor} />
      
      {/* Tags */}
      {post.blogTags?.map(tag => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": title,
            "description": description,
            "image": image,
            "author": {
              "@type": "Person",
              "name": post.blogAuthor
            },
            "publisher": {
              "@type": "Organization",
              "name": "Your Site Name",
              "logo": {
                "@type": "ImageObject",
                "url": `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`
              }
            },
            "datePublished": post.publishedAt,
            "dateModified": post.updatedAt,
            "url": url
          })
        }}
      />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
    </Head>
  )
}
```

### 2. Blog Sitemap Generation

```javascript
// utils/generateSitemap.js
export async function generateBlogSitemap() {
  const posts = await fetchBlogPosts({ limit: '1000' }) // Get all posts
  
  if (!posts.success) return ''
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${posts.data.content.map(post => `
        <url>
          <loc>${baseUrl}/blog/${post.slug}</loc>
          <lastmod>${post.updatedAt}</lastmod>
          <changefreq>monthly</changefreq>
          <priority>0.7</priority>
        </url>
      `).join('')}
    </urlset>`
  
  return sitemap
}
```

## Performance Optimization

### 1. Image Optimization

```jsx
// components/OptimizedImage.js
import Image from 'next/image'

export default function OptimizedImage({ src, alt, ...props }) {
  // Handle both old string format and new object format
  const imageUrl = typeof src === 'string' ? src : src.mobile.url
  const dimensions = typeof src === 'object' ? src.mobile.dimensions : null
  
  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={dimensions?.width || 800}
      height={dimensions?.height || 400}
      className="w-full h-auto"
      loading="lazy"
      {...props}
    />
  )
}
```

### 2. Caching Strategy

```javascript
// utils/cache.js
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function getCached(key) {
  const item = cache.get(key)
  if (!item) return null
  
  if (Date.now() > item.expiry) {
    cache.delete(key)
    return null
  }
  
  return item.data
}

export function setCache(key, data) {
  cache.set(key, {
    data,
    expiry: Date.now() + CACHE_TTL
  })
}

// Usage in API calls
export async function fetchBlogPostsCached(options = {}) {
  const cacheKey = `blogs-${JSON.stringify(options)}`
  
  let data = getCached(cacheKey)
  if (data) return data
  
  data = await fetchBlogPosts(options)
  if (data.success) {
    setCache(cacheKey, data)
  }
  
  return data
}
```

### 3. Static Generation (Next.js)

```javascript
// pages/blog/[slug].js - Static generation for better performance
export async function getStaticPaths() {
  const posts = await fetchBlogPosts({ limit: '100' })
  
  const paths = posts.success 
    ? posts.data.content.map(post => ({ params: { slug: post.slug } }))
    : []
  
  return {
    paths,
    fallback: 'blocking'
  }
}

export async function getStaticProps({ params }) {
  try {
    const post = await fetchBlogPost(params.slug)
    
    return {
      props: { post },
      revalidate: 3600 // Revalidate every hour
    }
  } catch (error) {
    return { notFound: true }
  }
}
```

## Example Code

### Complete Blog Index Page

```jsx
// pages/blog/index.js
import { useState, useEffect } from 'react'
import Head from 'next/head'
import BlogCard from '../../components/BlogCard'
import CategoryFilter from '../../components/CategoryFilter'
import BlogSearch from '../../components/BlogSearch'
import Pagination from '../../components/Pagination'
import { fetchBlogPosts } from '../../utils/api'
import { BLOG_CATEGORIES } from '../../constants/blogCategories'

export default function BlogIndex({ initialPosts, categories }) {
  const [posts, setPosts] = useState(initialPosts?.content || [])
  const [pagination, setPagination] = useState(initialPosts?.pagination || {})
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const fetchPosts = async (category, search, page) => {
    setLoading(true)
    
    const filters = {}
    if (category !== 'all') filters.pageType = category
    if (search) filters.search = search
    
    const data = await fetchBlogPosts({ 
      page: page.toString(), 
      filters 
    })
    
    if (data.success) {
      setPosts(data.data.content)
      setPagination(data.data.pagination)
    }
    
    setLoading(false)
  }

  useEffect(() => {
    fetchPosts(selectedCategory, searchQuery, currentPage)
  }, [selectedCategory, searchQuery, currentPage])

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  return (
    <>
      <Head>
        <title>Blog - Your Site Name</title>
        <meta name="description" content="Read our latest articles about organic living, recipes, and sustainability." />
      </Head>
      
      <div className="blog-index">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Our Blog</h1>
            <p className="text-xl text-gray-600">
              Discover organic living tips, recipes, and sustainability insights
            </p>
          </header>
          
          <div className="mb-8">
            <BlogSearch onSearch={handleSearch} />
            <CategoryFilter
              categories={categories}
              selected={selectedCategory}
              onSelect={handleCategoryChange}
            />
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-96 animate-pulse" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-2xl font-bold mb-4">No posts found</h3>
              <p className="text-gray-600">
                {searchQuery ? 'Try adjusting your search.' : 'Check back later for new content.'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {posts.map(post => (
                  <BlogCard key={post._id} post={post} />
                ))}
              </div>
              
              <Pagination
                pagination={pagination}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>
    </>
  )
}

export async function getServerSideProps() {
  const initialPosts = await fetchBlogPosts({ limit: '9' })
  
  return {
    props: {
      initialPosts: initialPosts.success ? initialPosts.data : null,
      categories: BLOG_CATEGORIES
    }
  }
}
```

## Utility Functions

### Date Formatting

```javascript
// utils/dateUtils.js
export function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatDateWithTime(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
```

### Text Utilities

```javascript
// utils/textUtils.js
export function truncateText(text, length = 150) {
  if (text.length <= length) return text
  return text.substring(0, length).trim() + '...'
}

export function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '')
}

export function calculateReadTime(text) {
  const wordsPerMinute = 200
  const words = stripHtml(text).split(/\s+/).length
  return Math.max(1, Math.ceil(words / wordsPerMinute))
}
```

## Cache Revalidation System

The dashboard automatically triggers cache revalidation on your frontend website whenever blog content changes. This ensures your blog always displays the latest content without manual intervention.

### Frontend Revalidation Endpoint

You need to implement a `/api/revalidateBlog` endpoint on your frontend website to handle revalidation requests from the dashboard.

```javascript
// pages/api/revalidateBlog.js or app/api/revalidateBlog/route.js
import { revalidatePath, revalidateTag } from 'next/cache'

export async function POST(request) {
  try {
    // Verify authorization (use same key as PAYMENT_SERVER_API_KEY in dashboard)
    const authHeader = request.headers.get('authorization')
    const expectedAuth = `Bearer ${process.env.DASHBOARD_API_KEY}`
    
    if (authHeader !== expectedAuth) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug, authorSlug } = await request.json()

    if (!slug) {
      return Response.json({ error: 'slug is required' }, { status: 400 })
    }

    // Revalidate specific blog post page
    revalidatePath(`/blog/${slug}`)
    
    // Revalidate blog listing pages
    revalidatePath('/blog')
    
    // Revalidate author-specific pages if author provided
    if (authorSlug) {
      revalidatePath(`/blog/author/${authorSlug}`)
    }
    
    // Revalidate home page if it shows recent blog posts
    revalidatePath('/')
    
    // Alternative: Use tags for more granular control
    // revalidateTag('blog-posts')
    // revalidateTag(`blog-author-${authorSlug}`)
    // revalidateTag(`blog-post-${slug}`)

    console.log(`Revalidated blog paths for: ${slug}`)

    return Response.json({ 
      success: true, 
      revalidated: {
        slug,
        authorSlug,
        paths: [
          `/blog/${slug}`,
          '/blog',
          authorSlug ? `/blog/author/${authorSlug}` : null
        ].filter(Boolean)
      }
    })
  } catch (error) {
    console.error('Blog revalidation error:', error)
    return Response.json({ 
      error: 'Revalidation failed',
      details: error.message 
    }, { status: 500 })
  }
}
```

### Environment Configuration

Add the dashboard API key to your frontend's environment variables:

```bash
# .env.local
DASHBOARD_API_KEY=your_dashboard_api_key_here
```

This should match the `PAYMENT_SERVER_API_KEY` value in your dashboard's `.env` file.

### Revalidation Triggers

The dashboard automatically triggers revalidation when:

1. **Blog Created**: When a new blog post is created and published
2. **Blog Updated**: When an existing blog post is modified and is published
3. **Blog Published**: When a draft blog post is published
4. **Blog Unpublished**: When a published blog post is unpublished

### Advanced Revalidation with Tags

For more sophisticated caching, use Next.js cache tags:

```javascript
// In your blog fetching functions
export const fetchBlogPosts = cache(async (options = {}) => {
  const response = await fetch('/api/cms/content?type=blog&status=published', {
    next: { 
      tags: ['blog-posts', `blog-author-${options.author || 'all'}`],
      revalidate: 300 // 5 minutes fallback
    }
  })
  // ... rest of implementation
}, ['blog-posts'])

export const fetchBlogPost = cache(async (slug) => {
  const response = await fetch(`/api/cms/content/${slug}`, {
    next: { 
      tags: ['blog-posts', `blog-post-${slug}`],
      revalidate: 3600 // 1 hour fallback
    }
  })
  // ... rest of implementation
}, ['blog-post'])
```

Then update your revalidation endpoint:

```javascript
// More granular revalidation using tags
revalidateTag('blog-posts') // Revalidates all blog listings
revalidateTag(`blog-post-${slug}`) // Revalidates specific post
if (authorSlug) {
  revalidateTag(`blog-author-${authorSlug}`) // Revalidates author listings
}
```

### Testing Revalidation

To test the revalidation system:

1. Create or update a blog post in the dashboard
2. Check the dashboard logs for revalidation success/failure
3. Verify the frontend shows updated content immediately
4. Monitor your frontend logs for revalidation requests

### Troubleshooting

**Common Issues:**

1. **401 Unauthorized**: Check that `DASHBOARD_API_KEY` matches `PAYMENT_SERVER_API_KEY`
2. **Network Errors**: Ensure `NEXT_PUBLIC_PAYMENT_SERVER_URL` points to your frontend URL
3. **Partial Revalidation**: Add more specific paths based on your blog structure

**Debug Revalidation:**

```javascript
// Add logging to your revalidation endpoint
console.log('Revalidation request:', { slug, authorSlug })
console.log('Revalidating paths:', paths)

// Check revalidation in dashboard logs
// Look for: "Successfully revalidated blog: {slug}" or error messages
```

## Notes and Best Practices

1. **SEO Considerations**:
   - Always use server-side rendering for blog posts
   - Implement proper meta tags and structured data
   - Generate XML sitemaps for better indexing

2. **Performance**:
   - Use Next.js Image component for optimized images
   - Implement caching for API calls with revalidation tags
   - Consider static generation with on-demand revalidation

3. **Content Security**:
   - Sanitize HTML content from the CMS
   - Be careful with `dangerouslySetInnerHTML`
   - Consider using a library like DOMPurify

4. **Responsive Design**:
   - Ensure all components work on mobile devices
   - Use responsive images and layouts
   - Test on various screen sizes

5. **Error Handling**:
   - Handle API failures gracefully
   - Provide fallback content when needed
   - Show user-friendly error messages
   - Implement revalidation error handling

6. **Analytics**:
   - Track blog post views and engagement
   - Monitor search queries and popular categories
   - Use data to improve content strategy

7. **Cache Strategy**:
   - Use appropriate cache tags for granular revalidation
   - Set reasonable fallback revalidation times
   - Monitor cache hit/miss ratios

This guide provides a comprehensive foundation for implementing blog functionality with automatic cache revalidation on your frontend website. Adapt the code examples to match your specific framework and styling preferences.