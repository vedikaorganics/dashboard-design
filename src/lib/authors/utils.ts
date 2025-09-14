import { Db } from 'mongodb'
import type { Author } from '@/types/authors'

export const AUTHORS_COLLECTION = 'cms_authors'

export function generateSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function validateSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - in production, use a proper sanitization library
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
}

export async function createIndexes(db: Db) {
  const collection = db.collection(AUTHORS_COLLECTION)
  
  // Create indexes for optimal query performance
  await collection.createIndexes([
    {
      key: { slug: 1 },
      unique: true,
      name: 'slug_unique'
    },
    {
      key: { displayName: 1 },
      name: 'displayName_1'
    },
    {
      key: { status: 1 },
      name: 'status_1'
    },
    {
      key: { featured: 1 },
      name: 'featured_1'
    },
    {
      key: { 'stats.postCount': -1 },
      name: 'stats_postCount_-1'
    },
    {
      key: { createdAt: -1 },
      name: 'createdAt_-1'
    },
    {
      key: { updatedAt: -1 },
      name: 'updatedAt_-1'
    },
    {
      key: { 
        displayName: 'text',
        bio: 'text',
        'expertise': 'text'
      },
      name: 'text_search'
    }
  ])
}

export function buildSearchQuery(search?: string) {
  if (!search?.trim()) return {}
  
  return {
    $or: [
      { displayName: { $regex: search, $options: 'i' } },
      { bio: { $regex: search, $options: 'i' } },
      { expertise: { $in: [new RegExp(search, 'i')] } },
      { email: { $regex: search, $options: 'i' } }
    ]
  }
}

export function buildSortQuery(sort?: string, order?: string): Record<string, 1 | -1> {
  const sortOrder: 1 | -1 = order === 'desc' ? -1 : 1
  
  switch (sort) {
    case 'name':
      return { displayName: sortOrder }
    case 'postCount':
      return { 'stats.postCount': sortOrder }
    case 'lastPublished':
      return { 'stats.lastPublished': sortOrder }
    case 'createdAt':
      return { createdAt: sortOrder }
    default:
      return { createdAt: -1 } // Default sort by newest first
  }
}

export function prepareAuthorForSave(author: Partial<Author>): Partial<Author> {
  const now = new Date()
  
  const prepared: Partial<Author> = {
    ...author,
    updatedAt: now
  }
  
  // Sanitize bio if provided
  if (author.bio) {
    prepared.bio = sanitizeHtml(author.bio)
  }
  
  // Generate slug if displayName provided but no slug
  if (author.displayName && !author.slug) {
    prepared.slug = generateSlug(author.displayName)
  }
  
  // Validate slug if provided
  if (prepared.slug && !validateSlug(prepared.slug)) {
    throw new Error('Invalid slug format. Use lowercase letters, numbers, and hyphens only.')
  }
  
  // Set defaults for new authors
  if (!author._id) {
    prepared.createdAt = now
    prepared.status = prepared.status || 'active'
    prepared.featured = prepared.featured || false
    prepared.stats = {
      postCount: 0,
      totalViews: 0,
      ...prepared.stats
    }
  }
  
  return prepared
}