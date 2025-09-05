import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { MediaAsset, MediaAssetResponse } from '@/types/cms'
import { getCurrentUserId } from '@/lib/auth-utils'
import { deleteImageFromCloudflare, deleteVideoFromCloudflare } from '@/lib/cloudflare'
import { deleteVideoFromMux, isMuxUrl } from '@/lib/mux'

interface Params {
  id: string
}

// GET /api/cms/media/[id] - Get single media asset
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params
    
    const db = await getDatabase()
    const collection = db.collection('cms_media_assets')
    
    const asset = await collection.findOne({ _id: new ObjectId(id) })
    
    if (!asset) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      )
    }
    
    const response: MediaAssetResponse = {
      success: true,
      data: asset as unknown as MediaAsset
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to fetch media asset:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch media asset' },
      { status: 500 }
    )
  }
}

// PUT /api/cms/media/[id] - Update media asset metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { alt, caption, tags } = body
    
    const db = await getDatabase()
    const collection = db.collection('cms_media_assets')
    
    const updateData: any = {
      updatedAt: new Date(),
      updatedBy: await getCurrentUserId(request)
    }
    
    if (alt !== undefined) updateData.alt = alt
    if (caption !== undefined) updateData.caption = caption
    if (tags !== undefined) updateData.tags = tags
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      )
    }
    
    const updatedAsset = await collection.findOne({ _id: new ObjectId(id) })
    
    const response: MediaAssetResponse = {
      success: true,
      data: updatedAsset as unknown as MediaAsset
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to update media asset:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update media asset' },
      { status: 500 }
    )
  }
}

// DELETE /api/cms/media/[id] - Soft delete media asset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params
    
    const db = await getDatabase()
    const collection = db.collection('cms_media_assets')
    
    // Check if asset exists and is not already deleted
    const asset = await collection.findOne({ 
      _id: new ObjectId(id),
      deletedAt: { $exists: false }
    })
    
    if (!asset) {
      return NextResponse.json(
        { success: false, error: 'Asset not found or already deleted' },
        { status: 404 }
      )
    }
    
    // Soft delete: Update asset with deletion timestamp and user
    const currentUserId = await getCurrentUserId(request)
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          deletedAt: new Date(),
          deletedBy: currentUserId,
          updatedAt: new Date()
        }
      }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      )
    }
    
    console.log(`Soft deleted media asset: ${asset.filename} (ID: ${id}) - Media files preserved in external services`)
    
    return NextResponse.json({
      success: true,
      message: 'Asset moved to trash successfully'
    })
  } catch (error) {
    console.error('Failed to delete media asset:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete media asset' },
      { status: 500 }
    )
  }
}