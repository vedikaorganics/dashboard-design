export interface Author {
  _id: string
  slug: string             // URL-friendly identifier (unique)
  displayName: string      // Public display name
  email?: string           // Public contact email (optional)
  bio: string              // Rich text biography
  avatar?: string          // Profile image URL
  coverImage?: string      // Header/banner image
  socialLinks?: {
    twitter?: string
    linkedin?: string
    github?: string
    website?: string
    instagram?: string
    facebook?: string
    youtube?: string
  }
  expertise?: string[]     // Areas of expertise/topics
  role?: string           // e.g., "Editor", "Contributor", "Guest Writer"
  featured: boolean       // Show prominently on authors page
  order?: number          // For manual sorting of featured authors
  
  // Statistics (cached for performance)
  stats?: {
    postCount: number
    totalViews?: number
    lastPublished?: Date
  }
  
  // Metadata
  metadata?: {
    location?: string
    company?: string
    jobTitle?: string
    languages?: string[]
    certifications?: string[]
  }
  
  // SEO
  seo?: {
    title?: string
    description?: string
    keywords?: string[]
  }
  
  status: 'active' | 'inactive' | 'archived'
  createdAt: Date
  updatedAt: Date
  createdBy?: string      // Who created this author profile
  updatedBy?: string      // Who last updated it
}

export interface CreateAuthorRequest {
  displayName: string
  slug?: string           // Auto-generated if not provided
  email?: string
  bio?: string
  avatar?: string
  coverImage?: string
  socialLinks?: Author['socialLinks']
  expertise?: string[]
  role?: string
  featured?: boolean
  order?: number
  metadata?: Author['metadata']
  seo?: Author['seo']
  status?: Author['status']
}

export interface UpdateAuthorRequest extends Partial<CreateAuthorRequest> {
  slug?: never // Slug cannot be updated after creation
}

export interface AuthorListResponse {
  authors: Author[]
  pagination: {
    page: number
    pageSize: number
    totalPages: number
    totalCount: number
  }
}

export interface AuthorStatsUpdate {
  postCount?: number
  totalViews?: number
  lastPublished?: Date
}

export interface AuthorQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: Author['status']
  featured?: boolean
  role?: string
  sort?: 'name' | 'postCount' | 'lastPublished' | 'createdAt'
  order?: 'asc' | 'desc'
}