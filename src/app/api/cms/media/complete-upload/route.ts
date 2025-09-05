import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import Mux from '@mux/mux-node'
import { getMuxTokenId, getMuxTokenSecret } from '@/lib/env'
import { getCurrentUserId } from '@/lib/auth-utils'
import { MediaAsset } from '@/types/cms'

// Initialize Mux client
const mux = new Mux({
  tokenId: getMuxTokenId(),
  tokenSecret: getMuxTokenSecret(),
})

// POST /api/cms/media/complete-upload - Complete video upload and save to database
export async function POST(request: NextRequest) {
  try {
    const { uploadId } = await request.json()

    if (!uploadId) {
      return NextResponse.json(
        { success: false, error: 'Upload ID is required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const assetsCollection = db.collection('cms_media_assets')
    const userId = await getCurrentUserId(request)
    const now = new Date()

    // Get upload details from Mux
    const upload = await mux.video.uploads.retrieve(uploadId)
    
    if (!upload.asset_id) {
      return NextResponse.json(
        { success: false, error: 'Asset not yet created, please try again' },
        { status: 400 }
      )
    }

    // Get asset details from Mux with retry logic for dimensions
    const asset = await mux.video.assets.retrieve(upload.asset_id)
    
    // Helper function to get dimensions with retry logic
    const getDimensionsWithRetry = async (maxRetries = 3, delay = 1000): Promise<{ width: number; height: number }> => {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const videoTrack = asset.tracks?.find((track: any) => track.type === 'video')
        if (videoTrack) {
          const width = (videoTrack as any).max_width || 0
          const height = (videoTrack as any).max_height || 0
          
          if (width > 0 && height > 0) {
            console.log(`✅ Got dimensions on attempt ${attempt + 1}: ${width}x${height}`)
            return { width, height }
          }
        }
        
        if (attempt < maxRetries - 1) {
          console.log(`⏳ Dimensions not ready, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, delay))
          delay *= 2 // Exponential backoff
          
          // Refetch asset data for retry
          try {
            const updatedAsset = await mux.video.assets.retrieve(upload.asset_id!)
            Object.assign(asset, updatedAsset)
          } catch (error) {
            console.warn('Failed to refetch asset on retry:', error)
          }
        }
      }
      
      console.warn(`⚠️ Could not get valid dimensions after ${maxRetries} attempts, using 0x0`)
      return { width: 0, height: 0 }
    }
    
    // Parse passthrough data that we stored during upload URL creation
    let metadata = {}
    try {
      metadata = JSON.parse(upload.new_asset_settings?.passthrough || '{}')
    } catch (e) {
      console.warn('Failed to parse passthrough metadata:', e)
    }

    // Get playback ID (first public playback policy)
    const playbackId = asset.playback_ids?.find(p => p.policy === 'public')?.id
    
    if (!playbackId) {
      console.error('No public playback ID found for asset:', asset.id)
      return NextResponse.json(
        { success: false, error: 'No playback URL available' },
        { status: 500 }
      )
    }

    // Construct URLs for video playback
    const baseUrl = `https://stream.mux.com/${playbackId}`
    const thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg?time=1`

    // Get file size from original file size passed through during upload
    const fileSize = (metadata as any).originalFileSize || 0

    // Create MediaAsset document
    const mediaAsset: Omit<MediaAsset, '_id'> = {
      url: `${baseUrl}.m3u8`, // HLS stream URL
      thumbnailUrl,
      type: 'video',
      filename: (metadata as any).filename || 'video.mp4',
      size: fileSize, // File size from Mux static renditions
      dimensions: await getDimensionsWithRetry(),
      alt: (metadata as any).alt || '',
      caption: (metadata as any).caption || '',
      tags: (metadata as any).tags || [],
      folderId: (metadata as any).folderId || undefined,
      metadata: {
        mimeType: 'video/mp4',
        uploadedBy: userId,
        originalName: (metadata as any).filename || 'video.mp4',
        streamUrl: `${baseUrl}.m3u8`,
        dashUrl: `${baseUrl}.mpd`,
        status: asset.status,
        duration: asset.duration ? `${asset.duration}s` : undefined,
        muxAssetId: asset.id,
        muxPlaybackId: playbackId
      },
      createdAt: now,
      updatedAt: now
    }

    // Save to database
    const result = await assetsCollection.insertOne(mediaAsset)
    const createdAsset = await assetsCollection.findOne({ _id: result.insertedId })

    return NextResponse.json({
      success: true,
      data: createdAsset
    })

  } catch (error) {
    console.error('Failed to complete upload:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to complete upload' },
      { status: 500 }
    )
  }
}