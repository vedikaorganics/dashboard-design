import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { AUTHORS_COLLECTION } from '@/lib/authors/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { db } = await connectToDatabase()
    const { slug } = await params
    
    // Verify author exists
    const author = await db.collection(AUTHORS_COLLECTION)
      .findOne({ slug })
    
    if (!author) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '10'))
    const skip = (page - 1) * limit
    
    // Get posts by this author
    const [posts, totalCount] = await Promise.all([
      db.collection('cms_content')
        .find({ 
          authorSlug: slug,
          type: 'blog'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('cms_content').countDocuments({ 
        authorSlug: slug,
        type: 'blog'
      })
    ])
    
    return NextResponse.json({
      posts,
      author,
      pagination: {
        page,
        pageSize: limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      }
    })
  } catch (error) {
    console.error('Error fetching author posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch author posts' },
      { status: 500 }
    )
  }
}