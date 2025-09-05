import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import crypto from 'crypto'
import Mux from '@mux/mux-node'
import { getMuxTokenId, getMuxTokenSecret } from '@/lib/env'

// Initialize Mux client
const mux = new Mux({
  tokenId: getMuxTokenId(),
  tokenSecret: getMuxTokenSecret(),
})

// POST /api/webhooks/mux - Handle Mux webhook events
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('mux-signature')
    
    // Verify webhook signature (for security)
    if (!signature || !process.env.MUX_WEBHOOK_SECRET) {
      console.warn('Missing Mux webhook signature or secret')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse Mux signature format: "t=<timestamp>,v1=<signature>"
    const signatureParts = signature.split(',')
    let timestamp = ''
    let signatureHash = ''
    
    for (const part of signatureParts) {
      const [key, value] = part.split('=')
      if (key === 't') {
        timestamp = value
      } else if (key === 'v1') {
        signatureHash = value
      }
    }
    
    if (!timestamp || !signatureHash) {
      console.warn('Invalid Mux signature format - missing timestamp or hash')
      return NextResponse.json({ error: 'Invalid signature format' }, { status: 401 })
    }

    // Verify the signature according to Mux documentation
    // Create signed payload: timestamp.raw_request_body
    const signedPayload = `${timestamp}.${rawBody}`
    const expectedSignature = crypto
      .createHmac('sha256', process.env.MUX_WEBHOOK_SECRET)
      .update(signedPayload)
      .digest('hex')
    
    if (expectedSignature !== signatureHash) {
      console.warn('Invalid Mux webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)
    console.log('Mux webhook event received:', event.type, event.data?.id)

    const db = await getDatabase()
    const assetsCollection = db.collection('cms_media_assets')

    switch (event.type) {
      case 'video.asset.ready':
        {
          const assetId = event.data.id
          const playbackIds = event.data.playback_ids || []
          const duration = event.data.duration
          const tracks = event.data.tracks || []
          
          // Find video track for dimensions
          const videoTrack = tracks.find((track: any) => track.type === 'video')
          const dimensions = videoTrack ? {
            width: videoTrack.max_width || 0,
            height: videoTrack.max_height || 0
          } : undefined

          // Fetch complete asset details from Mux API to get file size
          let fileSize = 0
          
          try {
            const asset = await mux.video.assets.retrieve(assetId)
            
            if (asset.static_renditions?.files && asset.static_renditions.files.length > 0) {
              const fileSizes = asset.static_renditions.files.map((file: any) => file.filesize || 0)
              fileSize = Math.max(...fileSizes)
            }
          } catch (error) {
            console.error('Error fetching asset from Mux API:', error)
          }

          // Prepare update object
          const updateData: any = {
            'metadata.status': 'ready',
            'metadata.duration': duration,
            'metadata.muxPlaybackId': playbackIds[0]?.id,
            dimensions: dimensions,
            updatedAt: new Date()
          }

          // Only update size if we have actual data from Mux
          if (fileSize > 0) {
            updateData.size = fileSize
          }

          // Update the database record with ready status and metadata
          const updateResult = await assetsCollection.updateOne(
            { 'metadata.muxAssetId': assetId },
            { $set: updateData }
          )

          if (updateResult.modifiedCount > 0) {
            console.log(`Updated asset with Mux asset ID: ${assetId}`)
          } else {
            console.warn(`No asset found with Mux asset ID: ${assetId}`)
          }
        }
        break

      case 'video.asset.errored':
        {
          const assetId = event.data.id
          const errors = event.data.errors || []

          // Update the database record with error status
          const updateResult = await assetsCollection.updateOne(
            { 'metadata.muxAssetId': assetId },
            {
              $set: {
                'metadata.status': 'error',
                'metadata.errors': errors,
                updatedAt: new Date()
              }
            }
          )

          if (updateResult.modifiedCount > 0) {
            console.error(`Asset errored with Mux asset ID: ${assetId}`, errors)
          }
        }
        break

      case 'video.upload.asset_created':
        {
          const uploadId = event.data.id
          const assetId = event.data.asset_id

          // Update any pending uploads with the asset ID
          if (assetId) {
            const updateResult = await assetsCollection.updateOne(
              { 'metadata.muxUploadId': uploadId },
              {
                $set: {
                  'metadata.muxAssetId': assetId,
                  updatedAt: new Date()
                }
              }
            )

            if (updateResult.modifiedCount > 0) {
              console.log(`Linked upload ${uploadId} to asset ${assetId}`)
            }
          }
        }
        break

      case 'video.upload.cancelled':
      case 'video.upload.errored':
        {
          const uploadId = event.data.id
          const errors = event.data.errors || []

          // Update upload status to error
          const updateResult = await assetsCollection.updateOne(
            { 'metadata.muxUploadId': uploadId },
            {
              $set: {
                'metadata.status': 'error',
                'metadata.errors': errors,
                updatedAt: new Date()
              }
            }
          )

          if (updateResult.modifiedCount > 0) {
            console.error(`Upload failed: ${uploadId}`, errors)
          }
        }
        break

      default:
        console.log(`Unhandled Mux webhook event: ${event.type}`)
        break
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Failed to process Mux webhook:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}