import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { MediaAssetResponse } from '@/types/cms'
import { getCurrentUserId } from '@/lib/auth-utils'
import { getImageMetadata } from '@/lib/cloudflare'
import { getVideoMetadata, isMuxUrl } from '@/lib/mux'

interface Params {
  id: string
}

// POST /api/cms/media/[id]/restore - Restore soft-deleted media asset
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params
    
    const db = await getDatabase()
    const collection = db.collection('cms_media_assets')
    
    // Check if asset exists and is soft-deleted
    const asset = await collection.findOne({ 
      _id: new ObjectId(id),
      deletedAt: { $exists: true }
    })
    
    if (!asset) {
      return NextResponse.json(
        { success: false, error: 'Asset not found in trash' },
        { status: 404 }
      )
    }
    
    // Verify that media still exists in external service before restoring
    try {
      if (asset.type === 'image' && asset.metadata?.cloudflareId) {
        const metadata = await getImageMetadata(asset.metadata.cloudflareId)
        if (!metadata) {
          console.warn(`Image no longer exists in Cloudflare: ${asset.metadata.cloudflareId}`)
          // Don't fail restore - just log warning
        }
      } else if (asset.type === 'video' && (asset.metadata?.muxAssetId || isMuxUrl(asset.url))) {
        const assetId = asset.metadata?.muxAssetId || asset.metadata?.cloudflareId
        if (assetId) {
          const metadata = await getVideoMetadata(assetId)
          if (!metadata) {
            console.warn(`Video no longer exists in Mux: ${assetId}`)
            // Don't fail restore - just log warning
          }
        }
      }
    } catch (verifyError) {
      console.warn('Could not verify external media exists:', verifyError)
      // Continue with restore anyway
    }
    
    // Restore: Remove deletion fields
    const currentUserId = await getCurrentUserId(request)
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $unset: {
          deletedAt: "",
          deletedBy: ""
        },
        $set: {
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
    
    // Get the restored asset
    const restoredAsset = await collection.findOne({ _id: new ObjectId(id) })
    
    console.log(`Restored media asset: ${asset.filename} (ID: ${id})`)
    
    const response: MediaAssetResponse = {
      success: true,
      data: restoredAsset as any,
      message: 'Asset restored successfully'
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to restore media asset:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to restore media asset' },
      { status: 500 }
    )
  }
}