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

// DELETE /api/cms/media/[id] - Delete media asset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params
    
    const db = await getDatabase()
    const collection = db.collection('cms_media_assets')
    
    // Get asset to find Cloudflare ID
    const asset = await collection.findOne({ _id: new ObjectId(id) })
    
    if (!asset) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      )
    }
    
    // Delete from appropriate service (Cloudflare or Mux)
    try {
      const cloudflareId = asset.metadata?.cloudflareId
      const muxAssetId = asset.metadata?.muxAssetId
      
      console.log(`Attempting to delete ${asset.type} with cloudflareId: ${cloudflareId}, muxAssetId: ${muxAssetId}`)
      
      if (asset.type === 'image' && cloudflareId) {
        console.log('Deleting image from Cloudflare...')
        await deleteImageFromCloudflare(cloudflareId)
        console.log('Image deleted from Cloudflare successfully')
      } else if (asset.type === 'video') {
        // Check if it's a Mux video or Cloudflare video
        if (muxAssetId || isMuxUrl(asset.url)) {
          const assetId = muxAssetId || cloudflareId
          if (assetId) {
            console.log('Deleting video from Mux...')
            await deleteVideoFromMux(assetId)
            console.log('Video deleted from Mux successfully')
          }
        } else if (cloudflareId) {
          // Legacy Cloudflare Stream video
          console.log('Deleting video from Cloudflare...')
          await deleteVideoFromCloudflare(cloudflareId)
          console.log('Video deleted from Cloudflare successfully')
        }
      }
    } catch (deleteError) {
      console.error('Error deleting from external service:', deleteError)
      // Continue with database deletion even if external service deletion fails
      // This prevents orphaned database records
    }
    
    // Delete from database
    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Asset deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete media asset:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete media asset' },
      { status: 500 }
    )
  }
}