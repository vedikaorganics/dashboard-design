import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { CMSContent } from '@/types/cms'

interface Params {
  slug: string
}

// GET /api/cms/content/[slug]/versions - Get all versions of content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const db = await getDatabase()
    const collection = db.collection('cms_content')
    
    // Get all versions for this slug, sorted by version descending
    const [versions, total] = await Promise.all([
      collection
        .find({ slug })
        .sort({ version: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      collection.countDocuments({ slug })
    ])
    
    if (versions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: {
        versions: versions as unknown as CMSContent[],
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Failed to fetch content versions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch versions' },
      { status: 500 }
    )
  }
}