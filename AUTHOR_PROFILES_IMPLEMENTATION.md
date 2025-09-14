# Author Profiles Implementation Plan (Standalone System)

## Design Philosophy
Authors will be a completely independent content entity, not tied to user authentication. This allows for:
- Guest authors without system accounts
- Multiple pen names for a single user
- Historical authors who never had accounts
- Simplified author management

## Proposed Author Profile System

### 1. Data Model Design

#### Author Profile Collection (`cms_authors`)
```typescript
interface Author {
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
```

#### Update Blog Content Model
```typescript
// Update CMSContent interface
interface CMSContent {
  // ... existing fields
  authorSlug?: string        // Reference to author by slug
  // ... rest of fields
}
```

### 2. UI Components & Pages

#### A. Author Management Pages (`/cms/authors/`)
```
/cms/authors                 - List all authors with search/filter
/cms/authors/new            - Create new author
/cms/authors/[slug]         - Edit author profile
/cms/authors/[slug]/posts   - View all posts by author
```

#### B. Blog Integration Updates
- **Author Selector** in blog editor sidebar (searchable dropdown)
- **Author Card** on blog posts showing avatar, name, and bio snippet
- **Author Attribution** with link to author's posts page

#### C. Component Architecture
```typescript
// Core Components
AuthorCard         - Compact author display (avatar, name, bio)
AuthorSelector     - Searchable dropdown for blog editor
AuthorProfile      - Full author profile display
AuthorGrid        - Grid layout for multiple authors
AuthorStats       - Statistics and metrics display
AuthorForm        - Create/edit form with all fields
AuthorMediaInput  - Avatar and cover image selection
```

### 3. API Endpoints

#### Authors API (`/api/cms/authors/`)
```
GET    /api/cms/authors           - List authors (pagination, search, filter)
POST   /api/cms/authors           - Create author
GET    /api/cms/authors/[slug]    - Get author details
PUT    /api/cms/authors/[slug]    - Update author
DELETE /api/cms/authors/[slug]    - Soft delete author
GET    /api/cms/authors/[slug]/posts - Get author's posts
PATCH  /api/cms/authors/[slug]/stats - Update author statistics
```

#### Query Parameters for List
- `search` - Search in name, bio, expertise
- `status` - Filter by status
- `featured` - Show only featured authors
- `role` - Filter by role
- `sort` - Sort by name, postCount, lastPublished
- `page`, `limit` - Pagination

### 4. Implementation Steps

#### Phase 1: Core Infrastructure (Day 1)
1. Create MongoDB collection `cms_authors` with indexes
2. Build author types and interfaces
3. Create CRUD API endpoints
4. Add author hooks for data fetching

#### Phase 2: Author Management UI (Day 2)
1. Build authors list page with DataTable
2. Create author form component
3. Implement create/edit pages
4. Add media selection for avatar/cover

#### Phase 3: Blog Integration (Day 3)
1. Create AuthorSelector component
2. Update BlogSidebar to use author selector
3. Modify blog save to include authorSlug
4. Update blog list to show author names

#### Phase 4: Migration & Display (Day 4)
1. Create migration script:
   - Extract unique blogAuthor values
   - Create author profiles for each
   - Update posts with authorSlug
2. Build author display components
3. Add author info to blog post pages

#### Phase 5: Enhanced Features (Day 5)
1. Author statistics tracking
2. Featured authors page
3. Author post archives
4. Bulk author operations
5. Author export/import

## File Structure
```
src/
├── app/
│   ├── api/cms/authors/
│   │   ├── route.ts                    # List/Create
│   │   └── [slug]/
│   │       ├── route.ts                # CRUD operations
│   │       ├── posts/route.ts          # Author's posts
│   │       └── stats/route.ts          # Update statistics
│   └── cms/authors/
│       ├── page.tsx                    # Authors list
│       ├── new/page.tsx                # Create author
│       └── [slug]/
│           ├── page.tsx                # Edit author
│           └── posts/page.tsx          # Author's posts
├── components/cms/authors/
│   ├── AuthorCard.tsx                  # Display card
│   ├── AuthorSelector.tsx              # Dropdown selector
│   ├── AuthorProfile.tsx               # Full profile
│   ├── AuthorForm.tsx                  # Create/edit form
│   ├── AuthorGrid.tsx                  # Grid layout
│   └── AuthorStats.tsx                 # Statistics
├── hooks/cms/
│   └── use-authors.ts                  # Author data hooks
├── types/
│   └── authors.ts                      # Author types
└── lib/
    └── authors/
        ├── migration.ts                 # Data migration
        └── utils.ts                     # Helper functions
```

## Migration Strategy
```javascript
// Automated migration process
1. Scan all blog posts for unique blogAuthor values
2. For each unique author name:
   - Generate slug from name
   - Create author profile with name
   - Set status to 'active'
3. Update all blog posts:
   - Set authorSlug based on blogAuthor match
   - Remove blogAuthor field after migration
4. Generate statistics for each author
```

## Author Selection Flow
1. **Creating Blog Post**: Select from existing authors or create new
2. **Editing Blog Post**: Change author with dropdown
3. **Author Management**: Full CRUD independent of posts
4. **Frontend Display**: Show author info with posts

## Benefits of Standalone System
- **Flexibility**: No authentication requirements
- **Simplicity**: Authors are just content entities
- **Portability**: Easy to import/export author data
- **Guest Authors**: Support external contributors
- **Multiple Personas**: One person can have multiple author profiles
- **Historical Content**: Add authors for old content
- **Clean Separation**: No auth system dependencies

