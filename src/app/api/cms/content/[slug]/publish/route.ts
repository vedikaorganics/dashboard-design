import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { PublishContentRequest } from '@/types/cms'
import { getCurrentUserId } from '@/lib/auth-utils'

interface Params {
  slug: string
}

// POST /api/cms/content/[slug]/publish - Publish content
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug } = await params
    const body: PublishContentRequest = await request.json()
    
    const db = await getDatabase()
    const collection = db.collection('cms_content')
    
    // Get latest version of content
    const currentContent = await collection.findOne({ slug }, { sort: { version: -1 } })
    
    if (!currentContent) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      )
    }
    
    const now = new Date()
    const publishAt = body.publishAt ? new Date(body.publishAt) : now
    const userId = await getCurrentUserId(request)
    
    // Prepare status and publish data
    const status = publishAt > now ? 'draft' : 'published'
    const publishedAt = publishAt > now ? undefined : publishAt
    const scheduledPublishAt = publishAt > now ? publishAt : undefined
    
    // Refined approach: Only change status for draft versions
    // Publishing a draft just updates the status in-place
    const updateData: any = {
      status,
      updatedBy: userId,
      updatedAt: now
    }
    
    if (publishedAt) {
      updateData.publishedAt = publishedAt
    }
    if (scheduledPublishAt) {
      updateData.scheduledPublishAt = scheduledPublishAt
    }
    
    // Update current version in-place (publishing a draft doesn't create new version)
    const result = await collection.updateOne(
      { slug, version: currentContent.version },
      { $set: updateData }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      )
    }
    
    // Return the updated content
    const updatedContent = await collection.findOne({ slug, version: currentContent.version })
    
    return NextResponse.json({
      success: true,
      data: updatedContent,
      message: publishAt > now ? 'Content scheduled for publishing' : 'Content published successfully'
    })
  } catch (error) {
    console.error('Failed to publish CMS content:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to publish content' },
      { status: 500 }
    )
  }
}

// DELETE /api/cms/content/[slug]/publish - Unpublish content
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug } = await params
    
    const db = await getDatabase()
    const collection = db.collection('cms_content')
    
    // Get latest version of content
    const currentContent = await collection.findOne({ slug }, { sort: { version: -1 } })
    
    if (!currentContent) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      )
    }
    
    const now = new Date()
    const userId = await getCurrentUserId(request)
    
    // Simple approach: Just update the current version status to draft
    const updateData: any = {
      status: 'draft',
      publishedAt: undefined,
      scheduledPublishAt: undefined,
      updatedBy: userId,
      updatedAt: now
    }
    
    const result = await collection.updateOne(
      { slug, version: currentContent.version },
      { $set: updateData, $unset: { publishedAt: 1, scheduledPublishAt: 1 } }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      )
    }
    
    // Return the updated content
    const updatedContent = await collection.findOne({ slug, version: currentContent.version })
    
    return NextResponse.json({
      success: true,
      data: updatedContent,
      message: 'Content unpublished successfully'
    })
  } catch (error) {
    console.error('Failed to unpublish CMS content:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to unpublish content' },
      { status: 500 }
    )
  }
}