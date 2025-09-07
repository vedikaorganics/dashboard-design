import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { CMSContent, CreateContentRequest, CMSContentListResponse } from '@/types/cms'
import { getCurrentUserId } from '@/lib/auth-utils'

// GET /api/cms/content - List all content with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type')
    const pageType = searchParams.get('pageType')
    const productId = searchParams.get('productId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const publicView = searchParams.get('publicView') === 'true'
    
    const db = await getDatabase()
    const collection = db.collection('cms_content')
    
    // Build aggregation pipeline to get latest version of each slug
    const matchStage: any = {}
    if (type) matchStage.type = type
    if (pageType) matchStage.pageType = pageType
    if (productId) matchStage.productId = productId
    if (publicView && !status) {
      // For public view, only show published content
      matchStage.status = 'published'
    } else if (status) {
      matchStage.status = status
    }
    if (search) {
      matchStage.$or = [
        { title: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ]
    }
    
    // Aggregation pipeline to get latest version of each slug
    const pipeline = [
      { $match: matchStage },
      { $sort: { slug: 1, version: -1 } },
      { $group: {
        _id: '$slug',
        latestDoc: { $first: '$$ROOT' }
      }},
      { $replaceRoot: { newRoot: '$latestDoc' } },
      { $sort: { updatedAt: -1 } }
    ]
    
    // Execute aggregation with pagination
    const [contentWithPagination, totalResult] = await Promise.all([
      collection.aggregate([
        ...pipeline,
        { $skip: (page - 1) * limit },
        { $limit: limit }
      ]).toArray(),
      collection.aggregate([
        ...pipeline,
        { $count: 'total' }
      ]).toArray()
    ])
    
    const content = contentWithPagination
    const total = totalResult[0]?.total || 0
    
    const response: CMSContentListResponse = {
      success: true,
      data: {
        content: content as unknown as CMSContent[],
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to fetch CMS content:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content' },
      { status: 500 }
    )
  }
}

// POST /api/cms/content - Create new content
export async function POST(request: NextRequest) {
  try {
    const body: CreateContentRequest = await request.json()
    
    // Basic validation
    if (!body.slug || !body.title || !body.type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: slug, title, type' },
        { status: 400 }
      )
    }

    // Validate product type requirements
    if (body.type === 'product' && !body.productId) {
      return NextResponse.json(
        { success: false, error: 'productId is required for product content' },
        { status: 400 }
      )
    }

    // Validate blog type requirements
    if (body.type === 'blog' && !body.blogCategory) {
      return NextResponse.json(
        { success: false, error: 'blogCategory is required for blog content' },
        { status: 400 }
      )
    }
    
    const db = await getDatabase()
    const collection = db.collection('cms_content')
    
    // Check if slug already exists (check latest version)
    const existing = await collection.findOne({ slug: body.slug }, { sort: { version: -1 } })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Content with this slug already exists' },
        { status: 409 }
      )
    }
    
    const now = new Date()
    const status = body.status || 'draft'
    const userId = await getCurrentUserId(request)
    
    // Calculate read time for blog posts
    let blogReadTime: number | undefined
    if (body.type === 'blog' && body.blocks) {
      const wordsPerMinute = 200
      let totalWords = 0
      
      body.blocks.forEach(block => {
        if (block.type === 'text' && (block.content as any)?.text) {
          const textContent = (block.content as any).text.replace(/<[^>]*>/g, '') // Remove HTML tags
          totalWords += textContent.split(/\s+/).length
        }
      })
      
      blogReadTime = Math.max(1, Math.ceil(totalWords / wordsPerMinute))
    }

    const content: Omit<CMSContent, '_id'> = {
      slug: body.slug,
      type: body.type,
      pageType: body.pageType,
      productId: body.productId,
      // Blog-specific fields
      ...(body.type === 'blog' && {
        blogCategory: body.blogCategory,
        blogTags: body.blogTags || [],
        blogAuthor: body.blogAuthor,
        blogFeaturedImage: body.blogFeaturedImage,
        blogExcerpt: body.blogExcerpt,
        blogReadTime
      }),
      title: body.title,
      status,
      publishedAt: status === 'published' ? now : undefined,
      blocks: body.blocks || [],
      seo: body.seo || {
        title: body.title,
        description: body.blogExcerpt || '',
        keywords: body.blogTags || []
      },
      // Always start with version 1
      version: 1,
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now
    }
    
    const result = await collection.insertOne(content)
    
    const createdContent = await collection.findOne({ _id: result.insertedId })
    
    return NextResponse.json({
      success: true,
      data: createdContent
    })
  } catch (error) {
    console.error('Failed to create CMS content:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create content' },
      { status: 500 }
    )
  }
}