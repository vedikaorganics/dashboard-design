import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { getCurrentUserId, getCurrentUserName } from '@/lib/auth-utils'
import { 
  AUTHORS_COLLECTION, 
  createIndexes, 
  buildSearchQuery, 
  buildSortQuery, 
  prepareAuthorForSave 
} from '@/lib/authors/utils'
import type { Author, CreateAuthorRequest, AuthorListResponse, AuthorQueryParams } from '@/types/authors'

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    
    // Ensure indexes exist
    await createIndexes(db)
    
    const { searchParams } = new URL(request.url)
    const params: AuthorQueryParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') as Author['status'] || undefined,
      featured: searchParams.get('featured') === 'true' ? true : undefined,
      role: searchParams.get('role') || undefined,
      sort: searchParams.get('sort') as any || 'createdAt',
      order: searchParams.get('order') as 'asc' | 'desc' || 'desc'
    }
    
    // Build query
    const query: any = {}
    
    // Add search filter
    if (params.search) {
      Object.assign(query, buildSearchQuery(params.search))
    }
    
    // Add status filter
    if (params.status) {
      query.status = params.status
    }
    
    // Add featured filter
    if (params.featured !== undefined) {
      query.featured = params.featured
    }
    
    // Add role filter
    if (params.role) {
      query.role = params.role
    }
    
    // Build sort
    const sort = buildSortQuery(params.sort, params.order)
    
    // Calculate pagination
    const page = Math.max(1, params.page || 1)
    const limit = Math.min(100, Math.max(1, params.limit || 10))
    const skip = (page - 1) * limit
    
    // Execute queries in parallel
    const [authors, totalCount] = await Promise.all([
      db.collection(AUTHORS_COLLECTION)
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection(AUTHORS_COLLECTION).countDocuments(query)
    ])
    
    const response: AuthorListResponse = {
      authors: authors as unknown as Author[],
      pagination: {
        page,
        pageSize: limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      }
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching authors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch authors' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    
    // Ensure indexes exist
    await createIndexes(db)
    
    const body: CreateAuthorRequest = await request.json()
    
    // Validate required fields
    if (!body.displayName?.trim()) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      )
    }
    
    // Get current user info for audit trail
    const createdBy = await getCurrentUserId(request)
    const updatedBy = await getCurrentUserName(request)
    
    // Prepare author data
    const authorData = prepareAuthorForSave({
      ...body,
      createdBy,
      updatedBy
    })
    
    // Check if slug already exists
    if (authorData.slug) {
      const existing = await db.collection(AUTHORS_COLLECTION)
        .findOne({ slug: authorData.slug })
      
      if (existing) {
        return NextResponse.json(
          { error: 'An author with this slug already exists' },
          { status: 409 }
        )
      }
    }
    
    // Remove _id field before inserting and cast to Document type
    const { _id, ...insertData } = authorData
    
    // Insert author
    const result = await db.collection(AUTHORS_COLLECTION)
      .insertOne(insertData as any)
    
    // Fetch the created author
    const createdAuthor = await db.collection(AUTHORS_COLLECTION)
      .findOne({ _id: result.insertedId })
    
    return NextResponse.json(createdAuthor, { status: 201 })
  } catch (error) {
    console.error('Error creating author:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create author' },
      { status: 500 }
    )
  }
}