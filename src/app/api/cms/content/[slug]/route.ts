import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { CMSContent, UpdateContentRequest, CMSContentResponse } from '@/types/cms'
import { getCurrentUserId } from '@/lib/auth-utils'
import { revalidateBlog } from '@/lib/revalidate'

interface Params {
  slug: string
}

// GET /api/cms/content/[slug] - Get specific content by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug } = await params
    
    // Convert special homepage placeholder back to empty string
    const actualSlug = slug === '__home__' ? '' : slug
    
    const db = await getDatabase()
    const collection = db.collection('cms_content')
    
    // Get latest version of this content
    const content = await collection.findOne({ slug: actualSlug }, { sort: { version: -1 } })
    
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      )
    }
    
    const response: CMSContentResponse = {
      success: true,
      data: content as unknown as CMSContent
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

// PUT /api/cms/content/[slug] - Update content by creating new version
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug } = await params
    const body: UpdateContentRequest = await request.json()
    
    // Convert special homepage placeholder back to empty string
    const actualSlug = slug === '__home__' ? '' : slug
    
    const db = await getDatabase()
    const collection = db.collection('cms_content')
    
    // Get latest version of content
    const currentContent = await collection.findOne({ slug: actualSlug }, { sort: { version: -1 } }) as CMSContent | null
    
    if (!currentContent) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      )
    }
    
    const now = new Date()
    const userId = await getCurrentUserId(request)
    
    // New refined approach:
    // - If current version is draft: Update in-place
    // - If current version is published: Create new draft version
    
    if (currentContent.status === 'draft') {
      // Current version is draft - update in-place
      const updateData: any = {
        updatedBy: userId,
        updatedAt: now
      }
      
      // Update with provided data
      if (body.title !== undefined) updateData.title = body.title
      
      // Handle slug changes - only allow if content has never been published
      if (body.slug !== undefined && !currentContent.publishedAt) {
        updateData.slug = body.slug
      }
      
      if (body.blocks !== undefined) updateData.blocks = body.blocks
      if (body.seo !== undefined) updateData.seo = { ...currentContent.seo, ...body.seo }
      if (body.status !== undefined) updateData.status = body.status
      if (body.scheduledPublishAt !== undefined) updateData.scheduledPublishAt = body.scheduledPublishAt
      
      // Blog-specific updates
      if (currentContent.type === 'blog') {
        if (body.blogCategory !== undefined) updateData.blogCategory = body.blogCategory
        if (body.blogTags !== undefined) updateData.blogTags = body.blogTags
        if (body.blogAuthor !== undefined) updateData.blogAuthor = body.blogAuthor
        if (body.blogFeaturedImage !== undefined) updateData.blogFeaturedImage = body.blogFeaturedImage
        if (body.blogExcerpt !== undefined) updateData.blogExcerpt = body.blogExcerpt
        
        // Recalculate read time if blocks are updated
        if (body.blocks !== undefined) {
          const wordsPerMinute = 200
          let totalWords = 0
          
          body.blocks.forEach(block => {
            if (block.type === 'text' && (block.content as any)?.text) {
              const textContent = (block.content as any).text.replace(/<[^>]*>/g, '')
              totalWords += textContent.split(/\s+/).length
            }
          })
          
          updateData.blogReadTime = Math.max(1, Math.ceil(totalWords / wordsPerMinute))
        }
      }
      
      // Set publishedAt if changing from draft to published
      if (body.status === 'published') {
        updateData.publishedAt = now
      }
      
      const result = await collection.updateOne(
        { slug: actualSlug, version: currentContent.version },
        { $set: updateData }
      )
      
      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Content version not found' },
          { status: 404 }
        )
      }
      
      // Return the updated content
      const updatedContent = await collection.findOne({ slug: actualSlug, version: currentContent.version })
      
      // Trigger revalidation for published blog posts
      let revalidationResult = { success: false }
      if (updatedContent?.type === 'blog' && updatedContent?.status === 'published') {
        revalidationResult = await revalidateBlog(updatedContent.slug, updatedContent.blogAuthor)
        if (!revalidationResult.success) {
          console.warn('Failed to revalidate blog pages after update:', (revalidationResult as any).error || 'Unknown error')
        }
      }
      
      return NextResponse.json({
        success: true,
        data: updatedContent,
        revalidated: revalidationResult.success
      })
    } else {
      // Current version is published - create new draft version
      const newVersion = currentContent.version + 1
      
      const { _id, ...contentWithoutId } = currentContent
      const newDraftContent: Omit<CMSContent, '_id'> = {
        // Start with existing published content
        ...contentWithoutId,
        
        // Apply the updates
        ...(body.title !== undefined && { title: body.title }),
        // Note: slug changes are not allowed for published content to preserve links
        ...(body.blocks !== undefined && { blocks: body.blocks }),
        ...(body.seo !== undefined && { seo: { ...currentContent.seo, ...body.seo } }),
        ...(body.scheduledPublishAt !== undefined && { scheduledPublishAt: body.scheduledPublishAt }),
        
        // Blog-specific updates
        ...(currentContent.type === 'blog' && {
          ...(body.blogCategory !== undefined && { blogCategory: body.blogCategory }),
          ...(body.blogTags !== undefined && { blogTags: body.blogTags }),
          ...(body.blogAuthor !== undefined && { blogAuthor: body.blogAuthor }),
          ...(body.blogFeaturedImage !== undefined && { blogFeaturedImage: body.blogFeaturedImage }),
          ...(body.blogExcerpt !== undefined && { blogExcerpt: body.blogExcerpt })
        }),
        
        // New draft version
        version: newVersion,
        status: body.status || 'draft', // Default to draft unless explicitly published
        publishedAt: body.status === 'published' ? now : undefined,
        updatedBy: userId,
        updatedAt: now
      }
      
      // Recalculate read time for blog posts if blocks are updated
      if (currentContent.type === 'blog' && body.blocks !== undefined) {
        const wordsPerMinute = 200
        let totalWords = 0
        
        body.blocks.forEach(block => {
          if (block.type === 'text' && (block.content as any)?.text) {
            const textContent = (block.content as any).text.replace(/<[^>]*>/g, '')
            totalWords += textContent.split(/\s+/).length
          }
        })
        
        newDraftContent.blogReadTime = Math.max(1, Math.ceil(totalWords / wordsPerMinute))
      }
      
      // Insert the new draft version
      const result = await collection.insertOne(newDraftContent)
      
      // Return the new draft content
      const newContent = await collection.findOne({ _id: result.insertedId })
      
      // Trigger revalidation for published blog posts
      let revalidationResult = { success: false }
      if (newContent?.type === 'blog' && newContent?.status === 'published') {
        revalidationResult = await revalidateBlog(newContent.slug, newContent.blogAuthor)
        if (!revalidationResult.success) {
          console.warn('Failed to revalidate blog pages after update:', (revalidationResult as any).error || 'Unknown error')
        }
      }
      
      return NextResponse.json({
        success: true,
        data: newContent,
        revalidated: revalidationResult.success
      })
    }
  } catch (error) {
    console.error('Failed to update CMS content:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update content' },
      { status: 500 }
    )
  }
}

// DELETE /api/cms/content/[slug] - Delete all versions of content
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug } = await params
    
    // Convert special homepage placeholder back to empty string
    const actualSlug = slug === '__home__' ? '' : slug
    
    const db = await getDatabase()
    const collection = db.collection('cms_content')
    
    // Delete all versions of this content
    const result = await collection.deleteMany({ slug: actualSlug })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: { message: `Content deleted successfully (${result.deletedCount} versions removed)` }
    })
  } catch (error) {
    console.error('Failed to delete CMS content:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete content' },
      { status: 500 }
    )
  }
}