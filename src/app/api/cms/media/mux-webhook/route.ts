import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import Mux from '@mux/mux-node'
import { getMuxTokenId, getMuxTokenSecret } from '@/lib/env'

// Initialize Mux client
const mux = new Mux({
  tokenId: getMuxTokenId(),
  tokenSecret: getMuxTokenSecret(),
})

// POST /api/cms/media/mux-webhook - Handle Mux webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🔗 Mux webhook received:', body.type)
    
    // Only process video.asset.ready events
    if (body.type !== 'video.asset.ready') {
      console.log('⏭️ Ignoring webhook type:', body.type)
      return NextResponse.json({ received: true })
    }
    
    const assetId = body.data?.id
    if (!assetId) {
      console.warn('⚠️ No asset ID in webhook data')
      return NextResponse.json({ error: 'No asset ID' }, { status: 400 })
    }
    
    console.log('🎬 Processing video.asset.ready for asset:', assetId)
    
    const db = await getDatabase()
    const assetsCollection = db.collection('cms_media_assets')
    
    // Find the asset in our database
    const dbAsset = await assetsCollection.findOne({
      'metadata.muxAssetId': assetId
    })
    
    if (!dbAsset) {
      console.warn('⚠️ Asset not found in database:', assetId)
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }
    
    console.log('📝 Found asset in DB:', dbAsset.filename)
    
    // Check if dimensions need updating
    const currentDimensions = dbAsset.dimensions
    if (currentDimensions?.width > 0 && currentDimensions?.height > 0) {
      console.log('✅ Asset already has valid dimensions:', currentDimensions)
      return NextResponse.json({ message: 'Asset already has dimensions' })
    }
    
    console.log('🔄 Fetching updated dimensions from Mux...')
    
    try {
      // Get fresh asset data from Mux
      const asset = await mux.video.assets.retrieve(assetId)
      
      // Extract dimensions
      const videoTrack = asset.tracks?.find((track: any) => track.type === 'video')
      if (videoTrack) {
        const width = (videoTrack as any).max_width || 0
        const height = (videoTrack as any).max_height || 0
        
        if (width > 0 && height > 0) {
          console.log(`📐 Updating dimensions to ${width}x${height}`)
          
          // Update the asset in database
          await assetsCollection.updateOne(
            { _id: dbAsset._id },
            { 
              $set: { 
                dimensions: { width, height },
                updatedAt: new Date()
              } 
            }
          )
          
          console.log('✅ Successfully updated asset dimensions via webhook')
          return NextResponse.json({ 
            message: 'Dimensions updated',
            dimensions: { width, height }
          })
          
        } else {
          console.warn('⚠️ Still no valid dimensions in ready asset')
        }
      } else {
        console.warn('⚠️ No video track found in ready asset')
      }
      
    } catch (muxError) {
      console.error('❌ Error fetching asset from Mux:', muxError)
    }
    
    return NextResponse.json({ message: 'Webhook processed but dimensions not updated' })
    
  } catch (error) {
    console.error('❌ Mux webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}