## Usage Examples

### Creating an Author
```typescript
// POST /api/cms/authors
{
  "displayName": "Jane Smith",
  "slug": "jane-smith",
  "bio": "Tech writer and organic farming enthusiast",
  "email": "jane@example.com",
  "role": "Contributing Editor",
  "expertise": ["Technology", "Sustainability"],
  "featured": true
}
```

### Assigning to Blog Post
```typescript
// In blog editor
{
  "title": "10 Organic Farming Tips",
  "authorSlug": "jane-smith",  // Selected from dropdown
  // ... other fields
}
```

### Frontend Display
```typescript
// Author info automatically included when fetching blog
{
  "title": "10 Organic Farming Tips",
  "authorSlug": "jane-smith",
  "author": {  // Populated from authors collection
    "displayName": "Jane Smith",
    "avatar": "...",
    "bio": "..."
  }
}
```

## Database Indexes
```javascript
// Recommended indexes for cms_authors collection
{
  slug: 1,          // Unique index for URL lookups
  displayName: 1,   // For sorting and searching
  status: 1,        // For filtering active authors
  featured: 1,      // For featured authors queries
  "stats.postCount": -1,  // For sorting by popularity
  createdAt: -1     // For recent authors
}
```

## Frontend Integration Guide

### Fetching Author with Blog Post
```javascript
// API should populate author data when fetching blog
const fetchBlogPost = async (slug) => {
  const response = await fetch(`/api/cms/content/${slug}`)
  const data = await response.json()
  
  // Author data should be populated
  // data.author = full author object based on authorSlug
  return data
}
```

### Author Archive Page
```javascript
// Frontend route: /blog/authors/[slug]
const AuthorArchive = ({ authorSlug }) => {
  const [author, setAuthor] = useState(null)
  const [posts, setPosts] = useState([])
  
  useEffect(() => {
    // Fetch author details
    fetch(`/api/cms/authors/${authorSlug}`)
      .then(res => res.json())
      .then(data => setAuthor(data))
    
    // Fetch author's posts
    fetch(`/api/cms/authors/${authorSlug}/posts`)
      .then(res => res.json())
      .then(data => setPosts(data))
  }, [authorSlug])
  
  return (
    <div>
      <AuthorProfile author={author} />
      <BlogGrid posts={posts} />
    </div>
  )
}
```

### Authors Listing Page
```javascript
// Frontend route: /blog/authors
const AuthorsPage = () => {
  const [authors, setAuthors] = useState([])
  
  useEffect(() => {
    fetch('/api/cms/authors?featured=true&status=active')
      .then(res => res.json())
      .then(data => setAuthors(data.authors))
  }, [])
  
  return (
    <div className="authors-grid">
      {authors.map(author => (
        <AuthorCard key={author.slug} author={author} />
      ))}
    </div>
  )
}
```

## SEO Considerations

### Author Schema Markup
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Jane Smith",
  "url": "https://site.com/blog/authors/jane-smith",
  "image": "https://site.com/avatars/jane-smith.jpg",
  "sameAs": [
    "https://twitter.com/janesmith",
    "https://linkedin.com/in/janesmith"
  ],
  "jobTitle": "Contributing Editor",
  "worksFor": {
    "@type": "Organization",
    "name": "Your Company"
  }
}
```

### Meta Tags for Author Pages
```html
<meta property="og:type" content="profile" />
<meta property="og:title" content="Jane Smith - Author Profile" />
<meta property="og:description" content="Tech writer and organic farming enthusiast" />
<meta property="og:image" content="https://site.com/avatars/jane-smith.jpg" />
<meta property="profile:username" content="jane-smith" />
```

## Performance Optimizations

1. **Cache Author Data**: Cache author profiles for 5 minutes
2. **Batch Loading**: Load multiple authors in single query
3. **Lazy Load Stats**: Update statistics asynchronously
4. **CDN for Avatars**: Serve author images from CDN
5. **Index Optimization**: Proper database indexes for common queries

## Security Considerations

1. **Slug Validation**: Ensure slugs are URL-safe
2. **HTML Sanitization**: Sanitize bio content
3. **Image Validation**: Validate avatar/cover image URLs
4. **Rate Limiting**: Limit author creation requests
5. **Permission Checks**: Only admins can create/edit authors

## Testing Checklist

- [ ] Create new author profile
- [ ] Edit existing author
- [ ] Upload avatar and cover image
- [ ] Assign author to blog post
- [ ] View author profile page
- [ ] List all authors with pagination
- [ ] Search authors by name/bio
- [ ] Filter by status and role
- [ ] Migration from blogAuthor field
- [ ] Author statistics update
- [ ] Delete author (soft delete)
- [ ] Author social links display
- [ ] SEO meta tags generation
- [ ] Frontend author pages
- [ ] API response caching

## Future Enhancements

1. **Author Verification**: Verified badge for authenticated authors
2. **Author Following**: Users can follow authors
3. **Author Analytics**: Detailed analytics dashboard
4. **Co-Authors**: Support multiple authors per post
5. **Author Templates**: Different profile layouts
6. **Author API**: Public API for author data
7. **Author Webhooks**: Notify on author updates
8. **Author Import**: Bulk import from CSV/JSON
9. **Author Export**: Export author data
10. **Author Recommendations**: ML-based author suggestions