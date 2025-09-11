import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { getCurrentUserName } from '@/lib/auth-utils'
import { AUTHORS_COLLECTION } from '@/lib/authors/utils'
import type { AuthorStatsUpdate } from '@/types/authors'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { db } = await connectToDatabase()
    const { slug } = await params
    
    const body: AuthorStatsUpdate = await request.json()
    
    // Get current user info for audit trail
    const updatedBy = await getCurrentUserName(request)
    
    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
      updatedBy
    }
    
    // Update stats fields if provided
    if (body.postCount !== undefined) {
      updateData['stats.postCount'] = body.postCount
    }
    if (body.totalViews !== undefined) {
      updateData['stats.totalViews'] = body.totalViews
    }
    if (body.lastPublished !== undefined) {
      updateData['stats.lastPublished'] = new Date(body.lastPublished)
    }
    
    // Update author stats
    const result = await db.collection(AUTHORS_COLLECTION)
      .findOneAndUpdate(
        { slug },
        { $set: updateData },
        { returnDocument: 'after' }
      )
    
    if (!result) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating author stats:', error)
    return NextResponse.json(
      { error: 'Failed to update author stats' },
      { status: 500 }
    )
  }
}

// Helper function to recalculate author stats from actual posts
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { db } = await connectToDatabase()
    const { slug } = await params
    
    // Get current user info for audit trail
    const updatedBy = await getCurrentUserName(request)
    
    // Calculate stats from actual posts
    const [postStats] = await db.collection('cms_content').aggregate([
      {
        $match: {
          authorSlug: slug,
          type: 'blog'
        }
      },
      {
        $group: {
          _id: null,
          postCount: { $sum: 1 },
          totalViews: { $sum: { $ifNull: ['$views', 0] } },
          lastPublished: { $max: '$publishedAt' }
        }
      }
    ]).toArray()
    
    const stats = postStats || {
      postCount: 0,
      totalViews: 0,
      lastPublished: null
    }
    
    // Update author with calculated stats
    const result = await db.collection(AUTHORS_COLLECTION)
      .findOneAndUpdate(
        { slug },
        { 
          $set: {
            'stats.postCount': stats.postCount,
            'stats.totalViews': stats.totalViews,
            'stats.lastPublished': stats.lastPublished,
            updatedAt: new Date(),
            updatedBy
          }
        },
        { returnDocument: 'after' }
      )
    
    if (!result) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error recalculating author stats:', error)
    return NextResponse.json(
      { error: 'Failed to recalculate author stats' },
      { status: 500 }
    )
  }
}